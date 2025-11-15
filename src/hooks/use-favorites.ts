import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientFavoritesList,
  ecommerceClientFavoritesCreate,
  ecommerceClientFavoritesDestroy,
} from "@/api/generated/api";
import type { FavoriteProductCreateRequest } from "@/api/generated/interfaces";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

// Hook for fetching favorites (wishlist)
export function useFavorites(page?: number) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["favorites", page],
    queryFn: () => ecommerceClientFavoritesList(undefined, page),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for adding to favorites
export function useAddToFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FavoriteProductCreateRequest) =>
      ecommerceClientFavoritesCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Added to wishlist!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to add to wishlist";
      toast.error(message);
    },
  });
}

// Hook for removing from favorites
export function useRemoveFromFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ecommerceClientFavoritesDestroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removed from wishlist");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to remove from wishlist";
      toast.error(message);
    },
  });
}

// Hook to check if product is in favorites
export function useIsInFavorites(productId: number) {
  const { data: favorites } = useFavorites();

  if (!favorites) return false;

  return favorites.results.some(
    (fav) => (fav as any).product === productId || (fav as any).product?.id === productId
  );
}
