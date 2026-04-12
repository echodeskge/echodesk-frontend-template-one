"use client";

import Image from "next/image";
import Link from "next/link";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { formatPrice } from "@/lib/store-config";

export function RecentlyViewed() {
  const { recentlyViewed } = useRecentlyViewed();
  const config = useStoreConfig();
  const { t } = useLanguage();

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold">
        {t("product.recentlyViewed") || "Recently Viewed"}
      </h2>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {recentlyViewed.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group shrink-0 w-40 sm:w-48"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 160px, 192px"
              />
            </div>
            <div className="mt-2">
              <p className="line-clamp-1 text-sm font-medium group-hover:text-primary transition-colors">
                {product.name}
              </p>
              <p className="text-sm font-bold">
                {formatPrice(
                  parseFloat(product.price),
                  config.locale.currency,
                  config.locale.locale
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
