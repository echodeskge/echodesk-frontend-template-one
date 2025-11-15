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
};

export default nextConfig;
