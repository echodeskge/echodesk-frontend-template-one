"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { ArrowRight } from "lucide-react";
import { useFeaturedProducts } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomepageSectionProps, LocalizedText } from "@/types/homepage";

export function FeaturedProductsSection({ section, language }: HomepageSectionProps) {
  const settings = section.settings || {};
  const maxItems = settings.maxItems || 8;
  const columns = settings.columns || 4;

  // Fetch featured products from API
  const { data: featuredProducts, isLoading } = useFeaturedProducts(maxItems);

  const getLocalizedText = (text: LocalizedText | string | undefined): string => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[language] || text.en || text.ka || Object.values(text)[0] || "";
  };

  const sectionStyle = {
    backgroundColor: section.background_color || undefined,
    backgroundImage: section.background_image_url
      ? `url(${section.background_image_url})`
      : undefined,
    color: section.text_color || undefined,
  };

  const gridCols = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  }[columns] || "lg:grid-cols-4";

  return (
    <section className="py-16" style={sectionStyle}>
      <div className="container">
        <div className="flex items-center justify-between">
          <div>
            {section.title && (
              <h2 className="text-3xl font-bold">{getLocalizedText(section.title)}</h2>
            )}
            {section.subtitle && (
              <p className="mt-2 text-muted-foreground">
                {getLocalizedText(section.subtitle)}
              </p>
            )}
          </div>
          {settings.showViewAll !== false && (
            <Button variant="ghost" asChild>
              <Link href={settings.viewAllLink || "/products?is_featured=true"}>
                {language === "ka" ? "ყველას ნახვა" : "View All"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        <div
          className={`mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 ${gridCols}`}
        >
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : featuredProducts?.results.length ? (
            featuredProducts.results.map((product) => (
              <ProductCard
                key={product.id}
                id={String(product.id)}
                slug={product.slug}
                name={getLocalizedText(product.name)}
                image={product.image || "/placeholder.svg"}
                price={parseFloat(product.price)}
                compareAtPrice={
                  product.compare_at_price
                    ? parseFloat(product.compare_at_price)
                    : undefined
                }
                isOnSale={product.discount_percentage > 0}
                isFeatured={product.is_featured}
                isNew={false}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {language === "ka" ? "პროდუქტები ვერ მოიძებნა" : "No products found"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
