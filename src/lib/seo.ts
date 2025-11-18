import { Metadata } from "next";

/**
 * SEO Utility Functions
 * Helper functions for generating metadata and structured data
 */

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
 * Generate complete metadata for a page
 */
export function generatePageMetadata({
  title,
  description,
  path = "",
  image,
  noIndex = false,
  keywords,
  locale = "en_US",
  type = "website",
}: GenerateMetadataParams): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";
  const url = `${baseUrl}${path}`;
  const defaultImage = `${baseUrl}/og-image.png`;

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
      siteName: process.env.NEXT_PUBLIC_STORE_NAME || "Store",
      locale,
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
      creator: "@yourstore",
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

export function generateProductMetadata({
  name,
  description,
  slug,
  image,
  price,
  currency = "USD",
  availability = true,
  brand,
  category,
}: ProductMetadataParams): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";
  const url = `${baseUrl}/products/${slug}`;

  const keywords = [name, brand, category].filter(Boolean);

  return {
    title: name,
    description: description.substring(0, 160),
    keywords: keywords.join(", "),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: name,
      description,
      url,
      siteName: process.env.NEXT_PUBLIC_STORE_NAME || "Store",
      type: "website", // Use "website" instead of "product" for Next.js compatibility
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 1200,
              alt: name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: image ? [image] : undefined,
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
  };
  sameAs?: string[];
}

export function generateOrganizationSchema({
  name,
  url,
  logo,
  description,
  contactPoint,
  sameAs = [],
}: OrganizationSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
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
 * Helper to get canonical URL
 */
export function getCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";
  return `${baseUrl}${path}`;
}

/**
 * Helper to format meta description
 */
export function formatMetaDescription(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
