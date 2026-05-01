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
import { fetchStorefrontConfig } from "@/lib/fetch-server";
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
  // Prefer EcommerceSettings.store_name (theme endpoint, "Refurb")
  // over the resolve-domain header fallback (schema slug "groot").
  const sf = await fetchStorefrontConfig().catch(() => ({ storeName: null as string | null }));
  const storeName = sf.storeName || (await getTenantStoreName());

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
  const sf = await fetchStorefrontConfig().catch(() => ({ storeName: null as string | null }));
  const storeName = sf.storeName || (await getTenantStoreName());

  // Fetch data server-side for SEO
  const [homepageSections, featuredProducts, itemLists] = await Promise.all([
    fetchHomepageSections(10).catch((): Awaited<ReturnType<typeof fetchHomepageSections>> => []),
    fetchFeaturedProducts(8, 10).catch((): Awaited<ReturnType<typeof fetchFeaturedProducts>> => []),
    fetchItemLists(undefined, 10).catch((): Awaited<ReturnType<typeof fetchItemLists>> => []),
  ]);

  // Build sameAs array from configured social links — Schema.org uses
  // this to connect the brand entity to its profiles on FB / IG /
  // Twitter, which improves Knowledge Panel eligibility.
  const sameAs = [
    config.social?.facebook,
    config.social?.instagram,
    config.social?.twitter,
  ].filter((u): u is string => !!u && (u.startsWith("http://") || u.startsWith("https://")));

  // Generate structured data for SEO. Logo, address, and contact info
  // all set explicitly so Google Rich Results validation passes.
  const organizationSchema = generateOrganizationSchema({
    name: storeName,
    url: baseUrl,
    logo: config.store.logo,
    description: config.store.description,
    addressCountry: "GE",
    addressLocality: "Tbilisi",
    sameAs,
    ...(config.contact.phone || config.contact.email
      ? {
          contactPoint: {
            telephone: config.contact.phone || "",
            contactType: "customer service",
            email: config.contact.email || undefined,
            availableLanguage: ["en", "ka", "ru"],
          },
        }
      : {}),
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
    logo: config.store.logo,
    email: config.contact.email || undefined,
    telephone: config.contact.phone || undefined,
    address: config.contact.address || undefined,
    addressCountry: "GE",
    addressLocality: "Tbilisi",
    currenciesAccepted: "GEL",
    paymentAccepted: "Cash, Credit Card, Bank Transfer, BOG, TBC",
    sameAs,
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
