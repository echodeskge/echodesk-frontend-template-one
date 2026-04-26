import { ImageResponse } from "next/og";
import { getTenantInitial, getTenantPrimaryColor } from "@/lib/tenant-url";

/**
 * Per-tenant iOS home-screen icon.
 *
 * Same brand-letter-on-coloured-square recipe as `icon.tsx`, but
 * scaled to 180×180 — Safari uses this when the visitor adds the
 * store to their home screen. Without this file, iOS falls back to
 * a blurry screenshot of the page.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function AppleIcon() {
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
          color: "white",
          fontSize: 124,
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
