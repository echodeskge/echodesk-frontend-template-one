import { ImageResponse } from "next/og";
import { getTenantInitial, getTenantPrimaryColor } from "@/lib/tenant-url";

/**
 * Per-tenant browser-tab favicon.
 *
 * Renders a 32×32 PNG with the tenant's primary brand colour as the
 * background and the first letter of the store name as the glyph —
 * so `Artlighthouse` gets a purple "A", `Groot` gets a green "G",
 * etc. Tenant context is read from the middleware-set
 * `x-tenant-store-name` and `x-tenant-primary-color` headers, which
 * makes this a per-request dynamic asset (one shared Next.js instance
 * serves dozens of tenants under different subdomains).
 *
 * Browsers cache favicons aggressively — `Cache-Control: max-age=…`
 * via the export below keeps each tenant's variant in the CDN for an
 * hour but allows immediate refresh after a config change.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
// `force-dynamic` opts the route into per-request rendering so the
// `headers()` calls inside `getTenantInitial` / `getTenantPrimaryColor`
// resolve against the actual request — without it Next.js would try
// to bake a single static PNG at build time.
export const dynamic = "force-dynamic";

export default async function Icon() {
  const initial = await getTenantInitial();
  const bg = await getTenantPrimaryColor();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          borderRadius: 6,
          color: "white",
          fontSize: 22,
          fontWeight: 700,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          letterSpacing: "-0.02em",
        }}
      >
        {initial}
      </div>
    ),
    size
  );
}
