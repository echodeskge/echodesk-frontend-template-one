import { Metadata } from "next";
import { Suspense } from "react";
import {
  generatePageMetadata,
  generateProductCollectionSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo";
import {
  getTenantBaseUrl,
  getTenantStoreName,
  getTenantLocale,
  getTenantCurrency,
} from "@/lib/tenant-url";
import { StructuredData } from "@/components/structured-data";
import { fetchProducts, ProductFilters } from "@/lib/fetch-server";
import { ProductsPageClient } from "@/components/pages/products-page-client";
import { StoreLayout } from "@/components/layout/store-layout";
import { Skeleton } from "@/components/ui/skeleton";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

/**
 * Products list page metadata.
 *
 * Tenant-aware: title, description, canonical and OG URLs are all
 * derived from the live request headers (host + middleware-set
 * `x-tenant-store-name`) so each tenant gets its own preview card and
 * hreflang anchor — no `yourstore.com` placeholder leaking through.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const storeName = await getTenantStoreName();
  const locale = await getTenantLocale();
  const currency = await getTenantCurrency();
  const search = params.search as string | undefined;
  const onSale = params.on_sale === "true";
  const isFeatured = params.is_featured === "true";

  // Locale-aware copy. Most echodesk-cloud stores serve a Georgian
  // audience; fall back to English on tenants that explicitly set
  // `NEXT_PUBLIC_LOCALE=en` or whose backend resolved to en.
  const isKa = locale === "ka";

  let title: string;
  let description: string;
  if (search) {
    title = isKa
      ? `ძიების შედეგები „${search}“ — ${storeName}`
      : `Search results for "${search}" — ${storeName}`;
    description = isKa
      ? `${storeName} მაღაზიაში ნაპოვნი პროდუქტები ძიების ფრაზით „${search}“. ფასები ${currency}-ში, მიწოდება საქართველოში.`
      : `Products in the ${storeName} catalogue matching "${search}". Priced in ${currency}, shipping inside Georgia.`;
  } else if (onSale) {
    title = isKa
      ? `ფასდაკლებაზე — ${storeName}`
      : `On sale — ${storeName}`;
    description = isKa
      ? `${storeName}-ის შემცირებული ფასით პროდუქტები. დღეს მოქმედი ფასდაკლებები — ლარში, საქართველოში მიწოდებით.`
      : `Discounted products from ${storeName}. Today's reductions — ${currency} pricing, delivery across Georgia.`;
  } else if (isFeatured) {
    title = isKa
      ? `რჩეული პროდუქტები — ${storeName}`
      : `Featured products — ${storeName}`;
    description = isKa
      ? `${storeName}-ის ხელით შერჩეული რჩეული პროდუქტები — ბესტსელერები, ახალი ჩამოსვლა და სტუდიის რეკომენდაციები.`
      : `Hand-picked highlights from ${storeName} — bestsellers, fresh arrivals and editor's picks.`;
  } else {
    title = isKa
      ? `პროდუქტების კატალოგი — ${storeName}`
      : `Shop all products — ${storeName}`;
    description = isKa
      ? `დაათვალიერე ${storeName}-ის სრული კატალოგი. ფასები ${currency}-ში, BOG/TBC გადახდის ბმულები, საქართველოში მიწოდება.`
      : `Browse the full ${storeName} catalogue. ${currency} pricing, BOG/TBC payment links, delivery across Georgia.`;
  }

  const keywords = [
    storeName,
    isKa ? "ონლაინ მაღაზია" : "online store",
    isKa ? "მიტანა საქართველოში" : "delivery in Georgia",
    `${currency} ${isKa ? "ფასები" : "pricing"}`,
    isKa ? "BOG TBC გადახდა" : "BOG TBC payments",
  ];

  return generatePageMetadata({
    title,
    description,
    path: "/products",
    keywords,
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
  const baseUrl = await getTenantBaseUrl();
  const storeName = await getTenantStoreName();
  const locale = await getTenantLocale();
  const currency = await getTenantCurrency();
  const isKa = locale === "ka";

  // Parse filters from searchParams
  const filters: ProductFilters = {
    search: params.search as string | undefined,
    minPrice: params.min_price ? Number(params.min_price) : undefined,
    maxPrice: params.max_price ? Number(params.max_price) : undefined,
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

  // Generate structured data for product collection — now tenant-aware.
  const collectionName = isKa
    ? `${storeName} — პროდუქტების კატალოგი`
    : `${storeName} — All products`;
  const collectionDescription = isKa
    ? `${storeName}-ის ონლაინ კატალოგი. ფასები ${currency}-ში, საქართველოში მიწოდებით.`
    : `${storeName} online catalogue. ${currency} pricing, delivery across Georgia.`;
  const collectionSchema = generateProductCollectionSchema({
    name: collectionName,
    description: collectionDescription,
    numberOfItems: productsData.count,
    url: `${baseUrl}/products`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: isKa ? "მთავარი" : "Home", url: baseUrl },
    { name: isKa ? "პროდუქტები" : "Products", url: `${baseUrl}/products` },
  ]);

  // Locale-aware H1 + intro paragraph rendered above the product grid.
  // Gives Google a unique on-page text block to anchor the category in
  // (the audit flagged "thin category copy") + helps screen readers
  // pick out the page topic before the first product card.
  const heading = isKa ? `${storeName}-ის ყველა პროდუქტი` : `All products`;
  const intro = isKa
    ? `${storeName}-ის სრული კატალოგი — ფასები ${currency}-ში, ერთჯერადი ან განვადებითი გადახდა BOG-ისა და TBC-ის ბმულებით, მიწოდება საქართველოს ქალაქებში. გამოიყენე ფილტრები კატეგორიის, ფასისა და ფასდაკლების მიხედვით.`
    : `The full ${storeName} catalogue — priced in ${currency}, paid via BOG or TBC links (one-off or instalments), shipped across Georgia. Filter by category, price band, or sale status to narrow down.`;

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={collectionSchema} />
      <StructuredData data={breadcrumbSchema} />

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
        <ProductsPageClient
          initialData={productsData}
          seoHeading={heading}
          seoIntro={intro}
        />
      </Suspense>
    </>
  );
}
