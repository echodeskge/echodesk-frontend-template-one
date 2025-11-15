import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientAddressesList,
  ecommerceClientAddressesRetrieve,
  ecommerceClientAddressesCreate,
  ecommerceClientAddressesUpdate,
  ecommerceClientAddressesDestroy,
  ecommerceClientAddressesSetDefaultCreate,
} from "@/api/generated/api";
import type {
  ClientAddressRequest,
  PatchedClientAddressRequest,
} from "@/api/generated/interfaces";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

// Hook for fetching addresses
export function useAddresses(page?: number) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["addresses", page],
    queryFn: () => ecommerceClientAddressesList(undefined, page),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching single address
export function useAddress(id: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["address", id],
    queryFn: () => ecommerceClientAddressesRetrieve(id!),
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for creating address
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientAddressRequest) => ecommerceClientAddressesCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Address added successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to add address";
      toast.error(message);
    },
  });
}

// Hook for updating address
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientAddressRequest }) =>
      ecommerceClientAddressesUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Address updated successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to update address";
      toast.error(message);
    },
  });
}

// Hook for deleting address
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ecommerceClientAddressesDestroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Address deleted successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to delete address";
      toast.error(message);
    },
  });
}

// Hook for setting default address
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientAddressRequest }) =>
      ecommerceClientAddressesSetDefaultCreate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Default address updated!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to set default address";
      toast.error(message);
    },
  });
}
