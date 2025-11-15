import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientCartGetOrCreateRetrieve,
  ecommerceClientCartItemsList,
  ecommerceClientCartItemsCreate,
  ecommerceClientCartItemsPartialUpdate,
  ecommerceClientCartItemsDestroy,
} from "@/api/generated/api";
import type {
  Cart,
  CartItem,
  CartItemCreateRequest,
  PatchedCartItemCreateRequest,
} from "@/api/generated/interfaces";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

// Hook for getting or creating cart
export function useCart() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["cart"],
    queryFn: ecommerceClientCartGetOrCreateRetrieve,
    enabled: isAuthenticated,
    staleTime: 0, // Always fetch fresh cart
    retry: 1,
  });
}

// Hook for getting cart items
export function useCartItems(page?: number) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["cartItems", page],
    queryFn: () => ecommerceClientCartItemsList(page),
    enabled: isAuthenticated,
    staleTime: 0,
  });
}

// Hook for adding item to cart
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CartItemCreateRequest) => ecommerceClientCartItemsCreate(data),
    onSuccess: () => {
      // Invalidate cart queries to refetch
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cartItems"] });
      toast.success("Added to cart!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to add item to cart";
      toast.error(message);
    },
  });
}

// Hook for updating cart item quantity
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatchedCartItemCreateRequest }) =>
      ecommerceClientCartItemsPartialUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cartItems"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to update cart";
      toast.error(message);
    },
  });
}

// Hook for removing item from cart
export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ecommerceClientCartItemsDestroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cartItems"] });
      toast.success("Item removed from cart");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to remove item";
      toast.error(message);
    },
  });
}

// Convenience hook for cart count
export function useCartCount() {
  const { data: cart } = useCart();
  return cart?.total_items || 0;
}
