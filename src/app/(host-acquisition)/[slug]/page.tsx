import { notFound } from "next/navigation";
import { JapanHostSeoLayout } from "@/components/seo/JapanHostSeoLayout";
import { createPageMetadata } from "@/lib/site-metadata";
import {
  getAllJapanHostSeoSlugs,
  getJapanHostSeoPage,
} from "@/lib/seo/japan-host-catalog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllJapanHostSeoSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = getJapanHostSeoPage(slug);

  if (!page) {
    return createPageMetadata({
      title: "Page Not Found",
      description: "This page could not be found.",
      path: `/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: page.pageTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
    image: page.image,
  });
}

export default async function JapanHostSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getJapanHostSeoPage(slug);

  if (!page) {
    notFound();
  }

  return <JapanHostSeoLayout page={page} />;
}
