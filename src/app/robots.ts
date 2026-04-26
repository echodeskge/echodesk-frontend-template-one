import { MetadataRoute } from "next";
import { getTenantBaseUrl } from "@/lib/tenant-url";

/**
 * Robots.txt configuration
 * Controls search engine crawler access. Tenant-aware sitemap URL —
 * derived from the request host so each tenant subdomain advertises
 * its own sitemap instead of the placeholder.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getTenantBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/products/*"],
        disallow: [
          "/api/",
          "/cart",
          "/checkout",
          "/account",
          "/account/*",
          "/login",
          "/register",
          "/forgot-password",
          "/wishlist",
          "/order-confirmation",
          "/_next/",
          "/admin/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
