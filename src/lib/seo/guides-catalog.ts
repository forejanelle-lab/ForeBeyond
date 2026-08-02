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
  relatedSectionTitle?: string;
};

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "host",
    title: "Host Guide: Welcome Travelers Into Your Home",
    metaDescription:
      "How to become a Fore Beyond host — create your listing, complete verification, set house rules, and welcome travelers for authentic cultural exchange.",
    heroTitle: "Host guide",
    heroSubtitle: "Share your home, culture, and daily life with travelers who want to belong.",
    publishedAt: "2026-08-01",
    updatedAt: "2026-08-01",
    image: sampleImages.homeHostPortrait,
    imageAlt: "Welcoming host ready to share their home and culture",
    intro:
      "Fore Beyond hosts open their homes for cultural exchange — not short-term rentals. This guide walks you through getting started, building trust, and creating a listing that helps the right travelers find you.",
    sections: [
      {
        heading: "Create your account and choose Host",
        body: "Sign up at Fore Beyond and complete your profile. Choose Host when asked how you want to participate. Add a clear photo, location, and a short bio so travelers understand who you are before they request a stay.",
      },
      {
        heading: "Complete verification",
        body: "Verified hosts earn traveler confidence. Upload your government ID, selfie, and address proof in the Verification Center. Our team reviews submissions and your trust score reflects completed checks. Verification protects both hosts and guests.",
      },
      {
        heading: "Build your listing",
        body: "Describe your household, cultural offerings, languages spoken, and what makes your home special. Include photos of the guest space, meal plans, house rules, and commute details. Clear expectations reduce mismatches and help coordinators or travelers choose confidently.",
      },
      {
        heading: "Review stay requests thoughtfully",
        body: "When a traveler requests a stay, read their profile and message before accepting. Ask clarifying questions about dates, dietary needs, and goals for the trip. You can decline requests that are not a good fit — no explanation required.",
      },
      {
        heading: "Welcome guests with clear boundaries",
        body: "Share house rules, meal times, and privacy expectations on day one. Cultural exchange works best when both sides feel respected. After a stay, honest reviews help the community grow safely.",
      },
    ],
    relatedSectionTitle: "Next steps",
    relatedDestinations: [
      { label: "Create your account", href: "/auth/sign-up" },
      { label: "Verification Center", href: "/verification-center" },
      { label: "Create a listing", href: "/host/listings/new" },
      { label: "Community Guidelines", href: "/guidelines" },
    ],
  },
  {
    slug: "traveler",
    title: "Traveler Guide: Stay With Verified Local Hosts",
    metaDescription:
      "How to travel with Fore Beyond — find verified host families, complete verification, request a stay, and experience cultural immersion beyond hotels.",
    heroTitle: "Traveler guide",
    heroSubtitle: "Travel deeper with verified local hosts who welcome you into daily life.",
    publishedAt: "2026-08-01",
    updatedAt: "2026-08-01",
    image: sampleImages.heroTravel,
    imageAlt: "Travelers connecting with a local host family abroad",
    intro:
      "Fore Beyond is built for cultural immersion — staying with local families, sharing meals, and learning how people actually live. This guide covers how to find hosts, prepare for your stay, and travel with respect.",
    sections: [
      {
        heading: "Create your account and complete your profile",
        body: "Sign up and choose Traveler. Add your interests, travel style, dietary preferences, and a bio that helps hosts understand who you are. Complete profiles receive stronger responses when you request a stay.",
      },
      {
        heading: "Get verified before you request a stay",
        body: "Submit government ID and selfie verification in the Verification Center. Verified travelers signal trust to hosts and unlock stay requests. Verification is a core part of how Fore Beyond keeps the community safe.",
      },
      {
        heading: "Search families and read listings carefully",
        body: "Browse verified host families by destination. Read house rules, meal inclusions, pricing, and host motivations. Look for trust scores, reviews, and listing details that match how you want to travel — language exchange, home cooking, or quiet observation.",
      },
      {
        heading: "Send a thoughtful stay request",
        body: "Introduce yourself, explain your dates and goals, and mention any dietary or accessibility needs. Hosts are welcoming you into their home — a personal message shows respect and improves your chances of a good match.",
      },
      {
        heading: "Travel with curiosity and respect",
        body: "Treat your host's home as a gift of hospitality. Ask before photographing, follow house rules, and participate in daily life when invited. After your stay, leave an honest review to help future travelers.",
      },
    ],
    relatedSectionTitle: "Next steps",
    relatedDestinations: [
      { label: "Create your account", href: "/auth/sign-up" },
      { label: "Search host families", href: "/search" },
      { label: "Verification Center", href: "/verification-center" },
      { label: "Trust Center", href: "/trust-center" },
    ],
  },
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
