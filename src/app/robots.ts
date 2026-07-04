import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-metadata";

const DISALLOW = [
  "/admin",
  "/dashboard",
  "/host",
  "/settings",
  "/messages",
  "/notifications",
  "/trips",
  "/saved",
  "/onboarding",
  "/profile",
  "/verification-center",
  "/auth",
  "/design-system",
  "/api",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
