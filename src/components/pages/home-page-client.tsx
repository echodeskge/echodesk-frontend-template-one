"use client";

import { StoreLayout } from "@/components/layout/store-layout";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { useStoreConfig } from "@/components/providers/theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { useCategoryOptions } from "@/hooks/use-attributes";
import { HomepageSection } from "@/components/homepage/HomepageSection";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductList } from "@/api/generated/interfaces";

interface HomePageClientProps {
  homepageSections: any[];
  featuredProducts: ProductList[];
  itemLists: any[];
}

export function HomePageClient({
  homepageSections,
  featuredProducts,
  itemLists,
}: HomePageClientProps) {
  const config = useStoreConfig();
  const { t, getLocalizedValue, currentLanguage } = useLanguage();
  const { options: categoryOptions } = useCategoryOptions();

  // If homepage sections are configured, render them dynamically
  const hasDynamicSections = homepageSections && homepageSections.length > 0;

  // Render dynamic sections if available
  if (hasDynamicSections) {
    return (
      <StoreLayout>
        {homepageSections.map((section) => (
          <HomepageSection
            key={section.id}
            section={section}
            language={currentLanguage}
          />
        ))}
      </StoreLayout>
    );
  }

  // Fallback to static homepage content if no sections configured
  return (
    <StoreLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              {t("home.welcomeTo")} {config.store.name}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {config.store.description}
            </p>
            <div className="mt-8 flex gap-4">
              <Button size="lg" asChild>
                <Link href="/products">
                  {t("common.shopNow")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/products?on_sale=true">{t("common.viewSale")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">{t("home.featuredProducts")}</h2>
          <Button variant="ghost" asChild>
            <Link href="/products?is_featured=true">
              {t("common.viewAll")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={String(product.id)}
                slug={product.slug}
                name={getLocalizedValue(product.name)}
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
              {t("home.noFeaturedProducts")}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold">{t("home.shopByCategory")}</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categoryOptions.length > 0 ? (
              categoryOptions.map((option: any, index: number) => {
                const categoryName = getLocalizedValue(option);
                return (
                  <Link
                    key={index}
                    href={`/products?attr_category=${encodeURIComponent(categoryName)}`}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-6 transition-all hover:from-primary/30 hover:shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-lg font-semibold text-white">
                        {categoryName}
                      </h3>
                    </div>
                  </Link>
                );
              })
            ) : itemLists.length > 0 ? (
              itemLists.slice(0, 6).map((list) => (
                <Link
                  key={list.id}
                  href={`/products?list=${list.id}`}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-6 transition-all hover:from-primary/30 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-lg font-semibold text-white">
                      {list.name}
                    </h3>
                    {list.items_count && (
                      <p className="text-sm text-white/80">
                        {list.items_count} {t("home.items")}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {t("home.noCategories")}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">{t("home.freeShipping")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("home.freeShippingDesc", {
                symbol: config.locale.currencySymbol,
              })}
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">{t("home.easyReturns")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("home.easyReturnsDesc")}
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">
              {t("home.securePayment")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("home.securePaymentDesc")}
            </p>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
