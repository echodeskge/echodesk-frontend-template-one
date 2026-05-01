import { MetadataRoute } from "next";
import { getTenantBaseUrl } from "@/lib/tenant-url";

/**
 * Robots.txt configuration.
 *
 * The default `*` rule allows everything except auth-gated pages.
 * Below it, every major social, search, and ad crawler we care about
 * is explicitly allow-listed — this is defensive (the wildcard already
 * permits them) but Facebook, LinkedIn, and similar scrapers print
 * "could be a robots.txt block" as their default failure message, so
 * an explicit grant cuts down support load.
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

  // Crawlers explicitly granted access. Per robots.txt spec, a user-agent
  // sees the most specific matching rule block, not all of them — so this
  // makes the rule explicit for each named crawler instead of relying on
  // them to fall through to "*".
  const allowedCrawlers = [
    // Search engines
    "Googlebot",
    "Googlebot-Image",
    "Googlebot-News",
    "Bingbot",
    "DuckDuckBot",
    "YandexBot",
    "Baiduspider",
    // Ads / shopping (Google Merchant Center, Shopping ads, mobile ads)
    "AdsBot-Google",
    "AdsBot-Google-Mobile",
    "Mediapartners-Google",
    "Storebot-Google",
    // Social link previews
    "facebookexternalhit",
    "Facebot",
    "Twitterbot",
    "LinkedInBot",
    "Slackbot",
    "Slackbot-LinkExpanding",
    "Discordbot",
    "TelegramBot",
    "WhatsApp",
    "Pinterestbot",
    "redditbot",
    "Applebot",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/products/*"],
        disallow: disallowAuth,
      },
      ...allowedCrawlers.map((userAgent) => ({
        userAgent,
        disallow: disallowAuth,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
