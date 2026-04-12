import { MetadataRoute } from "next";
import { fetchAllProductSlugs } from "@/lib/fetch-server";

/**
 * Dynamic sitemap generation
 * Automatically includes all products and static pages
 *
 * LIMITATION: Next.js's built-in `MetadataRoute.Sitemap` type only supports
 * standard sitemap fields (url, lastModified, changeFrequency, priority).
 * It does NOT support Google's image sitemap extension (<image:image> tags),
 * which would allow us to include product image URLs directly in the sitemap.
 *
 * Possible workarounds:
 * 1. Create a custom route handler (`app/image-sitemap.xml/route.ts`) that
 *    returns raw XML with <image:image> extensions, and reference it in robots.txt.
 * 2. Ensure product pages have proper og:image meta tags and structured data
 *    (JSON-LD) with image URLs so search engines discover images through those.
 * 3. Use Google Search Console's image indexing which also picks up images from
 *    page content and structured data.
 *
 * Currently, product images are discoverable via JSON-LD Product schema and
 * OpenGraph meta tags on each product page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    // Fetch all product slugs
    const productSlugs = await fetchAllProductSlugs();

    // Generate product URLs
    const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
      url: `${baseUrl}/products/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return static pages only if product fetch fails
    return staticPages;
  }
}
