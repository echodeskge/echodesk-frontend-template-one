"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useStorefrontTemplate } from "@/hooks/use-storefront-template";
import { VoltageAccountPage } from "@/templates/voltage/pages/account";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientProfileUpdateProfilePartialUpdate,
  ecommerceClientsChangePasswordCreate,
} from "@/api/generated/api";
import type { PatchedEcommerceClientRequest } from "@/api/generated/interfaces";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChevronLeft, Loader2, User, Lock } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t } = useLanguage();
  const { template } = useStorefrontTemplate();

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    date_of_birth: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth || "",
      });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: (data: PatchedEcommerceClientRequest) =>
      ecommerceClientProfileUpdateProfilePartialUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success(t("profile.updateSuccess") || "Profile updated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || t("profile.updateFailed") || "Failed to update profile";
      toast.error(message);
    },
  });

  // Password change mutation
  const passwordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      ecommerceClientsChangePasswordCreate(data),
    onSuccess: () => {
      toast.success(t("profile.passwordChanged") || "Password changed successfully");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordErrors([]);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.current_password?.[0] ||
        t("profile.passwordChangeFailed") ||
        "Failed to change password";
      toast.error(message);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: PatchedEcommerceClientRequest = {
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      phone_number: profileForm.phone_number,
    };
    if (profileForm.date_of_birth) {
      data.date_of_birth = profileForm.date_of_birth;
    }
    profileMutation.mutate(data);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (passwordForm.new_password.length < 8) {
      errors.push(t("profile.passwordMinLength") || "Password must be at least 8 characters");
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.push(t("profile.passwordMismatch") || "Passwords do not match");
    }

    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors([]);
    passwordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });
  };

  // Voltage tenants get the unified account dashboard pre-selected on
  // the Profile tab. The classic profile body still renders for
  // tenants on the classic template.
  if (template === "voltage" && isAuthenticated) {
    return (
      <StoreLayout>
        <VoltageAccountPage defaultTab="profile" />
      </StoreLayout>
    );
  }

  if (isAuthLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <Skeleton className="mb-6 h-5 w-64" />
          <Skeleton className="mb-4 h-8 w-32" />
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </CardContent>
            </Card>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <StoreLayout>
      <div className="container py-8">
        <Breadcrumbs
          items={[
            { label: t("common.myAccount") || "My Account", href: "/account" },
            { label: t("profile.title") || "Profile" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/account">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("common.myAccount")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{t("profile.title") || "Profile"}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("profile.subtitle") || "Manage your personal information"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Form */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <User className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>{t("profile.personalInfo") || "Personal Information"}</CardTitle>
                <CardDescription>
                  {t("profile.personalInfoDesc") || "Update your name, phone, and date of birth"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit}>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">
                        {t("profile.firstName") || "First Name"}
                      </Label>
                      <Input
                        id="first_name"
                        value={profileForm.first_name}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            first_name: e.target.value,
                          }))
                        }
                        disabled={profileMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">
                        {t("profile.lastName") || "Last Name"}
                      </Label>
                      <Input
                        id="last_name"
                        value={profileForm.last_name}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            last_name: e.target.value,
                          }))
                        }
                        disabled={profileMutation.isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("profile.email") || "Email"}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("profile.emailReadOnly") || "Email cannot be changed"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">{t("profile.phone") || "Phone"}</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          phone_number: e.target.value,
                        }))
                      }
                      disabled={profileMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">
                      {t("profile.dateOfBirth") || "Date of Birth"}
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          date_of_birth: e.target.value,
                        }))
                      }
                      disabled={profileMutation.isPending}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={profileMutation.isPending}>
                      {profileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common.saving") || "Saving..."}
                        </>
                      ) : (
                        t("profile.saveProfile") || "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Change Password */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Lock className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>{t("profile.changePassword") || "Change Password"}</CardTitle>
                <CardDescription>
                  {t("profile.changePasswordDesc") ||
                    "Update your password to keep your account secure"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">
                      {t("profile.currentPassword") || "Current Password"}
                    </Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          current_password: e.target.value,
                        }))
                      }
                      disabled={passwordMutation.isPending}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">
                      {t("profile.newPassword") || "New Password"}
                    </Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          new_password: e.target.value,
                        }))
                      }
                      disabled={passwordMutation.isPending}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">
                      {t("profile.confirmNewPassword") || "Confirm New Password"}
                    </Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirm_password: e.target.value,
                        }))
                      }
                      disabled={passwordMutation.isPending}
                      required
                      minLength={8}
                    />
                  </div>

                  {passwordErrors.length > 0 && (
                    <div className="rounded-md bg-destructive/10 p-3">
                      {passwordErrors.map((error, i) => (
                        <p key={i} className="text-sm text-destructive">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={passwordMutation.isPending}>
                      {passwordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("profile.changingPassword") || "Changing..."}
                        </>
                      ) : (
                        t("profile.changePasswordBtn") || "Change Password"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}
