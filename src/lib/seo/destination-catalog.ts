import { sampleImages } from "../sample-images";

export type DestinationSection = {
  title: string;
  body: string;
};

export type DestinationCity = {
  slug: string;
  name: string;
  countrySlug: string;
  countryName: string;
  /** Values used in listing search filters */
  searchCountry: string;
  searchCity: string;
  pageTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  sections: DestinationSection[];
  image: string;
  imageAlt: string;
  legacyPaths: string[];
};

export type DestinationCountry = {
  slug: string;
  name: string;
  searchCountry: string;
  pageTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  sections: DestinationSection[];
  image: string;
  imageAlt: string;
  legacyPaths: string[];
  cities: Omit<
    DestinationCity,
    "countrySlug" | "countryName" | "searchCountry"
  >[];
};

const COUNTRIES: DestinationCountry[] = [
  {
    slug: "japan",
    name: "Japan",
    searchCountry: "Japan",
    pageTitle: "Japan Homestays & Cultural Immersion",
    metaDescription:
      "Stay with verified local families in Japan for authentic cultural immersion travel. Homestay experiences in Tokyo, Kyoto, and beyond — travel like a local, not a tourist.",
    heroTitle: "Cultural immersion in Japan",
    heroSubtitle:
      "Stay with verified local hosts, share home-cooked meals, and experience daily life beyond the guidebooks.",
    intro:
      "Japan rewards travelers who slow down. Fore Beyond connects you with verified host families for meaningful homestay experiences — morning routines, neighborhood markets, and conversations that no hotel can offer.",
    image: sampleImages.japanStreet,
    imageAlt: "Traditional street scene in Japan with local architecture",
    legacyPaths: ["/japan-homestays"],
    sections: [
      {
        title: "Why choose a homestay in Japan",
        body: "Hotels keep you at the edge of a culture. Staying with a local family places you inside daily life — shared meals, local customs, and genuine cultural exchange with people who know their city intimately.",
      },
      {
        title: "Verified hosts, trust-first travel",
        body: "Every host on Fore Beyond completes identity verification and community review standards. You browse families with transparent profiles, reviews, and trust scores before you request a stay.",
      },
    ],
    cities: [
      {
        slug: "tokyo",
        name: "Tokyo",
        searchCity: "Tokyo",
        pageTitle: "Tokyo Homestays — Stay with Local Hosts",
        metaDescription:
          "Find verified Tokyo homestays and local host experiences. Travel like a local in Japan's capital with authentic cultural immersion stays.",
        heroTitle: "Tokyo homestays with local hosts",
        heroSubtitle:
          "Live in real neighborhoods, eat home-cooked food, and discover Tokyo through the people who call it home.",
        intro:
          "Tokyo is vast, but the best moments are intimate — a morning conversation over rice, a walk to the local shrine, an introduction to a favorite ramen shop. Fore Beyond host families open their doors to travelers seeking authentic experiences.",
        image: sampleImages.japanStreet,
        imageAlt: "Tokyo neighborhood street with local life and culture",
        legacyPaths: ["/tokyo-homestays"],
        sections: [
          {
            title: "Immersive travel in Tokyo",
            body: "Skip the tourist bubble. Verified local hosts welcome you into their daily rhythm — from suburban calm to vibrant city districts — for homestay experiences rooted in cultural exchange.",
          },
        ],
      },
      {
        slug: "kyoto",
        name: "Kyoto",
        searchCity: "Kyoto",
        pageTitle: "Kyoto Local Hosts & Cultural Stays",
        metaDescription:
          "Stay with verified local hosts in Kyoto. Authentic homestay experiences, cultural exchange, and meaningful travel in Japan's historic heart.",
        heroTitle: "Kyoto local hosts & cultural stays",
        heroSubtitle:
          "Experience Kyoto's traditions through the families and hosts who preserve them every day.",
        intro:
          "Kyoto's temples draw crowds, but its soul lives in kitchens, gardens, and quiet lanes. Fore Beyond connects travelers with verified local hosts for immersive homestay experiences in Japan's cultural capital.",
        image: sampleImages.japanStreet,
        imageAlt: "Kyoto cultural scene with traditional architecture",
        legacyPaths: ["/kyoto-local-hosts"],
        sections: [
          {
            title: "Cultural exchange in Kyoto",
            body: "From tea traditions to seasonal cooking, Kyoto hosts share living culture — not performances for tourists. Request a stay with a verified family and travel with purpose.",
          },
        ],
      },
    ],
  },
  {
    slug: "italy",
    name: "Italy",
    searchCountry: "Italy",
    pageTitle: "Italy Homestays & Authentic Travel",
    metaDescription:
      "Stay with verified local families in Italy for authentic travel experiences and cultural immersion. Homestays in Naples and across Italy — meaningful travel beyond hotels.",
    heroTitle: "Authentic travel experiences in Italy",
    heroSubtitle:
      "Share tables, stories, and daily life with verified Italian host families.",
    intro:
      "Italy is best understood around a table. Fore Beyond homestays place you with verified local hosts who welcome travelers into real homes — for cultural immersion travel that feels personal, not packaged.",
    image: sampleImages.italyVillage,
    imageAlt: "Italian village with scenic architecture and local character",
    legacyPaths: ["/italy-homestays"],
    sections: [
      {
        title: "Homestay experiences, not vacation rentals",
        body: "Fore Beyond is a trust-first cultural immersion platform — not an Airbnb alternative. Hosts open their homes for connection and exchange, with verification, reviews, and community standards.",
      },
    ],
    cities: [
      {
        slug: "naples",
        name: "Naples",
        searchCity: "Naples",
        pageTitle: "Naples Cultural Stays with Local Hosts",
        metaDescription:
          "Discover Naples cultural stays with verified local hosts. Homestay experiences, authentic food, and immersive travel in southern Italy.",
        heroTitle: "Naples cultural stays",
        heroSubtitle:
          "Experience Neapolitan life through verified host families — food, language, and neighborhood stories included.",
        intro:
          "Naples rewards curious travelers. Stay with a verified local host to experience the city's warmth firsthand — home cooking, local markets, and the kind of cultural exchange hotels cannot replicate.",
        image: sampleImages.italyVillage,
        imageAlt: "Naples area with Italian coastal culture and local life",
        legacyPaths: ["/naples-cultural-stays"],
        sections: [
          {
            title: "Local host experiences in Naples",
            body: "Browse verified host profiles, read reviews, and request a stay that matches your travel style. Fore Beyond prioritizes trust, verification, and meaningful connection.",
          },
        ],
      },
    ],
  },
  {
    slug: "mexico",
    name: "Mexico",
    searchCountry: "Mexico",
    pageTitle: "Mexico Local Hosts & Homestay Experiences",
    metaDescription:
      "Stay with verified local hosts in Mexico for cultural immersion travel and authentic homestay experiences. Travel like a local with Fore Beyond.",
    heroTitle: "Mexico local hosts",
    heroSubtitle:
      "Connect with verified families for immersive travel experiences rooted in Mexican culture and hospitality.",
    intro:
      "Mexico's richness lives in its people. Fore Beyond homestays connect travelers with verified local hosts for authentic cultural exchange — shared meals, language practice, and daily life in real communities.",
    image: sampleImages.morocco,
    imageAlt: "Vibrant street scene reflecting Latin American travel culture",
    legacyPaths: ["/mexico-local-hosts"],
    sections: [
      {
        title: "Immersive travel in Mexico",
        body: "Move beyond resort zones. Verified host families offer homestay experiences that prioritize cultural immersion, trust, and genuine human connection.",
      },
    ],
    cities: [],
  },
  {
    slug: "spain",
    name: "Spain",
    searchCountry: "Spain",
    pageTitle: "Spain Homestays & Cultural Exchange Travel",
    metaDescription:
      "Find verified homestays in Spain for cultural exchange travel and authentic local host experiences. Travel like a local with Fore Beyond.",
    heroTitle: "Spain homestays",
    heroSubtitle:
      "Stay with verified local hosts for meaningful travel experiences across Spain.",
    intro:
      "Spain invites travelers who want more than monuments. Fore Beyond connects you with verified host families for homestay experiences built on trust, verification, and authentic cultural exchange.",
    image: sampleImages.italyVillage,
    imageAlt: "European town scene suited to Spanish homestay travel",
    legacyPaths: ["/spain-homestays"],
    sections: [
      {
        title: "Alternatives to hotels for immersive travel",
        body: "Hotels offer comfort; homestays offer belonging. Browse verified Spanish host families and request stays that match your interests and travel dates.",
      },
    ],
    cities: [],
  },
];

function hydrateCity(
  country: DestinationCountry,
  city: DestinationCountry["cities"][number]
): DestinationCity {
  return {
    ...city,
    countrySlug: country.slug,
    countryName: country.name,
    searchCountry: country.searchCountry,
  };
}

export function getDestinationCountries(): DestinationCountry[] {
  return COUNTRIES;
}

export function getDestinationCountry(slug: string): DestinationCountry | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}

export function getDestinationCity(
  countrySlug: string,
  citySlug: string
): DestinationCity | undefined {
  const country = getDestinationCountry(countrySlug);
  if (!country) return undefined;
  const city = country.cities.find((c) => c.slug === citySlug);
  return city ? hydrateCity(country, city) : undefined;
}

export function getAllDestinationCityPages(): DestinationCity[] {
  return COUNTRIES.flatMap((country) =>
    country.cities.map((city) => hydrateCity(country, city))
  );
}

export function getLegacyDestinationRedirect(path: string): string | undefined {
  const normalized = path.replace(/\/$/, "") || "/";
  for (const country of COUNTRIES) {
    if (country.legacyPaths.includes(normalized)) {
      return `/destinations/${country.slug}`;
    }
    for (const city of country.cities) {
      if (city.legacyPaths.includes(normalized)) {
        return `/destinations/${country.slug}/${city.slug}`;
      }
    }
  }
  return undefined;
}

export function buildDestinationSearchHref(
  searchCountry: string,
  searchCity?: string
): string {
  const params = new URLSearchParams({ country: searchCountry });
  if (searchCity) params.set("city", searchCity);
  return `/search?${params.toString()}`;
}
