import { brand } from "@/lib/brand";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site-metadata";

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type BreadcrumbItemInput = {
  name: string;
  path: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItemInput[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildHomePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/logo-fore-beyond.png"),
        description: brand.mission,
        email: "hello@forebeyond.com",
        sameAs: [],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: brand.mission,
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

type DestinationJsonLdInput = {
  name: string;
  description: string;
  path: string;
  image?: string;
  breadcrumbs: BreadcrumbItemInput[];
};

export function buildDestinationJsonLd(input: DestinationJsonLdInput) {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        name: input.name,
        description: input.description,
        url,
        ...(input.image ? { primaryImageOfPage: input.image } : {}),
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: {
          "@type": "Place",
          name: input.name,
          description: input.description,
        },
      },
      buildBreadcrumbJsonLd(input.breadcrumbs),
    ],
  };
}

type ArticleJsonLdInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  breadcrumbs: BreadcrumbItemInput[];
};

export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: input.title,
        description: input.description,
        url,
        ...(input.image ? { image: input.image } : {}),
        datePublished: input.datePublished,
        dateModified: input.dateModified ?? input.datePublished,
        author: {
          "@type": "Organization",
          name: input.authorName ?? SITE_NAME,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/logo-fore-beyond.png"),
          },
        },
        mainEntityOfPage: url,
      },
      buildBreadcrumbJsonLd(input.breadcrumbs),
    ],
  };
}

type ListingJsonLdInput = {
  id: string;
  title: string;
  description: string;
  city: string | null;
  country: string | null;
  image?: string | null;
  price?: number | null;
  priceCurrency?: string | null;
  ratingValue?: string | null;
  reviewCount?: number;
};

export function buildListingJsonLd(input: ListingJsonLdInput) {
  const url = absoluteUrl(`/families/${input.id}`);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    additionalType: "https://schema.org/Homestay",
    "@id": url,
    name: input.title,
    description: input.description,
    url,
    ...(input.image ? { image: input.image } : {}),
    address: {
      "@type": "PostalAddress",
      ...(input.city ? { addressLocality: input.city } : {}),
      ...(input.country ? { addressCountry: input.country } : {}),
    },
  };

  if (input.price != null && input.price > 0) {
    schema.offers = {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.priceCurrency ?? "USD",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  if (input.ratingValue && input.reviewCount && input.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.ratingValue,
      reviewCount: input.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  schema.breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Search Families", path: "/search" },
    { name: input.title, path: `/families/${input.id}` },
  ]);

  return schema;
}

type ExperienceJsonLdInput = {
  id: string;
  title: string;
  description: string;
  city: string | null;
  country: string | null;
  category: string;
  image?: string | null;
  price?: number | null;
  durationMinutes?: number | null;
  ratingValue?: string | null;
  reviewCount?: number;
};

export function buildExperienceJsonLd(input: ExperienceJsonLdInput) {
  const url = absoluteUrl(`/experiences/${input.id}`);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "@id": url,
    name: input.title,
    description: input.description,
    url,
    touristType: input.category,
    ...(input.image ? { image: input.image } : {}),
    address: {
      "@type": "PostalAddress",
      ...(input.city ? { addressLocality: input.city } : {}),
      ...(input.country ? { addressCountry: input.country } : {}),
    },
  };

  if (input.price != null && input.price > 0) {
    schema.offers = {
      "@type": "Offer",
      price: input.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  if (input.durationMinutes) {
    schema.timeRequired = `PT${input.durationMinutes}M`;
  }

  if (input.ratingValue && input.reviewCount && input.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.ratingValue,
      reviewCount: input.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  schema.breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Experiences", path: "/experiences" },
    { name: input.title, path: `/experiences/${input.id}` },
  ]);

  return schema;
}

type HostSeoJsonLdInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  breadcrumbs: BreadcrumbItemInput[];
  faq?: { question: string; answer: string }[];
};

export function buildHostSeoPageJsonLd(input: HostSeoJsonLdInput) {
  const url = absoluteUrl(input.path);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": url,
      name: input.title,
      description: input.description,
      url,
      ...(input.image ? { primaryImageOfPage: input.image } : {}),
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: {
        "@type": "Country",
        name: "Japan",
      },
    },
    buildBreadcrumbJsonLd(input.breadcrumbs),
  ];

  if (input.faq && input.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: input.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
