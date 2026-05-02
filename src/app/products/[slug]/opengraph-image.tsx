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

// Force Node runtime so we have access to the full Buffer / fetch
// stack — Satori's edge-runtime fetch was silently failing for the
// product photo on every social share. Node runtime also gets us
// proper TLS handling with the DigitalOcean Spaces CDN.
export const runtime = "nodejs";

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

  // Pre-fetch the product photo server-side, transcode to JPEG, and
  // inline as a data URL. Satori (the renderer behind next/og) only
  // decodes JPEG / PNG natively — WebP / AVIF blow up the entire
  // ImageResponse with a 500. DigitalOcean Spaces serves every
  // product photo as WebP, so we run the bytes through `sharp` to
  // get a Satori-compatible JPEG. Sharp is already a transitive
  // dependency of next/image; we just import it directly here.
  let imageDataUrl: string | null = null;
  if (rawImageUrl) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(rawImageUrl, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const srcBuf = Buffer.from(await res.arrayBuffer());
        // Detect format via magic bytes — JPEG / PNG can be inlined as-is,
        // anything else gets transcoded with sharp.
        const isJpeg =
          srcBuf[0] === 0xff && srcBuf[1] === 0xd8 && srcBuf[2] === 0xff;
        const isPng =
          srcBuf[0] === 0x89 &&
          srcBuf[1] === 0x50 &&
          srcBuf[2] === 0x4e &&
          srcBuf[3] === 0x47;
        if (isJpeg || isPng) {
          const mime = isJpeg ? "image/jpeg" : "image/png";
          imageDataUrl = `data:${mime};base64,${srcBuf.toString("base64")}`;
        } else {
          const sharp = (await import("sharp")).default;
          const jpegBuf = await sharp(srcBuf)
            .resize({ width: 600, height: 630, fit: "cover", position: "center" })
            .jpeg({ quality: 82 })
            .toBuffer();
          imageDataUrl = `data:image/jpeg;base64,${jpegBuf.toString("base64")}`;
        }
      }
    } catch {
      /* fall through to placeholder letter */
    }
  }
  void baseUrl;

  try {
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
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingLeft: 28,
              paddingRight: 28,
              paddingTop: 14,
              paddingBottom: 14,
              background: "#f7e98a",
              color: "#1a1a2e",
              borderRadius: 999,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              alignSelf: "flex-start",
            }}
          >
            Buy now →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
  } catch {
    // Last-resort safety net: if the rich card blows up for any reason
    // (font loading, RSC payload edge case, etc.), still return *something*
    // so social scrapers don't 500 and the share preview isn't blank.
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
}
