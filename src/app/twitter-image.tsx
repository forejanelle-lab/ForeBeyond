import { generateOgImage, OG_SIZE } from "@/lib/generate-og-image";
import { OG_IMAGE_ALT } from "@/lib/site-metadata";

export const runtime = "edge";
export const alt = OG_IMAGE_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return generateOgImage();
}
