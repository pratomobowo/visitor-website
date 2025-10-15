import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure runtime for API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
