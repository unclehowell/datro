import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    turbopackMemoryLimit: 1024,
  },
};

export default nextConfig;
