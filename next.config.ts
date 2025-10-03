import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable source maps for better error tracking in production
  productionBrowserSourceMaps: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tqulysenjfvocftkdome.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Strict mode for better error detection
  reactStrictMode: true,

  // Enhanced logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Optimize bundle analysis
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
