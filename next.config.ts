import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Ensure proper handling of images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
