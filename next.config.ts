import type { NextConfig } from "next";

const legacyDestinationRedirects = [
  { source: "/japan-homestays", destination: "/destinations/japan", permanent: true },
  { source: "/tokyo-homestays", destination: "/destinations/japan/tokyo", permanent: true },
  { source: "/kyoto-local-hosts", destination: "/destinations/japan/kyoto", permanent: true },
  { source: "/italy-homestays", destination: "/destinations/italy", permanent: true },
  { source: "/naples-cultural-stays", destination: "/destinations/italy/naples", permanent: true },
  { source: "/mexico-local-hosts", destination: "/destinations/mexico", permanent: true },
  { source: "/spain-homestays", destination: "/destinations/spain", permanent: true },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL,
  },
  skipTrailingSlashRedirect: true,
  async redirects() {
    return legacyDestinationRedirects;
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
