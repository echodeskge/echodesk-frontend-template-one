import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreConfig } from "@/lib/store-config";
import {
  generateProductMetadata,
  generateProductSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo";
import { getTenantBaseUrl } from "@/lib/tenant-url";
import { StructuredData } from "@/components/structured-data";
import {
  fetchProductBySlug,
  fetchFeaturedProducts,
} from "@/lib/fetch-server";
import type { ProductDetail } from "@/api/generated/interfaces";
import { ProductDetailClient } from "@/components/pages/product-detail-client";

// Force dynamic rendering is required because `fetchProductBySlug` calls
// `getServerApiUrl()` in `fetch-server.ts`, which invokes `headers()` to read
// the `x-tenant-api-url` header set by multi-tenant middleware. In Next.js 15,
// calling `headers()` opts the route into dynamic rendering automatically.
// We cannot use ISR (`export const revalidate = 60`) because the tenant API URL
// is resolved per-request from middleware headers, not from a static env var.
// If the storefront ever moves to single-tenant mode (env-only API URL),
// this can be replaced with `export const revalidate = 60` for ISR.
export const dynamic = "force-dynamic";

/**
 * Product detail page metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await fetchProductBySlug(slug);

    if (!product) {
      return {
        title: "Product Not Found",
      };
    }

    const config = getStoreConfig();

    // Get localized values (fallback to English or first available)
    const getName = (obj: string | Record<string, string> | undefined): string => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj.en || obj.ka || Object.values(obj)[0] || "";
    };

    const getDescription = (obj: string | Record<string, string> | undefined): string => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj.en || obj.ka || Object.values(obj)[0] || "";
    };

    const name = getName(product.name);
    const description = getDescription(
      product.short_description || product.name
    );

    const baseUrl = await getTenantBaseUrl();

    // Ensure image URL is absolute for social sharing
    let imageUrl = product.image || undefined;
    if (imageUrl && !imageUrl.startsWith("http")) {
      // If relative URL, prepend API base or base URL
      const apiBase = process.env.NEXT_PUBLIC_API_URL || baseUrl;
      imageUrl = `${apiBase}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }

    const baseMetadata = generateProductMetadata({
      name,
      description: description || name,
      slug,
      image: imageUrl,
      price: parseFloat(product.price),
      currency: config.locale.currency,
      availability: (product.quantity || 0) > 0,
      brand: config.store.name,
    });

    return {
      ...baseMetadata,
      other: {
        ...((baseMetadata as any).other || {}),
        "product:price:amount": String(product.price),
        "product:price:currency": config.locale.currency,
        "og:type": "product",
        "product:availability": (product.quantity || 0) > 0 ? "in stock" : "out of stock",
        "product:brand": config.store.name,
        ...(imageUrl ? { "pinterest:media": imageUrl } : {}),
      },
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Product Not Found",
    };
  }
}

/**
 * Product Detail Server Component
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const config = getStoreConfig();
    const baseUrl = await getTenantBaseUrl();

    // Fetch product server-side
    const product = await fetchProductBySlug(slug, undefined, 60);

    if (!product) {
      notFound();
    }

    // Fetch related products
    const relatedProducts = await fetchFeaturedProducts(4, 60).catch(() => []);

    // Helper to get localized values
    const getName = (obj: string | Record<string, string> | undefined): string => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj.en || obj.ka || Object.values(obj)[0] || "";
    };

    const getDescription = (obj: string | Record<string, string> | undefined): string => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj.en || obj.ka || Object.values(obj)[0] || "";
    };

    const productName = getName(product.name);
    const productDescription = getDescription(
      product.short_description || product.name
    );

    // Ensure image URL is absolute for structured data
    let productImage = product.image || undefined;
    if (productImage && !productImage.startsWith("http")) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || baseUrl;
      productImage = `${apiBase}${productImage.startsWith("/") ? "" : "/"}${productImage}`;
    }

    // Calculate price valid until (30 days from now)
    const priceValidDate = new Date();
    priceValidDate.setDate(priceValidDate.getDate() + 30);

    // Generate Product Schema (JSON-LD) with AggregateRating for Google rich snippets
    const productSchema = generateProductSchema({
      name: productName,
      description: productDescription,
      image: productImage,
      sku: product.sku || undefined,
      brand: config.store.name,
      ...(product.average_rating && product.review_count
        ? {
            aggregateRating: {
              ratingValue: product.average_rating,
              reviewCount: product.review_count,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
      offers: {
        price: parseFloat(product.price),
        priceCurrency: config.locale.currency,
        availability:
          (product.quantity || 0) > 0 ? "InStock" : "OutOfStock",
        url: `${baseUrl}/products/${slug}`,
        ...(product.compare_at_price && {
          priceValidUntil: priceValidDate.toISOString(),
        }),
      },
    });

    // Generate Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      {
        name: "Home",
        url: baseUrl,
      },
      {
        name: "Products",
        url: `${baseUrl}/products`,
      },
      {
        name: productName,
        url: `${baseUrl}/products/${slug}`,
      },
    ]);

    return (
      <>
        {/* Structured Data for SEO */}
        <StructuredData data={productSchema} />
        <StructuredData data={breadcrumbSchema} />

        {/* Client Component for interactivity */}
        <ProductDetailClient
          product={product}
          relatedProducts={relatedProducts}
        />
      </>
    );
  } catch (error) {
    console.error("Error rendering product page:", error);
    notFound();
  }
}
