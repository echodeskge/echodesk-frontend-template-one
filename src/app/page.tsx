import { Metadata } from "next";
import { getStoreConfig } from "@/lib/store-config";
import {
  generatePageMetadata,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import {
  fetchFeaturedProducts,
  fetchHomepageSections,
  fetchItemLists,
} from "@/lib/fetch-server";
import { HomePageClient } from "@/components/pages/home-page-client";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

/**
 * Homepage metadata for SEO
 */
export async function generateMetadata(): Promise<Metadata> {
  const config = getStoreConfig();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  return generatePageMetadata({
    title: config.store.name,
    description: config.store.description,
    path: "/",
    keywords: ["ecommerce", "online store", "shop", config.store.name],
    type: "website",
  });
}

/**
 * Homepage Server Component
 * Fetches data server-side for SEO and passes to client component
 */
export default async function HomePage() {
  const config = getStoreConfig();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  // Fetch data server-side for SEO
  const [homepageSections, featuredProducts, itemLists] = await Promise.all([
    fetchHomepageSections(60).catch(() => []),
    fetchFeaturedProducts(8, 60).catch(() => []),
    fetchItemLists(undefined, 60).catch(() => []),
  ]);

  // Generate structured data for SEO
  const organizationSchema = generateOrganizationSchema({
    name: config.store.name,
    url: baseUrl,
    logo: config.store.logo,
    description: config.store.description,
  });

  const websiteSchema = generateWebSiteSchema({
    name: config.store.name,
    url: baseUrl,
    description: config.store.description,
    searchUrl: `${baseUrl}/products?search={search_term_string}`,
  });

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />

      {/* Client Component with server-fetched data */}
      <HomePageClient
        homepageSections={homepageSections}
        featuredProducts={featuredProducts}
        itemLists={itemLists}
      />
    </>
  );
}
