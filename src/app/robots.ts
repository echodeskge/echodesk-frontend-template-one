import { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * Controls search engine crawler access
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourstore.com";

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
  };
}
