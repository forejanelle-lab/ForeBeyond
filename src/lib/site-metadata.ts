import type { Metadata } from "next";

export const PRODUCTION_SITE_URL = "https://fore-beyond.vercel.app";

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return PRODUCTION_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Fore Beyond";
export const DEFAULT_TITLE = "Fore Beyond | Travel Deeper. Belong Anywhere.";
export const DEFAULT_DESCRIPTION =
  "Stay with verified local hosts, experience authentic cultures, and travel beyond tourism with Fore Beyond.";
export const OG_IMAGE_PATH = "/opengraph-image";
export const OG_IMAGE_ALT =
  "Fore Beyond — Travel Deeper. Belong Anywhere.";

export const SITE_KEYWORDS = [
  "Fore Beyond",
  "cultural immersion",
  "authentic travel",
  "local hosts",
  "homestay",
  "verified hosts",
  "trust-first travel",
  "meaningful travel",
  "travel beyond tourism",
];

function buildOgImage(
  url: string = OG_IMAGE_PATH,
  alt: string = OG_IMAGE_ALT
) {
  return {
    url,
    width: 1200,
    height: 630,
    alt,
  };
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return SITE_URL;
  return `${SITE_URL}${normalized}`;
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [buildOgImage()],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
};

type PageMetadataInput = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
  image?: string | { url: string; width?: number; height?: number; alt?: string };
};

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  noIndex = false,
  image,
}: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonical = path.startsWith("/") ? path : `/${path}`;
  const url = absoluteUrl(canonical);
  const ogImage = image ?? buildOgImage();

  const imageEntry =
    typeof ogImage === "string" ? { url: ogImage } : ogImage;

  return {
    title,
    description,
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : { alternates: { canonical: absoluteUrl(canonical) } }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url,
      images: [imageEntry],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageEntry.url],
    },
  };
}

export const privatePageMetadata = (input: Omit<PageMetadataInput, "noIndex">) =>
  createPageMetadata({ ...input, noIndex: true });
