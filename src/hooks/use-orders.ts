import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientOrdersList,
  ecommerceClientOrdersRetrieve,
  ecommerceClientOrdersCreate,
} from "@/api/generated/api";
import type { OrderCreateRequest } from "@/api/generated/interfaces";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

// Hook for fetching orders list
export function useOrders(page?: number, ordering?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["orders", page, ordering],
    queryFn: () => ecommerceClientOrdersList(ordering, page),
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook for fetching single order
export function useOrder(id: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["order", id],
    queryFn: () => ecommerceClientOrdersRetrieve(id!),
    enabled: isAuthenticated && !!id,
    staleTime: 60 * 1000,
  });
}

// Hook for creating order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrderCreateRequest) => ecommerceClientOrdersCreate(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cartItems"] });
      toast.success("Order placed successfully!");

      // If payment URL is returned, redirect to it
      if ((data as any).payment_url) {
        window.location.href = (data as any).payment_url;
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to create order";
      toast.error(message);
    },
  });
}
