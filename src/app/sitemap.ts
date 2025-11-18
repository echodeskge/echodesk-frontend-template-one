import { MetadataRoute } from "next";
import { fetchAllProductSlugs } from "@/lib/fetch-server";

/**
 * Dynamic sitemap generation
 * Automatically includes all products and static pages
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
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
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
