import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mengizinkan build production selesai meskipun proyekmu memiliki error TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
