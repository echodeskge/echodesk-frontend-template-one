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

// Combined hook for wishlist functionality with backend support
export function useBackendWishlist() {
  const { isAuthenticated } = useAuth();
  const { data: favoritesData, isLoading } = useFavorites();
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();

  const favorites = favoritesData?.results || [];

  const isInWishlist = (productId: string | number) => {
    const id = typeof productId === "string" ? parseInt(productId) : productId;
    return favorites.some((fav) => {
      // fav.product could be a string (product detail URL) or nested object
      if (typeof fav.product === "string") {
        // Extract ID from URL like "/api/ecommerce/products/1/"
        const match = fav.product.match(/\/(\d+)\/?$/);
        return match ? parseInt(match[1]) === id : false;
      }
      return (fav.product as any)?.id === id;
    });
  };

  const getFavoriteId = (productId: string | number) => {
    const id = typeof productId === "string" ? parseInt(productId) : productId;
    const favorite = favorites.find((fav) => {
      if (typeof fav.product === "string") {
        const match = fav.product.match(/\/(\d+)\/?$/);
        return match ? parseInt(match[1]) === id : false;
      }
      return (fav.product as any)?.id === id;
    });
    return favorite?.id;
  };

  const toggleWishlist = (productId: string | number) => {
    if (!isAuthenticated) {
      toast.error("Please login to use wishlist");
      return;
    }

    const id = typeof productId === "string" ? parseInt(productId) : productId;

    if (isInWishlist(productId)) {
      const favoriteId = getFavoriteId(productId);
      if (favoriteId) {
        removeFromFavorites.mutate(String(favoriteId));
      }
    } else {
      // Generated type requires client field but backend auto-populates it from JWT
      addToFavorites.mutate({ product: id } as any);
    }
  };

  return {
    favorites,
    count: favorites.length,
    isLoading,
    isInWishlist,
    toggleWishlist,
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
    isPending: addToFavorites.isPending || removeFromFavorites.isPending,
  };
}
