import { ImageResponse } from "next/og";
import { fetchProductBySlug, fetchStorefrontConfig } from "@/lib/fetch-server";
import { getTenantBaseUrl, getTenantStoreName } from "@/lib/tenant-url";

/**
 * Per-product Open Graph image generated at edge-time. When a product
 * URL is shared on Facebook / LinkedIn / Twitter / Slack / WhatsApp,
 * the social card now shows the product's own photo + name + price
 * instead of falling back to the storefront's generic card.
 *
 * 1200×630 is the canonical size for OG cards (Facebook + LinkedIn);
 * smaller scrapers crop in. PNG is mandatory for the image-fetcher
 * compat path on older clients.
 */

export const alt = "Product Open Graph image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 5-min revalidate window matches the storefront-config cache. Edits
// to a product's image / price in admin show up on the social card on
// the next request after that window.
export const revalidate = 300;

const splitImage = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  return (
    raw
      .split(",")
      .map((s) => s.trim())
      .find((s) => s.startsWith("http://") || s.startsWith("https://")) || null
  );
};

const localizedName = (
  value: unknown,
  fallback: string,
): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const o = value as Record<string, string>;
    return o.en || o.ka || o.ru || Object.values(o)[0] || fallback;
  }
  return fallback;
};

export default async function ProductOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, fallbackStoreName, baseUrl, storefrontConfig] = await Promise.all([
    fetchProductBySlug(slug).catch(() => null),
    getTenantStoreName().catch(() => "Store"),
    getTenantBaseUrl().catch(() => ""),
    fetchStorefrontConfig().catch(() => ({ storeName: null })),
  ]);

  // Prefer the EcommerceSettings.store_name the tenant configured in
  // /settings/ecommerce ("Refurb") over the Tenant.store_name middleware
  // header which is the schema slug ("groot"). Fall back to the slug
  // only when EcommerceSettings hasn't been touched yet.
  const storeName = storefrontConfig.storeName || fallbackStoreName;

  if (!product) {
    // Fall through to the root-level opengraph-image (Next does this
    // automatically when this function returns nothing). Render a
    // graceful default so the social card isn't blank.
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7e98a",
            fontSize: 96,
            fontWeight: 800,
            color: "#1a1a2e",
            letterSpacing: "-0.04em",
          }}
        >
          {storeName}.
        </div>
      ),
      { ...size },
    );
  }

  const name = localizedName(product.name, slug);
  // The ₾ glyph (Georgian Lari, U+20BE) isn't in the default Satori
  // font, so it renders as a tofu box on the OG card. Use the ISO
  // currency code "GEL" instead — universally legible and recognised
  // by all social previewers.
  const price = product.price ? `${Number(product.price).toFixed(0)} GEL` : "";
  const wasRaw = product.compare_at_price;
  const was = wasRaw ? `${Number(wasRaw).toFixed(0)} GEL` : null;
  const rawImageUrl = splitImage(product.image);

  // Fetch the product photo through Next's image optimizer and inline
  // the resulting JPEG as a data URL. Three things in one:
  //   1. Same-origin URL (no cross-origin issues to the Spaces CDN).
  //   2. Optimizer auto-converts WebP → JPEG (Satori-friendly format).
  //   3. Inlining bypasses the Satori-internal fetch path that has
  //      been silently failing on every social share — the renderer
  //      gets the bytes directly and never has to make a network call.
  // 5s timeout so a slow origin doesn't block the whole OG response.
  let imageDataUrl: string | null = null;
  if (rawImageUrl && baseUrl) {
    const optimizedUrl = `${baseUrl}/_next/image?url=${encodeURIComponent(rawImageUrl)}&w=1200&q=75`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(optimizedUrl, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        // btoa works on edge runtime; Buffer.toString('base64') doesn't.
        const bin = new Uint8Array(buf);
        let s = "";
        const chunk = 0x8000;
        for (let i = 0; i < bin.length; i += chunk) {
          s += String.fromCharCode.apply(
            null,
            Array.from(bin.subarray(i, i + chunk)),
          );
        }
        const b64 = btoa(s);
        const mime = res.headers.get("content-type") || "image/jpeg";
        imageDataUrl = `data:${mime};base64,${b64}`;
      }
    } catch {
      /* fall through to placeholder */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#1a1a2e",
          color: "#f7f4eb",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Left — product photo */}
        <div
          style={{
            width: 600,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #f7e98a 0%, #efd84a 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt={name}
              width={600}
              height={630}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: 200,
                fontWeight: 800,
                color: "#1a1a2e",
                opacity: 0.3,
              }}
            >
              {name.charAt(0).toUpperCase() + ""}
            </div>
          )}
        </div>

        {/* Right — name + price + store */}
        <div
          style={{
            width: 600,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 56,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              opacity: 0.6,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {storeName}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: name.length > 30 ? 56 : 72,
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              {name}
            </div>
            {price && (
              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    color: "#f7e98a",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {price}
                </span>
                {was && was !== price && (
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 600,
                      opacity: 0.5,
                      textDecoration: "line-through",
                    }}
                  >
                    {was}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: 18,
              opacity: 0.6,
              letterSpacing: "0.04em",
            }}
          >
            Free same-day delivery in Tbilisi
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
