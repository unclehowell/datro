import type { NextConfig } from "next";

// Cast via `as` (not a typed annotation) so the `eslint.ignoreDuringBuilds`
// key is accepted even though this Next release's NextConfig type no longer
// declares it. Runtime behaviour is preserved: `next build` must NOT fail on
// lint warnings during OTA rebuilds (lint is enforced separately in CI).
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    turbopackMemoryLimit: 1024,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // HTML pages: never cache, always revalidate
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // Static assets (CSS/JS with content-hash filenames): cache permanently
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
} as NextConfig;

export default nextConfig;
