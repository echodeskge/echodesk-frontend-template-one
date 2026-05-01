import { ImageResponse } from "next/og";
import { fetchProductBySlug } from "@/lib/fetch-server";
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
  const [product, storeName, baseUrl] = await Promise.all([
    fetchProductBySlug(slug).catch(() => null),
    getTenantStoreName().catch(() => "Store"),
    getTenantBaseUrl().catch(() => ""),
  ]);

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

  // Pipe the product photo through Next's image optimizer
  // (`/_next/image`) so Satori receives a JPEG from our own origin
  // instead of a WebP from the DigitalOcean Spaces bucket. Satori's
  // direct external-image fetch was silently failing (WebP decoder
  // edge cases + cross-origin latency on the Spaces CDN), leaving
  // the OG card with the placeholder gradient instead of the photo.
  // The optimizer auto-converts to JPEG, applies sensible quality
  // compression, and resolves the URL to a same-origin path.
  const imageUrl =
    rawImageUrl && baseUrl
      ? `${baseUrl}/_next/image?url=${encodeURIComponent(rawImageUrl)}&w=1200&q=75`
      : rawImageUrl;

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
          {imageUrl ? (
            <img
              src={imageUrl}
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
