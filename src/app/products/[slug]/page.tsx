import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreConfig } from "@/lib/store-config";
import {
  generateProductMetadata,
  generateProductSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import {
  fetchProductBySlug,
  fetchAllProductSlugs,
  fetchFeaturedProducts,
} from "@/lib/fetch-server";
import { ProductDetailClient } from "@/components/pages/product-detail-client";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

/**
 * Generate static params for all products
 * Enables static generation with ISR
 */
export async function generateStaticParams() {
  try {
    const slugs = await fetchAllProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

/**
 * Product detail page metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const config = getStoreConfig();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  // Get localized values (fallback to English or first available)
  const getName = (obj: any): string => {
    if (typeof obj === "string") return obj;
    return obj?.en || obj?.ka || Object.values(obj || {})[0] || "";
  };

  const getDescription = (obj: any): string => {
    if (typeof obj === "string") return obj;
    return obj?.en || obj?.ka || Object.values(obj || {})[0] || "";
  };

  const name = getName(product.name);
  const description = getDescription(product.short_description || product.name);

  return generateProductMetadata({
    name,
    description,
    slug,
    image: product.image || undefined,
    price: parseFloat(product.price),
    currency: config.locale.currency,
    availability: (product.quantity || 0) > 0,
    brand: config.store.name,
  });
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
  const config = getStoreConfig();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  // Fetch product server-side
  const product = await fetchProductBySlug(slug, undefined, 60);

  if (!product) {
    notFound();
  }

  // Fetch related products
  const relatedProducts = await fetchFeaturedProducts(4, 60).catch(() => []);

  // Helper to get localized values
  const getName = (obj: any): string => {
    if (typeof obj === "string") return obj;
    return obj?.en || obj?.ka || Object.values(obj || {})[0] || "";
  };

  const getDescription = (obj: any): string => {
    if (typeof obj === "string") return obj;
    return obj?.en || obj?.ka || Object.values(obj || {})[0] || "";
  };

  const productName = getName(product.name);
  const productDescription = getDescription(
    product.short_description || product.name
  );

  // Calculate price valid until (30 days from now)
  const priceValidDate = new Date();
  priceValidDate.setDate(priceValidDate.getDate() + 30);

  // Generate Product Schema (JSON-LD)
  const productSchema = generateProductSchema({
    name: productName,
    description: productDescription,
    image: product.image || undefined,
    sku: product.sku || undefined,
    brand: config.store.name,
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
}
