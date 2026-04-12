"use client";

import Link from "next/link";
import Image from "next/image";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { useBackendWishlist } from "@/hooks/use-favorites";
import { useAddToCart, useCart } from "@/hooks/use-cart";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { formatPrice } from "@/lib/store-config";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const config = useStoreConfig();
  const { t, getLocalizedValue } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { favorites, isLoading: isFavoritesLoading, toggleWishlist, isPending } = useBackendWishlist();
  const { data: cart } = useCart();
  const addToCart = useAddToCart();

  const handleAddToCart = (favorite: any) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!cart) {
      toast.error(t("cart.notAvailable"));
      return;
    }

    // Extract product ID from favorite
    const productId = getProductIdFromFavorite(favorite);
    if (productId) {
      addToCart.mutate({
        cart: cart.id,
        product: productId,
        quantity: 1,
      });
    }
  };

  const handleAddAllToCart = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!cart) {
      toast.error(t("cart.notAvailable"));
      return;
    }

    favorites.forEach((fav) => {
      const productId = getProductIdFromFavorite(fav);
      if (productId) {
        addToCart.mutate({
          cart: cart.id,
          product: productId,
          quantity: 1,
        });
      }
    });
  };

  // Extract product ID from a favorite entry
  const getProductIdFromFavorite = (favorite: any): number | null => {
    if (typeof favorite.product === "number") {
      return favorite.product;
    }
    if (typeof favorite.product === "string") {
      // Extract ID from URL like "/api/ecommerce/products/1/"
      const match = favorite.product.match(/\/(\d+)\/?$/);
      return match ? parseInt(match[1]) : null;
    }
    if (typeof favorite.product === "object" && favorite.product?.id) {
      return favorite.product.id;
    }
    return null;
  };

  // Get display data from a favorite
  const getProductDisplay = (favorite: any) => {
    // If product is an expanded object with details
    if (typeof favorite.product === "object" && favorite.product !== null) {
      const p = favorite.product;
      return {
        name: getLocalizedValue(p.name || "Product"),
        image: p.image || "/placeholder.svg",
        price: p.price ? parseFloat(p.price) : 0,
        compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : undefined,
        slug: p.slug || "",
        id: p.id,
      };
    }
    // Minimal data - product is just a string URL or number
    const productId = getProductIdFromFavorite(favorite);
    return {
      name: "Product",
      image: "/placeholder.svg",
      price: 0,
      compareAtPrice: undefined,
      slug: productId ? String(productId) : "",
      id: productId,
    };
  };

  const handleRemoveFavorite = (favorite: any) => {
    const productId = getProductIdFromFavorite(favorite);
    if (productId) {
      toggleWishlist(productId);
    }
  };

  const isLoading = isAuthLoading || isFavoritesLoading;

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <div className="mb-8">
            <Skeleton className="mb-4 h-10 w-40" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-1 h-5 w-32" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <StoreLayout>
        <div className="container py-16">
          <div className="mx-auto max-w-md text-center">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
            <h1 className="mt-6 text-2xl font-bold">
              {t("common.wishlist")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("wishlist.loginRequired")}
            </p>
            <Button asChild className="mt-6">
              <Link href="/login?callbackUrl=/wishlist">
                {t("common.signIn")}
              </Link>
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container py-8">
        <Breadcrumbs items={[{ label: t("common.wishlist") }]} />
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/products">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("cart.continueShopping")}
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {t("common.wishlist")}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {favorites.length}{" "}
                {favorites.length === 1
                  ? t("wishlist.item") || "item"
                  : t("wishlist.items") || "items"}{" "}
                {t("wishlist.saved") || "saved"}
              </p>
            </div>
            {favorites.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleAddAllToCart}
                  disabled={addToCart.isPending}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("wishlist.addAllToCart") || "Add All to Cart"}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {favorites.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                {t("wishlist.empty") || "Your wishlist is empty"}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {t("wishlist.emptyDesc") ||
                  "Save items you love for later by clicking the heart icon"}
              </p>
              <Button asChild className="mt-6">
                <Link href="/products">
                  {t("wishlist.startShopping") || "Start Shopping"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((favorite) => {
              const display = getProductDisplay(favorite);
              const discountPercentage =
                display.compareAtPrice && display.compareAtPrice > display.price
                  ? Math.round(
                      ((display.compareAtPrice - display.price) /
                        display.compareAtPrice) *
                        100
                    )
                  : 0;

              return (
                <Card key={favorite.id} className="group overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <Link href={`/products/${display.slug}`}>
                      <Image
                        src={display.image}
                        alt={display.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </Link>

                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                      <div className="absolute left-2 top-2">
                        <span className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                          -{discountPercentage}%
                        </span>
                      </div>
                    )}

                    {/* Remove Button */}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleRemoveFavorite(favorite)}
                      disabled={isPending}
                      aria-label={t("cart.remove")}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <Link href={`/products/${display.slug}`}>
                      <h3 className="line-clamp-2 text-sm font-medium hover:text-primary">
                        {display.name}
                      </h3>
                    </Link>

                    {display.price > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {formatPrice(
                            display.price,
                            config.locale.currency,
                            config.locale.locale
                          )}
                        </span>
                        {display.compareAtPrice &&
                          display.compareAtPrice > display.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(
                                display.compareAtPrice,
                                config.locale.currency,
                                config.locale.locale
                              )}
                            </span>
                          )}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => handleAddToCart(favorite)}
                        disabled={addToCart.isPending}
                      >
                        {addToCart.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        )}
                        {t("common.addToCart")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFavorite(favorite)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("wishlist.addedOn") || "Added"}{" "}
                      {new Date(favorite.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
