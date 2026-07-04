import { sampleImages } from "@/lib/sample-images";

export type GuideArticle = {
  slug: string;
  title: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
  imageAlt: string;
  intro: string;
  sections: { heading: string; body: string }[];
  relatedDestinations: { label: string; href: string }[];
};

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "cultural-immersion-japan",
    title: "Cultural Immersion in Japan: A Traveler's Guide",
    metaDescription:
      "How to plan cultural immersion travel in Japan — homestays, local hosts, etiquette, and meaningful experiences beyond tourist attractions.",
    heroTitle: "Cultural immersion in Japan",
    heroSubtitle: "A practical guide to homestays, local hosts, and traveling like a local.",
    publishedAt: "2026-01-15",
    updatedAt: "2026-03-01",
    image: sampleImages.japanStreet,
    imageAlt: "Travelers experiencing Japanese street culture and local life",
    intro:
      "Japan offers extraordinary depth for travelers willing to go beyond the highlights. Cultural immersion travel — staying with local hosts, sharing meals, and learning daily customs — creates connections that outlast any itinerary.",
    sections: [
      {
        heading: "Why homestays beat hotels for immersive travel",
        body: "Hotels provide comfort and convenience, but they keep culture at arm's length. A verified homestay places you inside a family's rhythm — morning routines, neighborhood favorites, and conversations that reveal how people actually live. Fore Beyond hosts are verified for trust and reviewed by the community.",
      },
      {
        heading: "Choosing a verified local host",
        body: "Look for complete profiles, verification badges, and reviews from past travelers. Fore Beyond displays trust scores, host motivations, and listing details so you can find a family aligned with your interests — language exchange, food, arts, or simply quiet observation.",
      },
      {
        heading: "Travel like a local with intention",
        body: "Immersive travel experiences work best when you arrive curious and respectful. Learn basic phrases, ask before photographing, and treat your host's home as a gift of hospitality — not a service transaction.",
      },
    ],
    relatedDestinations: [
      { label: "Japan homestays", href: "/destinations/japan" },
      { label: "Tokyo local hosts", href: "/destinations/japan/tokyo" },
      { label: "Kyoto cultural stays", href: "/destinations/japan/kyoto" },
    ],
  },
  {
    slug: "homestay-vs-hotel-immersive-travel",
    title: "Homestays vs Hotels: Choosing Immersive Travel",
    metaDescription:
      "Compare homestay experiences and hotels for cultural immersion travel. Why verified local hosts offer authentic travel experiences hotels cannot.",
    heroTitle: "Homestays vs hotels",
    heroSubtitle: "When immersive travel matters more than room service.",
    publishedAt: "2026-02-01",
    updatedAt: "2026-02-01",
    image: sampleImages.familyKitchen,
    imageAlt: "Family sharing a home-cooked meal together in a welcoming kitchen",
    intro:
      "Not every trip calls for a homestay — but travelers seeking cultural exchange, language practice, and meaningful connection often find hotels limiting. Here is how to choose the right fit.",
    sections: [
      {
        heading: "What hotels do well",
        body: "Hotels excel at predictability: privacy, amenities, and location. For short business trips or travelers who prefer minimal social interaction, they remain the practical choice.",
      },
      {
        heading: "What homestay experiences offer",
        body: "Verified local hosts share daily life — meals, neighborhoods, and customs. Fore Beyond is built for cultural immersion travel, not vacation rentals. Hosts welcome travelers for exchange and connection, with identity verification and community standards.",
      },
      {
        heading: "Trust-first platforms matter",
        body: "Authentic travel experiences require safety infrastructure: ID verification, reviews, messaging gates, and support. Fore Beyond prioritizes trust so both hosts and travelers can connect with confidence.",
      },
    ],
    relatedDestinations: [
      { label: "Browse all destinations", href: "/destinations" },
      { label: "Search verified families", href: "/search" },
    ],
  },
  {
    slug: "travel-like-a-local",
    title: "How to Travel Like a Local Abroad",
    metaDescription:
      "Practical tips for traveling like a local — cultural exchange travel, staying with host families, and finding authentic travel experiences worldwide.",
    heroTitle: "Travel like a local",
    heroSubtitle: "Meaningful travel experiences start with human connection.",
    publishedAt: "2026-02-20",
    updatedAt: "2026-02-20",
    image: sampleImages.heroTravel,
    imageAlt: "Group of travelers connecting with locals in an outdoor setting",
    intro:
      "Travel like a local is not a hashtag — it is a mindset. Slow down, listen more than you plan, and choose experiences that place you beside residents rather than beside other tourists.",
    sections: [
      {
        heading: "Stay with local hosts",
        body: "Homestay experiences anchor you in a community. You learn transit routes, food customs, and unwritten rules from people who live them daily. Fore Beyond connects travelers with verified host families worldwide.",
      },
      {
        heading: "Book local host experiences",
        body: "Beyond your stay, browse cooking classes, market tours, and cultural workshops hosted by verified locals. These immersive travel experiences complement homestays and deepen cultural exchange.",
      },
      {
        heading: "Prioritize cultural exchange over consumption",
        body: "The richest trips leave you with relationships, not just photos. Approach each conversation as an exchange — share your story, ask thoughtful questions, and respect boundaries.",
      },
    ],
    relatedDestinations: [
      { label: "Local experiences", href: "/experiences" },
      { label: "Trust Center", href: "/trust-center" },
    ],
  },
];

export function getGuideArticle(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((g) => g.slug === slug);
}
