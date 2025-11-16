"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loginClient,
  registerClient,
  verifyEmail,
  passwordResetRequest,
  passwordResetConfirm,
  ecommerceClientProfileMeRetrieve,
  ecommerceClientCartGetOrCreateRetrieve,
} from "@/api/generated/api";
import type {
  EcommerceClient,
  ClientLoginRequest,
  ClientRegistrationRequest,
  EmailVerificationRequestRequest,
  PasswordResetRequestRequest,
  PasswordResetConfirmRequest,
} from "@/api/generated/interfaces";
import { toast } from "sonner";

interface AuthContextType {
  user: EcommerceClient | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: ClientLoginRequest) => Promise<void>;
  register: (data: ClientRegistrationRequest) => Promise<{ verificationToken: string }>;
  verifyEmailCode: (data: EmailVerificationRequestRequest) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirmRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);

  // Check if user has tokens on mount
  useEffect(() => {
    const accessToken = localStorage.getItem("ecommerce_access_token");
    setIsInitialized(!!accessToken);
    setHasCheckedToken(true);
  }, []);

  // Fetch current user profile
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: refetchUser,
    isError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: ecommerceClientProfileMeRetrieve,
    enabled: isInitialized && hasCheckedToken,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Automatically get or create cart when user is authenticated
  useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const response = await ecommerceClientCartGetOrCreateRetrieve();
      // API returns { cart: {...} } but generated type expects Cart directly
      return (response as any).cart || response;
    },
    enabled: !!user && isInitialized,
    staleTime: 0,
    retry: 1,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginClient,
    onSuccess: (response: any) => {
      // Store tokens
      if (response.access) {
        localStorage.setItem("ecommerce_access_token", response.access);
      }
      if (response.refresh) {
        localStorage.setItem("ecommerce_refresh_token", response.refresh);
      }
      // Store user data
      localStorage.setItem("ecommerce_user", JSON.stringify(response.client || response));

      setIsInitialized(true);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Login successful!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Login failed. Please check your credentials.";
      toast.error(message);
      throw error;
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: registerClient,
    onSuccess: () => {
      toast.success("Registration successful! Please check your email for verification code.");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Registration failed. Please try again.";
      toast.error(message);
      throw error;
    },
  });

  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (response) => {
      // Store tokens after verification
      if (response.access) {
        localStorage.setItem("ecommerce_access_token", response.access);
      }
      if (response.refresh) {
        localStorage.setItem("ecommerce_refresh_token", response.refresh);
      }
      localStorage.setItem("ecommerce_user", JSON.stringify(response.client));

      setIsInitialized(true);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Email verified successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Verification failed. Please try again.";
      toast.error(message);
      throw error;
    },
  });

  // Password reset request mutation
  const passwordResetRequestMutation = useMutation({
    mutationFn: passwordResetRequest,
    onSuccess: () => {
      toast.success("Password reset code sent to your email.");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to send reset code.";
      toast.error(message);
      throw error;
    },
  });

  // Password reset confirm mutation
  const passwordResetConfirmMutation = useMutation({
    mutationFn: passwordResetConfirm,
    onSuccess: () => {
      toast.success("Password reset successful! You can now login with your new password.");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to reset password.";
      toast.error(message);
      throw error;
    },
  });

  const login = async (data: ClientLoginRequest) => {
    await loginMutation.mutateAsync(data);
  };

  const register = async (data: ClientRegistrationRequest) => {
    const response = await registerMutation.mutateAsync(data);
    return { verificationToken: response.verification_token };
  };

  const verifyEmailCode = async (data: EmailVerificationRequestRequest) => {
    await verifyEmailMutation.mutateAsync(data);
  };

  const logout = () => {
    localStorage.removeItem("ecommerce_access_token");
    localStorage.removeItem("ecommerce_refresh_token");
    localStorage.removeItem("ecommerce_user");
    setIsInitialized(false);
    setHasCheckedToken(true); // Keep as checked to avoid loading state
    queryClient.clear();
    toast.success("Logged out successfully");
    // Redirect to home page after logout
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const requestPasswordResetFn = async (email: string) => {
    await passwordResetRequestMutation.mutateAsync({ email });
  };

  const confirmPasswordResetFn = async (data: PasswordResetConfirmRequest) => {
    await passwordResetConfirmMutation.mutateAsync(data);
  };

  // Clear tokens if fetch fails (e.g., expired token)
  useEffect(() => {
    if (isError && isInitialized) {
      // Token might be invalid/expired, clear it
      localStorage.removeItem("ecommerce_access_token");
      localStorage.removeItem("ecommerce_refresh_token");
      localStorage.removeItem("ecommerce_user");
      setIsInitialized(false);
    }
  }, [isError, isInitialized]);

  const value: AuthContextType = {
    user: user || null,
    isLoading: !hasCheckedToken || (isInitialized && isUserLoading),
    isAuthenticated: !!user && isInitialized && !isError,
    login,
    register,
    verifyEmailCode,
    logout,
    requestPasswordReset: requestPasswordResetFn,
    confirmPasswordReset: confirmPasswordResetFn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
