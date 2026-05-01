import { ImageResponse } from "next/og";
import { getTenantStoreName } from "@/lib/tenant-url";

/**
 * Default Open Graph image for the storefront. Generated at edge-time
 * with `next/og` so each tenant gets a card branded with their store
 * name. Replaces the static `/og-image.png` reference that used to
 * 404 for every tenant who hadn't uploaded a custom social image —
 * which made Facebook's Sharing Debugger flag "Bad Response Code" on
 * the resource fetch.
 *
 * Standard Facebook + Twitter dimensions: 1200×630.
 */

export const alt = "Open Graph image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Re-rendered when the tenant's store name changes (5-min cache window).
export const revalidate = 300;

export default async function OpengraphImage() {
  const storeName = await getTenantStoreName().catch(() => "Store");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: 80,
          background:
            "linear-gradient(135deg, #f7f4eb 0%, #f7e98a 50%, #efd84a 100%)",
          color: "#1a1a2e",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 600,
            opacity: 0.6,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          {storeName}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 144,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
          }}
        >
          {storeName + "."}
        </div>
      </div>
    ),
    { ...size },
  );
}
