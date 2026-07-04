import type { MetadataRoute } from "next";
import { brand, colors } from "@/lib/brand";
import { SITE_NAME } from "@/lib/site-metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: brand.mission,
    start_url: "/",
    display: "standalone",
    background_color: colors.cream,
    theme_color: colors.forest,
    icons: [
      {
        src: "/logo-tree-mark.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
