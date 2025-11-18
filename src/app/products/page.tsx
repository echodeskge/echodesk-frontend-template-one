import { Metadata } from "next";
import { Suspense } from "react";
import { getStoreConfig } from "@/lib/store-config";
import {
  generatePageMetadata,
  generateProductCollectionSchema,
} from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import { fetchProducts, ProductFilters } from "@/lib/fetch-server";
import { ProductsPageClient } from "@/components/pages/products-page-client";
import { StoreLayout } from "@/components/layout/store-layout";
import { Skeleton } from "@/components/ui/skeleton";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

/**
 * Products list page metadata
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const config = getStoreConfig();
  const search = params.search as string | undefined;
  const onSale = params.on_sale === "true";
  const isFeatured = params.is_featured === "true";

  let title = "Products";
  let description = `Browse our collection of ${config.store.name} products`;

  if (search) {
    title = `Search results for "${search}"`;
    description = `Search results for "${search}" in our product catalog`;
  } else if (onSale) {
    title = "Products on Sale";
    description = "Browse our products currently on sale with great discounts";
  } else if (isFeatured) {
    title = "Featured Products";
    description = "Browse our hand-picked featured products";
  }

  return generatePageMetadata({
    title,
    description,
    path: "/products",
    keywords: ["products", "shop", "ecommerce", config.store.name],
  });
}

/**
 * Products List Server Component
 * Fetches initial data server-side for SEO
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  // Parse filters from searchParams
  const filters: ProductFilters = {
    search: params.search as string | undefined,
    minPrice: params.min_price
      ? Number(params.min_price)
      : undefined,
    maxPrice: params.max_price
      ? Number(params.max_price)
      : undefined,
    isFeatured: params.is_featured === "true" || undefined,
    onSale: params.on_sale === "true" || undefined,
    ordering: (params.ordering as string) || "-created_at",
    page: params.page ? Number(params.page) : 1,
  };

  // Add dynamic attribute filters
  Object.entries(params).forEach(([key, value]) => {
    if (key.startsWith("attr_") && typeof value === "string") {
      filters[key] = value;
    }
  });

  // Fetch products server-side
  const productsData = await fetchProducts(filters, 60).catch(() => ({
    count: 0,
    results: [],
    next: undefined,
    previous: undefined,
  }));

  // Generate structured data for product collection
  const collectionSchema = generateProductCollectionSchema({
    name: "Products",
    description: "Browse our product catalog",
    numberOfItems: productsData.count,
    url: `${baseUrl}/products`,
  });

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={collectionSchema} />

      {/* Suspense wrapper for client component */}
      <Suspense
        fallback={
          <StoreLayout>
            <div className="container py-8">
              <Skeleton className="h-10 w-48 mb-8" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </StoreLayout>
        }
      >
        <ProductsPageClient initialData={productsData} />
      </Suspense>
    </>
  );
}
