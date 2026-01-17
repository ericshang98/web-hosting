import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages
  experimental: {
    // Enable edge runtime for all routes
  },
};

export default nextConfig;
