"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/store-config";
import { useStoreConfig } from "@/components/providers/theme-provider";

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

  const discountPercentage =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/products/${slug}`}>
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isNew && <Badge className="bg-blue-500">New</Badge>}
          {isFeatured && <Badge className="bg-amber-500">Featured</Badge>}
          {discountPercentage > 0 && (
            <Badge variant="destructive">-{discountPercentage}%</Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {config.features.wishlist && (
            <Button size="icon" variant="secondary" className="h-8 w-8">
              <Heart className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
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

        <Button className="mt-3 w-full" size="sm">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
