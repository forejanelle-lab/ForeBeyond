import { sampleImages } from "@/lib/sample-images";

export type TravelerStory = {
  slug: string;
  title: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  author: string;
  destination: string;
  publishedAt: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  sections: { heading: string; body: string }[];
  relatedHref: string;
};

export const TRAVELER_STORIES: TravelerStory[] = [
  {
    slug: "tokyo-homestay-reflection",
    title: "A Week in Tokyo That Changed How I Travel",
    metaDescription:
      "One traveler's story of cultural immersion in Tokyo — homestay experiences, local hosts, and meaningful travel beyond tourism.",
    heroTitle: "A week in Tokyo that changed how I travel",
    heroSubtitle: "Cultural immersion travel through a verified local host family.",
    author: "Sarah M.",
    destination: "Tokyo, Japan",
    publishedAt: "2026-01-28",
    image: sampleImages.japanStreet,
    imageAlt: "Tokyo street scene reflecting a traveler's homestay experience",
    excerpt:
      "I came to Tokyo with a packed itinerary. I left with a second family, a favorite neighborhood bakery, and a completely different definition of authentic travel.",
    sections: [
      {
        heading: "Finding a verified local host",
        body: "I searched Fore Beyond for Tokyo homestays and found a host family whose profile mentioned language exchange and home cooking. Their verification badges and reviews from other travelers gave me confidence to request a stay.",
      },
      {
        heading: "Daily life, not tourist highlights",
        body: "Mornings started with rice and conversation. My host walked me to the train, introduced me to shopkeepers, and shared stories about the neighborhood's history. These immersive travel experiences never appeared on my original checklist — and they became the trip.",
      },
      {
        heading: "Why I will choose homestays again",
        body: "Hotels had always been my default. This cultural exchange travel experience showed me that staying with local hosts creates belonging — the opposite of passing through.",
      },
    ],
    relatedHref: "/destinations/japan/tokyo",
  },
  {
    slug: "naples-family-dinner",
    title: "Dinner in Naples Felt Like Coming Home",
    metaDescription:
      "A traveler story about Naples cultural stays — homestay experiences, local host hospitality, and authentic travel in Italy.",
    heroTitle: "Dinner in Naples felt like coming home",
    heroSubtitle: "How a homestay experience turned a trip into cultural exchange.",
    author: "James R.",
    destination: "Naples, Italy",
    publishedAt: "2026-02-14",
    image: sampleImages.italyVillage,
    imageAlt: "Italian setting representing a Neapolitan homestay dinner experience",
    excerpt:
      "The best meal of my life was not in a restaurant. It was at my host's table in Naples — pasta, stories, and laughter that lasted until midnight.",
    sections: [
      {
        heading: "Requesting a cultural stay",
        body: "I wanted authentic travel experiences in Italy, not a rental apartment. Fore Beyond's host profiles emphasized family, food, and cultural exchange — exactly what I was looking for in Naples.",
      },
      {
        heading: "Trust and verification mattered",
        body: "Before requesting, I read reviews, checked verification status, and messaged my host about dietary preferences. The platform's trust-first approach made the homestay experience feel safe and intentional.",
      },
      {
        heading: "Travel beyond tourism",
        body: "My host's cousins joined for dinner. We talked about music, politics, and travel. I left with recipes, contacts, and a reminder that meaningful travel experiences are always human.",
      },
    ],
    relatedHref: "/destinations/italy/naples",
  },
];

export function getTravelerStory(slug: string): TravelerStory | undefined {
  return TRAVELER_STORIES.find((s) => s.slug === slug);
}
