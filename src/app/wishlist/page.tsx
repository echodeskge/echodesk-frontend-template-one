"use client";

import Link from "next/link";
import Image from "next/image";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAddToCart, useCart } from "@/hooks/use-cart";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { formatPrice } from "@/lib/store-config";
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
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { items, removeItem, clearWishlist, isLoaded } = useWishlist();
  const { data: cart } = useCart();
  const addToCart = useAddToCart();

  const handleAddToCart = (item: (typeof items)[0]) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!cart) {
      toast.error("Cart not available. Please try again.");
      return;
    }

    addToCart.mutate({
      cart: cart.id,
      product: parseInt(item.id),
      quantity: 1,
    });
  };

  const handleAddAllToCart = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!cart) {
      toast.error("Cart not available. Please try again.");
      return;
    }

    if (items.length > 0) {
      // Add items sequentially
      items.forEach((item) => {
        addToCart.mutate({
          cart: cart.id,
          product: parseInt(item.id),
          quantity: 1,
        });
      });
    }
  };

  if (!isLoaded) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container py-8">
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
                {items.length}{" "}
                {items.length === 1
                  ? t("wishlist.item") || "item"
                  : t("wishlist.items") || "items"}{" "}
                {t("wishlist.saved") || "saved"}
              </p>
            </div>
            {items.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleAddAllToCart}
                  disabled={addToCart.isPending}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t("wishlist.addAllToCart") || "Add All to Cart"}
                </Button>
                <Button variant="outline" onClick={clearWishlist}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("wishlist.clearAll") || "Clear All"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {items.length === 0 ? (
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
            {items.map((item) => {
              const discountPercentage =
                item.compareAtPrice && item.compareAtPrice > item.price
                  ? Math.round(
                      ((item.compareAtPrice - item.price) /
                        item.compareAtPrice) *
                        100
                    )
                  : 0;

              return (
                <Card key={item.id} className="group overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <Link href={`/products/${item.slug}`}>
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
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
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="line-clamp-2 text-sm font-medium hover:text-primary">
                        {item.name}
                      </h3>
                    </Link>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {formatPrice(
                          item.price,
                          config.locale.currency,
                          config.locale.locale
                        )}
                      </span>
                      {item.compareAtPrice &&
                        item.compareAtPrice > item.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(
                              item.compareAtPrice,
                              config.locale.currency,
                              config.locale.locale
                            )}
                          </span>
                        )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
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
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("wishlist.addedOn") || "Added"}{" "}
                      {new Date(item.addedAt).toLocaleDateString()}
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
