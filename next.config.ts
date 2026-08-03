import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "pg"],
  experimental: {
    optimizePackageImports: ["motion", "lucide-react"],
    // Tailwind is ~19KiB — inline removes render-blocking CSS waterfall (FCP/LCP).
    // Trade-off: no separate CSS cache for return visitors. Worth it for cold PageSpeed.
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer && config.optimization?.splitChunks) {
      const split = config.optimization.splitChunks;
      if (typeof split === "object" && split !== false) {
        split.cacheGroups = {
          ...split.cacheGroups,
          // Keep Hexclave + Stripe out of marketing shared chunks (PageSpeed TBT/LCP).
          hexclave: {
            test: /[\\/]node_modules[\\/](@hexclave|@stripe)[\\/]/,
            name: "hexclave-vendor",
            // async only — sync Hexclave stays in (hexclave) layout chunk,
            // never shared into marketing/next/link.
            chunks: "async",
            enforce: true,
            priority: 50,
          },
        };
      }
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/landing/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
