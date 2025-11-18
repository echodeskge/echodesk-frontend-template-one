"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoginDialog } from "@/components/auth/login-dialog";
import { formatPrice } from "@/lib/store-config";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useAddToCart, useCart } from "@/hooks/use-cart";
import { useBackendWishlist } from "@/hooks/use-favorites";
import { toast } from "sonner";

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  isOnSale?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
}

export function ProductCard({
  id,
  slug,
  name,
  image,
  price,
  compareAtPrice,
  isOnSale,
  isFeatured,
  isNew,
}: ProductCardProps) {
  const config = useStoreConfig();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { data: cart } = useCart();
  const addToCart = useAddToCart();
  const { toggleWishlist, isInWishlist, isPending: isWishlistPending } = useBackendWishlist();

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const discountPercentage =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const inWishlist = isInWishlist(id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Store the action to execute after login
      setPendingAction(() => () => {
        if (cart) {
          addToCart.mutate({
            cart: cart.id,
            product: parseInt(id),
            quantity: 1,
          });
        }
      });
      setShowLoginDialog(true);
      return;
    }

    if (!cart) {
      toast.error("Cart not available. Please try again.");
      return;
    }

    addToCart.mutate({
      cart: cart.id,
      product: parseInt(id),
      quantity: 1,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Store the action to execute after login
      setPendingAction(() => () => toggleWishlist(id));
      setShowLoginDialog(true);
      return;
    }

    toggleWishlist(id);
  };

  const handleLoginSuccess = () => {
    // Execute pending action after successful login
    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 500); // Small delay to allow data to load
    }
  };

  return (
    <Card className="group overflow-hidden py-0">
      <div className="relative aspect-square overflow-hidden bg-muted/30 p-2">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          <div className="relative h-full w-full overflow-hidden rounded-lg">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isNew && <Badge className="bg-blue-500">{t("product.new")}</Badge>}
          {isFeatured && <Badge className="bg-amber-500">{t("product.featured")}</Badge>}
          {discountPercentage > 0 && (
            <Badge variant="destructive">-{discountPercentage}%</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute right-4 top-4 flex flex-col gap-2 translate-x-12 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          {config.features.wishlist && (
            <Button
              size="icon"
              variant="secondary"
              className={`h-9 w-9 rounded-full shadow-md backdrop-blur-sm bg-white/90 hover:bg-white hover:scale-110 transition-all ${inWishlist ? "text-red-500" : "text-gray-700"}`}
              onClick={handleToggleWishlist}
              disabled={isWishlistPending}
            >
              {isWishlistPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart
                  className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`}
                />
              )}
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full shadow-md backdrop-blur-sm bg-white/90 hover:bg-white hover:scale-110 transition-all text-gray-700"
            onClick={handleAddToCart}
            disabled={addToCart.isPending}
          >
            {addToCart.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <CardContent className="px-4 pb-4 pt-4">
        <Link href={`/products/${slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium hover:text-primary">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold">
            {formatPrice(price, config.locale.currency, config.locale.locale)}
          </span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(
                compareAtPrice,
                config.locale.currency,
                config.locale.locale
              )}
            </span>
          )}
        </div>

        <Button
          className="mt-3 w-full"
          size="sm"
          onClick={handleAddToCart}
          disabled={addToCart.isPending}
        >
          {addToCart.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="mr-2 h-4 w-4" />
          )}
          {t("common.addToCart")}
        </Button>
      </CardContent>

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onSuccess={handleLoginSuccess}
        message="Please sign in to add items to your cart"
      />
    </Card>
  );
}
