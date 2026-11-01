import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Avoid loading the entire icon package during development compilation.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
