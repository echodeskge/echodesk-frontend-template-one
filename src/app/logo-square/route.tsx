import { ImageResponse } from "next/og";

/**
 * 1200×1200 square brand logo for ads (Google Ads, Meta Ads, etc.).
 *
 * Google Ads requires a 1:1 logo at minimum 1200×1200 PNG. Visit
 * `https://refurb.ge/logo-square` and right-click → save image to get
 * a downloadable file you can upload to the ads platform.
 *
 * The mark is the storefront's Voltage brand:
 *   - yellow background (--accent #f7e98a)
 *   - "Refurb." in dark ink with a bold accent dot
 *   - thin border for definition on light backgrounds
 *
 * Force Node runtime so the wide font weights render correctly.
 */

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 1200 };

export async function GET() {
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
          position: "relative",
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Inner frame for definition + premium feel */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 60,
            right: 60,
            bottom: 60,
            border: "8px solid #1a1a2e",
            borderRadius: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              color: "#1a1a2e",
              fontSize: 280,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 1,
            }}
          >
            <span>Refurb</span>
            {/* Accent dot — the brand period */}
            <span
              style={{
                display: "inline-block",
                width: 56,
                height: 56,
                background: "#1a1a2e",
                borderRadius: 999,
                marginLeft: 16,
                marginBottom: 24,
              }}
            />
          </div>
        </div>

        {/* Tiny tagline strip at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            color: "#1a1a2e",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          Honest electronics · Tbilisi
        </div>
      </div>
    ),
    { ...size },
  );
}
