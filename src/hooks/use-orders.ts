import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientOrdersList,
  ecommerceClientOrdersRetrieve,
  ecommerceClientOrdersCreate,
} from "@/api/generated/api";
import axios from "@/api/axios";
import type { Order, OrderCreateRequest } from "@/api/generated/interfaces";
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

// Hook for fetching single order. When `publicToken` is supplied, hits
// the public lookup endpoint that doesn't require auth — used by the
// guest-checkout flow to render the order-confirmation page after a
// guest places an order. Direct axios call instead of the generated
// client because the generator runs against the live schema and the
// new endpoint may not be regenerated yet on this branch.
export function useOrder(id: string | null, publicToken?: string | null) {
  const { isAuthenticated } = useAuth();
  const useTokenPath = !!publicToken;

  return useQuery({
    queryKey: ["order", id, publicToken],
    queryFn: async () => {
      if (useTokenPath) {
        const res = await axios.get<Order>(
          `/api/ecommerce/client/orders/by-token/?token=${encodeURIComponent(publicToken!)}`,
        );
        return res.data;
      }
      return ecommerceClientOrdersRetrieve(id!) as Promise<Order>;
    },
    enabled: useTokenPath ? true : isAuthenticated && !!id,
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

      // Generated return type is OrderCreate but the API actually returns a full Order
      const order = data as unknown as Order;
      if (order.payment_url) {
        window.location.href = order.payment_url;
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to create order";
      toast.error(message);
    },
  });
}
