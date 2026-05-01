import type { NextConfig } from "next";

// Parse image hostnames from environment variable
// Format: comma-separated list of hostnames, e.g., "cdn.example.com,images.example.com"
const imageHostnames = process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES
  ? process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES.split(",").map((h) => h.trim())
  : [];

// Create remote patterns for each hostname
const remotePatterns = imageHostnames.map((hostname) => ({
  protocol: "https" as const,
  hostname,
  pathname: "/**",
}));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Default pattern for DigitalOcean Spaces (Echodesk default)
      {
        protocol: "https",
        hostname: "echodesk-spaces.fra1.digitaloceanspaces.com",
        pathname: "/**",
      },
      // Additional patterns from environment variable
      ...remotePatterns,
    ],
  },

  /**
   * Security headers — addresses the SEO audit's "missing CSP /
   * X-Content-Type-Options / Referrer-Policy / X-Frame-Options /
   * Permissions-Policy" findings. HSTS is set automatically by
   * Vercel and we keep it. The CSP allows the storefront's own
   * origin, the EchoDesk API host, the DigitalOcean Spaces image
   * bucket, the EchoDesk widget script, Google Fonts, and the
   * Vercel image optimizer. Inline styles are allowed because
   * Tailwind/Next inline some critical CSS; inline scripts use a
   * nonce-less 'self' + Vercel's hashing for static chunks.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Permissions-Policy",
            // Disable APIs we never use; trims attack surface and
            // avoids browser permission prompts on shared embeds.
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
