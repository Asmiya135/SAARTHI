import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
    ],
  },
  eslint: {
    // Warning: Disables all ESLint checks during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: Disables all TypeScript checks during builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
