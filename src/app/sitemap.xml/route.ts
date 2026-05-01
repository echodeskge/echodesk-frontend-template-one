import { fetchAllProductsForSitemap } from "@/lib/fetch-server";
import { getTenantBaseUrl } from "@/lib/tenant-url";

/**
 * Custom sitemap.xml — replaces Next's `MetadataRoute.Sitemap` helper
 * because we need fields that the typed helper doesn't expose:
 *
 * - `<image:image>` per product so Google Image Search picks up
 *   product photos (otherwise images are only discoverable via JSON-LD
 *   and OG tags, which is much weaker for image SERPs).
 * - The `lastmod` actually points at the product's last `updated_at`
 *   instead of `new Date()` per render (which made the previous
 *   sitemap useless to crawl-budget heuristics).
 *
 * Adding `<xhtml:link rel="alternate" hreflang="…">` per locale would
 * also live here when locale-specific URLs ship; right now the
 * storefront serves all three languages on the same URL via cookie, so
 * a hreflang declaration would be misleading and is omitted on
 * purpose. (See app/layout.tsx canonical comment.)
 */
export const revalidate = 3600; // 1h — sitemap freshness vs API load

const escapeXml = (raw: string): string =>
  raw.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });

const absoluteImage = (raw: string | null, baseUrl: string): string | null => {
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || baseUrl;
  return `${apiBase}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

export async function GET(): Promise<Response> {
  const baseUrl = await getTenantBaseUrl();
  const now = new Date().toISOString();

  const staticPages: { url: string; lastmod: string; freq: string; priority: string }[] = [
    { url: baseUrl, lastmod: now, freq: "daily", priority: "1.0" },
    { url: `${baseUrl}/products`, lastmod: now, freq: "daily", priority: "0.9" },
    { url: `${baseUrl}/categories`, lastmod: now, freq: "weekly", priority: "0.7" },
    { url: `${baseUrl}/faq`, lastmod: now, freq: "monthly", priority: "0.5" },
    { url: `${baseUrl}/shipping`, lastmod: now, freq: "monthly", priority: "0.4" },
    { url: `${baseUrl}/returns`, lastmod: now, freq: "monthly", priority: "0.4" },
    { url: `${baseUrl}/terms`, lastmod: now, freq: "monthly", priority: "0.3" },
    { url: `${baseUrl}/privacy`, lastmod: now, freq: "monthly", priority: "0.3" },
  ];

  const products = await fetchAllProductsForSitemap().catch(() => []);

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  );

  for (const p of staticPages) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(p.url)}</loc>`);
    lines.push(`    <lastmod>${p.lastmod}</lastmod>`);
    lines.push(`    <changefreq>${p.freq}</changefreq>`);
    lines.push(`    <priority>${p.priority}</priority>`);
    lines.push("  </url>");
  }

  for (const p of products) {
    const url = `${baseUrl}/products/${encodeURIComponent(p.slug)}`;
    const lastmod = p.lastmod ? new Date(p.lastmod).toISOString() : now;
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(url)}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push("    <changefreq>weekly</changefreq>");
    lines.push("    <priority>0.8</priority>");
    const imgUrl = absoluteImage(p.image, baseUrl);
    if (imgUrl) {
      lines.push("    <image:image>");
      lines.push(`      <image:loc>${escapeXml(imgUrl)}</image:loc>`);
      if (p.name) {
        lines.push(`      <image:title>${escapeXml(p.name)}</image:title>`);
      }
      lines.push("    </image:image>");
    }
    lines.push("  </url>");
  }

  lines.push("</urlset>");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
