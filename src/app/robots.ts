import { MetadataRoute } from "next";
import { getTenantBaseUrl } from "@/lib/tenant-url";

/**
 * Robots.txt configuration. Slimmed down per SEO audit feedback —
 * one `*` rule for everyone covers 99% of cases (well-behaved bots
 * obey wildcards). Explicit blocks remain only for the two LLM
 * crawlers we want to make a deliberate choice about (currently:
 * allow them; flip to `disallow: ['/']` to opt out of training
 * on the storefront's content).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getTenantBaseUrl();

  const disallowAuth = [
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
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/products/*"],
        disallow: disallowAuth,
      },
      // LLM training crawlers — explicit allow keeps the door open
      // for ChatGPT / Perplexity / Claude to cite the storefront in
      // shopping-intent answers. Switch any of these to
      // `disallow: ['/']` to opt out of LLM training on this content.
      { userAgent: "GPTBot", disallow: disallowAuth },
      { userAgent: "ChatGPT-User", disallow: disallowAuth },
      { userAgent: "OAI-SearchBot", disallow: disallowAuth },
      { userAgent: "ClaudeBot", disallow: disallowAuth },
      { userAgent: "anthropic-ai", disallow: disallowAuth },
      { userAgent: "Claude-Web", disallow: disallowAuth },
      { userAgent: "PerplexityBot", disallow: disallowAuth },
      { userAgent: "Google-Extended", disallow: disallowAuth },
      { userAgent: "Applebot-Extended", disallow: disallowAuth },
      // Social-preview scrapers — explicit allow because their
      // failure messages default to "robots.txt block" even when the
      // wildcard rule would let them through.
      { userAgent: "facebookexternalhit", disallow: disallowAuth },
      { userAgent: "Twitterbot", disallow: disallowAuth },
      { userAgent: "LinkedInBot", disallow: disallowAuth },
      { userAgent: "Slackbot", disallow: disallowAuth },
      { userAgent: "Discordbot", disallow: disallowAuth },
      { userAgent: "TelegramBot", disallow: disallowAuth },
      { userAgent: "WhatsApp", disallow: disallowAuth },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
