import { Metadata } from "next";
import { getStoreConfig } from "@/lib/store-config";
import {
  generatePageMetadata,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateLocalBusinessSchema,
} from "@/lib/seo";
import { getTenantBaseUrl, getTenantStoreName } from "@/lib/tenant-url";
import { StructuredData } from "@/components/structured-data";
import {
  fetchFeaturedProducts,
  fetchHomepageSections,
  fetchItemLists,
} from "@/lib/fetch-server";
import { HomePageClient } from "@/components/pages/home-page-client";

// Revalidate every 10 seconds for near-instant updates after admin changes
export const revalidate = 10;

/**
 * Homepage metadata for SEO
 */
export async function generateMetadata(): Promise<Metadata> {
  const config = getStoreConfig();
  const storeName = await getTenantStoreName();

  return generatePageMetadata({
    title: storeName,
    description: config.store.description,
    path: "/",
    keywords: ["ecommerce", "online store", "shop", storeName],
    type: "website",
  });
}

/**
 * Homepage Server Component
 * Fetches data server-side for SEO and passes to client component
 */
export default async function HomePage() {
  const config = getStoreConfig();
  const baseUrl = await getTenantBaseUrl();
  const storeName = await getTenantStoreName();

  // Fetch data server-side for SEO
  const [homepageSections, featuredProducts, itemLists] = await Promise.all([
    fetchHomepageSections(10).catch((): Awaited<ReturnType<typeof fetchHomepageSections>> => []),
    fetchFeaturedProducts(8, 10).catch((): Awaited<ReturnType<typeof fetchFeaturedProducts>> => []),
    fetchItemLists(undefined, 10).catch((): Awaited<ReturnType<typeof fetchItemLists>> => []),
  ]);

  // Generate structured data for SEO — use the tenant store name from
  // headers so each storefront gets its own Organization / WebSite /
  // LocalBusiness schema, not the env-provided default name.
  const organizationSchema = generateOrganizationSchema({
    name: storeName,
    url: baseUrl,
    logo: config.store.logo,
    description: config.store.description,
  });

  const websiteSchema = generateWebSiteSchema({
    name: storeName,
    url: baseUrl,
    description: config.store.description,
    searchUrl: `${baseUrl}/products?search={search_term_string}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
  ]);

  const localBusinessSchema = generateLocalBusinessSchema({
    name: storeName,
    url: baseUrl,
    email: config.contact.email || undefined,
    telephone: config.contact.phone || undefined,
    address: config.contact.address || undefined,
  });

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={localBusinessSchema} />

      {/* Client Component with server-fetched data */}
      <HomePageClient
        homepageSections={homepageSections}
        featuredProducts={featuredProducts}
        itemLists={itemLists}
      />
    </>
  );
}
