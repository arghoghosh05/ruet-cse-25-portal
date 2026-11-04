import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    // Avatar objects are stored under a fresh UUID name on every upload, so an
    // image URL never changes its content and can be cached for a long time.
    // This keeps revalidations from pulling the files back out of Supabase.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "**.firebasestorage.app",
      },
    ],
  },
};

export default nextConfig;
