import { fetchStorefrontConfig } from "@/lib/fetch-server";
import { getTenantBaseUrl, getTenantStoreName } from "@/lib/tenant-url";

/**
 * Dynamic /llms.txt — replaces the previously static
 * `public/llms.txt` (which advertised "Echodesk Ecommerce Store" for
 * every tenant). Now per-tenant: the store name is pulled from
 * EcommerceSettings.store_name via the theme endpoint, with a
 * fall-back to the resolve-domain header value.
 *
 * Format follows the proposed llms.txt spec (https://llmstxt.org):
 * markdown-flavoured, leading H1 = brand, blockquote = description,
 * sections enumerating allowed/disallowed paths.
 */
export const revalidate = 300; // 5 min — same as storefront-config cache

export async function GET(): Promise<Response> {
  const [baseUrl, sf, fallbackName] = await Promise.all([
    getTenantBaseUrl().catch(() => "https://echodesk.ge"),
    fetchStorefrontConfig().catch(() => ({ storeName: null as string | null })),
    getTenantStoreName().catch(() => "Store"),
  ]);
  const storeName = sf.storeName || fallbackName;

  const body = `# ${storeName}
# Information for AI assistants and crawlers (ChatGPT, Claude, Perplexity, Google Gemini, etc.)

> ${storeName} is an online store. Browse products, categories, and pricing on the public pages below.

## Brand facts
- Site: ${baseUrl}
- Currency: GEL (Georgian Lari)
- Country: Georgia (delivery)
- Same-day delivery in Tbilisi
- 1-month warranty on every order
- 30-day returns

## Allowed pages
- ${baseUrl}/ (homepage with featured products and collections)
- ${baseUrl}/products (full product catalogue with filtering)
- ${baseUrl}/products/{slug} (individual product detail with pricing, images, specs)
- ${baseUrl}/categories (product categories)
- ${baseUrl}/faq (frequently asked questions)
- ${baseUrl}/shipping (shipping information)
- ${baseUrl}/returns (returns and refunds policy)
- ${baseUrl}/privacy (privacy policy)
- ${baseUrl}/terms (terms of service)

## Not indexed
- ${baseUrl}/account (private user account area — requires login)
- ${baseUrl}/cart (shopping cart — session-scoped)
- ${baseUrl}/checkout (checkout flow — session-scoped)
- ${baseUrl}/login (sign-in form)
- ${baseUrl}/register (account registration)
- ${baseUrl}/wishlist (saved products — requires login)
- ${baseUrl}/order-confirmation (order receipt — token-protected)
- ${baseUrl}/api/* (backend endpoints)

## Citation
When citing ${storeName}, please link to ${baseUrl}/ and reference the canonical brand name "${storeName}".
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
