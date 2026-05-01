import { Metadata } from "next";
import { getStoreConfig } from "@/lib/store-config";
import {
  getTenantBaseUrl,
  getTenantStoreName,
  getTenantLocale,
} from "@/lib/tenant-url";
import { fetchStorefrontConfig } from "@/lib/fetch-server";

/**
 * Resolve the canonical store name. Prefer EcommerceSettings.store_name
 * (the value tenants type into the admin's "Store name" field) over
 * the resolve-domain header fallback, which serves the schema slug
 * for tenants who haven't pinned that field on the Tenant model.
 */
async function resolveStoreName(): Promise<string> {
  const sf = await fetchStorefrontConfig().catch(() => ({ storeName: null as string | null }));
  if (sf.storeName) return sf.storeName;
  return getTenantStoreName();
}

/**
 * SEO Utility Functions
 * Helper functions for generating metadata and structured data.
 *
 * Tenant URLs are resolved per-request from the middleware-set
 * `host` / `x-tenant-*` headers (see `src/lib/tenant-url.ts`). Do NOT
 * fall back to `process.env.NEXT_PUBLIC_BASE_URL` here — multi-tenant
 * deploys serve every customer from the same Next.js process and that
 * env var always pointed at the placeholder `yourstore.com`.
 */

/**
 * Get the Twitter handle from store config or environment variable.
 * Falls back to empty string if neither is configured.
 */
function getTwitterHandle(): string {
  const config = getStoreConfig();
  // Extract @handle from full URL if needed (e.g., "https://twitter.com/mystore" -> "@mystore")
  const twitterUrl = config.social.twitter;
  if (twitterUrl) {
    const handle = twitterUrl.split("/").pop();
    if (handle) return handle.startsWith("@") ? handle : `@${handle}`;
  }
  return process.env.NEXT_PUBLIC_TWITTER_HANDLE || "";
}

interface GenerateMetadataParams {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  locale?: string;
  type?: "website" | "article";
}

/**
 * Map our 2-letter tenant locale (the middleware sets `ka` / `en`) onto
 * the Open Graph 5-letter locale that Facebook + LinkedIn want
 * (`ka_GE` / `en_US`).
 */
function ogLocale(short: "ka" | "en"): "ka_GE" | "en_US" {
  return short === "ka" ? "ka_GE" : "en_US";
}

/**
 * Generate complete metadata for a page. Tenant base URL + store name
 * are resolved from request headers so canonical / OG / Twitter URLs
 * always point at the *current* tenant domain — no `yourstore.com`
 * placeholder leaking into production HTML.
 */
export async function generatePageMetadata({
  title,
  description,
  path = "",
  image,
  noIndex = false,
  keywords,
  locale,
  type = "website",
}: GenerateMetadataParams): Promise<Metadata> {
  const baseUrl = await getTenantBaseUrl();
  const storeName = await resolveStoreName();
  const tenantLocale = await getTenantLocale();
  const ogLocaleCode = locale || ogLocale(tenantLocale);
  const url = `${baseUrl}${path}`;
  // Next.js's app/opengraph-image.tsx is auto-routed at /opengraph-image
  // and generates a tenant-branded 1200×630 PNG at request time. The
  // previous default `${baseUrl}/og-image.png` was a static path that
  // didn't exist anywhere — every share / scrape was hitting a 404
  // image (which Facebook's Debugger flags as a "Bad Response Code"
  // resource fetch).
  const defaultImage = `${baseUrl}/opengraph-image`;
  const altLocale = tenantLocale === "ka" ? "en_US" : "ka_GE";

  return {
    title,
    description,
    keywords: keywords?.join(", "),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    }),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: storeName,
      locale: ogLocaleCode,
      alternateLocale: altLocale,
      type,
      images: [
        {
          url: image || defaultImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image || defaultImage],
      site: getTwitterHandle() || undefined,
      creator: getTwitterHandle() || undefined,
    },
  };
}

/**
 * Generate metadata for product pages
 */
export interface ProductMetadataParams {
  name: string;
  description: string;
  slug: string;
  image?: string;
  price?: number;
  currency?: string;
  availability?: boolean;
  brand?: string;
  category?: string;
}

export async function generateProductMetadata({
  name,
  description,
  slug,
  image,
  price,
  currency = "USD",
  availability = true,
  brand,
  category,
}: ProductMetadataParams): Promise<Metadata> {
  const baseUrl = await getTenantBaseUrl();
  const storeName = await resolveStoreName();
  const tenantLocale = await getTenantLocale();
  const url = `${baseUrl}/products/${slug}`;

  // Auto-generated per-product OG card from
  // src/app/products/[slug]/opengraph-image.tsx — composites the
  // product photo + name + price + store name onto a 1200×630 PNG.
  // Falls back to the route-level Next-generated image which itself
  // falls back to the root opengraph-image, so there's always *some*
  // valid image URL even if the product has no uploaded photo.
  const productOgImage = `${baseUrl}/products/${encodeURIComponent(slug)}/opengraph-image`;

  // Open Graph + Twitter strongly prefer 110–160 char descriptions
  // (FB Sharing Debugger flags anything longer; Twitter truncates at
  // 200). The legacy field on EcommerceSettings.short_description
  // sometimes contains a multi-paragraph dump, so trim it cleanly at
  // a word boundary and append an ellipsis so the preview reads
  // naturally instead of mid-sentence.
  const truncate = (raw: string, max = 160): string => {
    const single = raw.replace(/\s+/g, " ").trim();
    if (single.length <= max) return single;
    const cut = single.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
  };
  const shortDescription = truncate(description, 160);

  // SEO-optimal product title length is 50–60 characters. Bare names
  // are often shorter ("iPhone 15", "Logitech MX Keys" — 9-26 chars).
  // Append benefit phrases to hit the target without padding nonsense:
  //   "<name> — Refurbished · Tbilisi delivery | <store>"
  // Skip if the product name alone already crosses 60 chars.
  const titleSuffix = " — Refurbished · Same-day Tbilisi";
  const optimalTitle =
    name.length >= 50
      ? name
      : name.length + titleSuffix.length <= 65
        ? `${name}${titleSuffix}`
        : name;

  const keywords = [name, brand, category, "Refurbished", "Tbilisi"].filter(Boolean);

  return {
    title: optimalTitle,
    description: shortDescription,
    keywords: keywords.join(", "),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: optimalTitle,
      description: shortDescription,
      url,
      siteName: storeName,
      locale: tenantLocale === "ka" ? "ka_GE" : "en_US",
      // Note: Next.js Metadata API only supports standard OG types ("website", "article", etc.).
      // The "product" OG type is not in the union. We use "website" here and set
      // "og:type": "product" via the `other` field on the product page instead.
      type: "website",
      images: [
        {
          url: productOgImage,
          width: 1200,
          height: 630,
          alt: `${name} — refurbished electronics | ${storeName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: shortDescription,
      images: [productOgImage],
      site: getTwitterHandle() || undefined,
      creator: getTwitterHandle() || undefined,
    },
    other: {
      "og:locale": "en_US",
      "og:locale:alternate": "ka_GE",
    },
  };
}

/**
 * Schema.org structured data builders
 */

export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
    availableLanguage?: string[];
  };
  sameAs?: string[];
  /** Country code (ISO 3166-1 alpha-2). Defaults to GE (Georgia). */
  addressCountry?: string;
  addressLocality?: string;
  postalAddress?: string;
}

const absoluteLogo = (logo: string | undefined | null, baseUrl: string): string => {
  if (!logo) return `${baseUrl}/icon`;
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
  if (logo.startsWith("/")) return `${baseUrl}${logo}`;
  return `${baseUrl}/${logo}`;
};

export function generateOrganizationSchema({
  name,
  url,
  logo,
  description,
  contactPoint,
  sameAs = [],
  addressCountry = "GE",
  addressLocality = "Tbilisi",
  postalAddress,
}: OrganizationSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    // Schema.org requires absolute URL for logo. The auto-generated
    // /icon route returns a tenant-branded PNG so this always
    // resolves to something valid even before the tenant uploads a
    // proper logo.
    logo: absoluteLogo(logo, url),
    ...(description && { description }),
    address: {
      "@type": "PostalAddress",
      addressCountry,
      addressLocality,
      ...(postalAddress && { streetAddress: postalAddress }),
    },
    ...(contactPoint && { contactPoint }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export interface WebSiteSchema {
  name: string;
  url: string;
  description?: string;
  searchUrl?: string;
}

export function generateWebSiteSchema({
  name,
  url,
  description,
  searchUrl,
}: WebSiteSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    ...(searchUrl && {
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: searchUrl,
        },
        "query-input": "required name=search_term_string",
      },
    }),
  };
}

export interface ProductSchema {
  name: string;
  description: string;
  image?: string | string[];
  sku?: string;
  brand?: string;
  offers: {
    price: number;
    priceCurrency: string;
    availability: "InStock" | "OutOfStock" | "PreOrder";
    url: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  review?: Array<{
    author: string;
    datePublished: string;
    reviewBody: string;
    reviewRating: {
      ratingValue: number;
      bestRating?: number;
    };
  }>;
}

export function generateProductSchema(product: ProductSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.image && { image: product.image }),
    ...(product.sku && { sku: product.sku }),
    ...(product.brand && {
      brand: {
        "@type": "Brand",
        name: product.brand,
      },
    }),
    offers: {
      "@type": "Offer",
      ...product.offers,
    },
    ...(product.aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ...product.aggregateRating,
      },
    }),
    ...(product.review &&
      product.review.length > 0 && {
        review: product.review.map((r) => ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: r.author,
          },
          datePublished: r.datePublished,
          reviewBody: r.reviewBody,
          reviewRating: {
            "@type": "Rating",
            ...r.reviewRating,
          },
        })),
      }),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ProductCollectionSchema {
  name: string;
  description?: string;
  numberOfItems: number;
  url: string;
}

export function generateProductCollectionSchema({
  name,
  description,
  numberOfItems,
  url,
}: ProductCollectionSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems,
    },
  };
}

/**
 * Generate LocalBusiness/Store schema for homepage
 */
export interface LocalBusinessSchema {
  name: string;
  url: string;
  logo?: string;
  email?: string;
  telephone?: string;
  address?: string;
  /** ISO 3166-1 alpha-2, defaults to GE (Georgia). */
  addressCountry?: string;
  addressLocality?: string;
  currenciesAccepted?: string;
  paymentAccepted?: string;
  priceRange?: string;
  sameAs?: string[];
}

export function generateLocalBusinessSchema({
  name,
  url,
  logo,
  email,
  telephone,
  address,
  addressCountry = "GE",
  addressLocality = "Tbilisi",
  currenciesAccepted = "GEL",
  paymentAccepted = "Cash, Credit Card, Bank Transfer",
  priceRange,
  sameAs = [],
}: LocalBusinessSchema) {
  return {
    "@context": "https://schema.org",
    // OnlineStore is the modern Schema.org type for an internet
    // retailer; the older `Store` type is kept as a secondary type so
    // tools that don't recognise OnlineStore yet still pick something
    // up.
    "@type": ["OnlineStore", "Store"],
    name,
    url,
    logo: absoluteLogo(logo, url),
    address: {
      "@type": "PostalAddress",
      addressCountry,
      addressLocality,
      ...(address && address !== addressLocality && { streetAddress: address }),
    },
    currenciesAccepted,
    paymentAccepted,
    ...(priceRange && { priceRange }),
    ...(email && { email }),
    ...(telephone && { telephone }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/**
 * Generate FAQPage schema
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * Helper to get canonical URL — tenant-aware. Reads the request host
 * from middleware-set headers via `getTenantBaseUrl`.
 */
export async function getCanonicalUrl(path: string): Promise<string> {
  const baseUrl = await getTenantBaseUrl();
  return `${baseUrl}${path}`;
}

/**
 * Helper to get base URL — tenant-aware.
 */
export async function getBaseUrl(): Promise<string> {
  return getTenantBaseUrl();
}

/**
 * Helper to format meta description
 */
export function formatMetaDescription(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
