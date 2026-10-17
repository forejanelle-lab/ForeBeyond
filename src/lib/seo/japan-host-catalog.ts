import { sampleImages } from "@/lib/sample-images";

export type JapanHostPageType = "core" | "city" | "intent" | "partnership";

export type JapanHostFaq = {
  question: string;
  answer: string;
};

export type JapanHostSection = {
  title: string;
  body: string;
};

export type JapanHostRelatedLink = {
  label: string;
  href: string;
};

export type JapanHostCtaKind = "host" | "partnership";

export type JapanHostSeoPage = {
  slug: string;
  type: JapanHostPageType;
  pageTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  sections: JapanHostSection[];
  faq: JapanHostFaq[];
  relatedLinks: JapanHostRelatedLink[];
  ctaKind: JapanHostCtaKind;
  ctaLabel: string;
  image: string;
  imageAlt: string;
  heroStyle?: "image" | "solid";
  cityName?: string;
  earningRange?: string;
  demandSignal?: string;
  studentProfile?: string;
  languageSchoolPresence?: string;
};

export const HOST_APPLY_HREF = "/auth/sign-up?redirect=%2Fonboarding%2Fhost";
export const PARTNERSHIP_CONTACT_HREF = "mailto:info@forebeyond.com?subject=Fore%20Beyond%20Partnership%20Inquiry";

const HOST_CITY_SLUGS = [
  "tokyo",
  "kyoto",
  "osaka",
  "nagoya",
  "fukuoka",
  "yokohama",
  "sapporo",
] as const;

export type JapanHostCitySlug = (typeof HOST_CITY_SLUGS)[number];

function cityPageSlug(city: JapanHostCitySlug): string {
  return `host-family-${city}`;
}

function link(slug: string, label: string): JapanHostRelatedLink {
  return { href: `/${slug}`, label };
}

const SHARED_TRUST_SECTION: JapanHostSection = {
  title: "Trust, safety, and vetting",
  body: "Fore Beyond verifies every host family before they receive placements. Identity checks, reference review, and ongoing support are standard — not optional. Hosts and travelers communicate through the platform until a stay is confirmed, and our team is available if questions arise.",
};

const CITY_DATA: Record<
  JapanHostCitySlug,
  {
    name: string;
    earningRange: string;
    demandSignal: string;
    studentProfile: string;
    languageSchoolPresence: string;
    heroSubtitle: string;
    intro: string;
    sections: JapanHostSection[];
    imageAlt: string;
  }
> = {
  tokyo: {
    name: "Tokyo",
    earningRange: "¥80,000–¥150,000 per month (estimate)",
    demandSignal:
      "High demand from language schools, study-abroad coordinators, and travelers seeking homestays in Greater Tokyo year-round.",
    studentProfile:
      "Most placements are language-school students (18–30), university exchange visitors, and travelers exploring Japanese culture — often staying one to six months.",
    languageSchoolPresence:
      "Shinjuku, Shibuya, Ikebukuro, and Yokohama-adjacent schools regularly partner with homestay networks for weekday commutes and immersion.",
    heroSubtitle:
      "Host international travelers and students in Japan's capital — earn supplemental income while sharing daily life in real neighborhoods.",
    intro:
      "Tokyo schools and travelers need reliable host families near transit hubs. If you have a spare room, stable household routines, and interest in cultural exchange, hosting through Fore Beyond connects you with vetted placements — without navigating contracts alone.",
    sections: [
      {
        title: "Why Tokyo hosts are in demand",
        body: "Intensive Japanese programs and cultural exchange travelers run year-round. Coordinators prioritize hosts who can offer a quiet study environment, predictable mealtimes, and clear house rules — especially for first-time visitors to Japan.",
      },
      {
        title: "Typical hosting arrangement",
        body: "Most Tokyo placements include a private or semi-private room, shared meals several times per week, and basic orientation to local transit. Duration commonly ranges from four weeks to one academic term.",
      },
      SHARED_TRUST_SECTION,
    ],
    imageAlt: "Tokyo residential neighborhood suited for international traveler and student homestays",
  },
  kyoto: {
    name: "Kyoto",
    earningRange: "¥70,000–¥130,000 per month (estimate)",
    demandSignal:
      "Steady demand from Kyoto-based language institutes, cultural immersion programs, and travelers seeking authentic local homestays.",
    studentProfile:
      "Travelers exploring traditional culture, serious language learners, and university exchange participants — many on semester or multi-month stays.",
    languageSchoolPresence:
      "Central Kyoto and stations along the Karasuma and Tozai lines frequently request hosts for travelers and students attending nearby language schools.",
    heroSubtitle:
      "Open your Kyoto home to international travelers and students — earn while sharing everyday Japanese life.",
    intro:
      "Kyoto's education and travel market values hosts who can introduce guests to local customs — seasonal food, neighborhood shrines, and polite household norms. Fore Beyond helps qualified families connect with schools and travelers who need dependable placements.",
    sections: [
      {
        title: "What Kyoto placements look like",
        body: "Coordinators look for hosts within reasonable commute times, clear curfew and guest policies, and willingness to include travelers in ordinary family life — not curated tourist experiences.",
      },
      {
        title: "Cultural exchange at home",
        body: "Guests often want conversation practice at dinner, help reading household notes in Japanese, and guidance on local etiquette. Small daily interactions matter more than elaborate outings.",
      },
      SHARED_TRUST_SECTION,
    ],
    imageAlt: "Kyoto home and cultural setting for traveler and student homestay hosts",
  },
  osaka: {
    name: "Osaka",
    earningRange: "¥65,000–¥120,000 per month (estimate)",
    demandSignal:
      "Growing demand from Osaka language schools, vocational programs, and travelers who prefer Kansai's direct communication style.",
    studentProfile:
      "Mix of language-school students, vocational learners, and culture-focused travelers; many appreciate hosts who are straightforward about house rules and mealtimes.",
    languageSchoolPresence:
      "Namba, Umeda, and Tennoji corridors have clusters of Japanese language programs seeking homestay capacity each intake.",
    heroSubtitle:
      "Host international travelers and students in Osaka — reliable income and meaningful cross-cultural connection.",
    intro:
      "Osaka schools and travelers need host families who offer stability, clear expectations, and a welcoming Kansai home environment. Fore Beyond vets hosts so coordinators can place guests with confidence.",
    sections: [
      {
        title: "Osaka host family advantages",
        body: "Central locations near subway and JR lines are in highest demand. Coordinators prioritize hosts with experience hosting foreigners or strong interest in cross-cultural communication.",
      },
      {
        title: "Income and expectations",
        body: "Compensation varies by room type, meals included, and commute distance. Fore Beyond helps you set transparent terms before you accept a placement.",
      },
      SHARED_TRUST_SECTION,
    ],
    imageAlt: "Osaka urban home environment for international traveler and student hosts",
  },
  nagoya: {
    name: "Nagoya",
    earningRange: "¥60,000–¥110,000 per month (estimate)",
    demandSignal:
      "Consistent demand from Nagoya language schools, vocational exchange programs, and travelers seeking affordable central Japan homestays.",
    studentProfile:
      "Intensive Japanese learners, technical-college exchange participants, and culture-focused travelers — often staying 8–24 weeks.",
    languageSchoolPresence:
      "Sakae, Kanayama, and Nagoya Station areas regularly source homestay hosts for commuter-friendly placements.",
    heroSubtitle:
      "Become a host family in Nagoya — support international travelers and students while earning supplemental household income.",
    intro:
      "Nagoya offers a strong middle market for homestays: lower living costs than Tokyo with steady demand from schools and travelers. Hosts with spare rooms near major lines are especially valued.",
    sections: [
      {
        title: "Why homestays work well in Nagoya",
        body: "Coordinators want hosts who provide structure — study hours, laundry guidance, and clear communication about transit to campus or city centers.",
      },
      {
        title: "Family fit matters",
        body: "You do not need perfect English. Patient communication, respect for study or travel time, and basic safety awareness are what coordinators evaluate first.",
      },
      SHARED_TRUST_SECTION,
    ],
    imageAlt: "Nagoya residential area for homestay host families",
  },
  fukuoka: {
    name: "Fukuoka",
    earningRange: "¥55,000–¥100,000 per month (estimate)",
    demandSignal:
      "High demand relative to supply — Fukuoka schools and travelers often seek new host families each intake.",
    studentProfile:
      "Asian and European language learners, university exchange visitors, and travelers drawn to Fukuoka's livability and lower cost compared to Tokyo.",
    languageSchoolPresence:
      "Tenjin and Hakata districts anchor much of the language-school homestay demand in Kyushu.",
    heroSubtitle:
      "Host international travelers and students in Fukuoka — schools and coordinators need trusted local families.",
    intro:
      "Fukuoka's growing international education and travel sector needs vetted host households. If you can offer a safe room and inclusive daily routines, Fore Beyond helps you connect with placement coordinators and travelers.",
    sections: [
      {
        title: "Fukuoka placement patterns",
        body: "Homestays often include breakfast or several shared dinners weekly. Coordinators appreciate hosts who introduce travelers to local shops, transit cards, and emergency contacts on day one.",
      },
      {
        title: "Community impact",
        body: "Hosting supports local language economies and gives families a structured way to welcome international travelers and students without running a business.",
      },
      SHARED_TRUST_SECTION,
    ],
    imageAlt: "Fukuoka city home suited for hosting travelers and language students",
  },
  yokohama: {
    name: "Yokohama",
    earningRange: "¥75,000–¥135,000 per month (estimate)",
    demandSignal:
      "Strong demand from Yokohama and southwest Tokyo-adjacent schools and travelers placing guests across Kanagawa.",
    studentProfile:
      "Mix of language-school students, university pathway learners, and culture-focused travelers; many commute to Tokyo campuses while living in Yokohama.",
    languageSchoolPresence:
      "Yokohama Station, Kannai, and Shin-Yokohama corridors feed steady homestay requests from partner institutions.",
    heroSubtitle:
      "Yokohama host families — earn income hosting international travelers and students near Tokyo's education hub.",
    intro:
      "Yokohama hosts benefit from Tokyo-adjacent demand with more spacious housing options. Fore Beyond connects qualified families with schools and travelers seeking dependable Kanagawa placements.",
    sections: [
      {
        title: "Why Yokohama works for hosts",
        body: "Families with room near major rail lines can serve Yokohama-based and Tokyo-commuting travelers and students — increasing placement flexibility.",
      },
      {
        title: "Setting clear expectations",
        body: "Coordinators expect written house rules, meal inclusion details, and guest policies before matching. Fore Beyond guides you through listing these clearly.",
      },
      SHARED_TRUST_SECTION,
    ],
    imageAlt: "Yokohama neighborhood home for international traveler and student homestays",
  },
  sapporo: {
    name: "Sapporo",
    earningRange: "¥50,000–¥95,000 per month (estimate)",
    demandSignal:
      "Seasonal and year-round demand from Hokkaido language programs, winter intake students, and travelers exploring northern Japan.",
    studentProfile:
      "Language learners, culture-focused travelers, and exchange participants studying Japanese while experiencing Hokkaido's seasons; winter hosts who explain heating and snow safety are especially appreciated.",
    languageSchoolPresence:
      "Susukino and Sapporo Station areas anchor homestay placement requests for Hokkaido language institutes.",
    heroSubtitle:
      "Host international travelers and students in Sapporo — help guests experience Hokkaido life safely.",
    intro:
      "Sapporo schools and travelers need hosts who prepare guests for seasonal living — transit in snow, indoor heating norms, and local shopping routines. Fore Beyond supports families through vetting and placement.",
    sections: [
      {
        title: "Hokkaido-specific hosting",
        body: "Clear guidance on winter outerwear, entryway etiquette, and bus schedules helps travelers adjust faster — coordinators notice hosts who plan for this.",
      },
      {
        title: "Steady supplemental income",
        body: "While estimates vary, Sapporo homestays can provide reliable monthly compensation during active study terms, especially for hosts near central lines.",
      },
      SHARED_TRUST_SECTION,
    ],
    imageAlt: "Sapporo residential setting for homestay host families",
  },
};

function buildCityPages(): JapanHostSeoPage[] {
  return HOST_CITY_SLUGS.map((citySlug) => {
    const data = CITY_DATA[citySlug];
    const slug = cityPageSlug(citySlug);
    return {
      slug,
      type: "city",
      pageTitle: `Host Family in ${data.name}, Japan — Earn Hosting Travelers`,
      metaDescription: `Become a host family in ${data.name}, Japan. ${data.demandSignal} Estimated earnings ${data.earningRange}. Apply through Fore Beyond.`,
      heroTitle: `Host international travelers in ${data.name}`,
      heroSubtitle: data.heroSubtitle,
      intro: data.intro,
      sections: data.sections,
      faq: [
        {
          question: `How much can host families earn in ${data.name}?`,
          answer: `Estimates for ${data.name} typically fall in the range of ${data.earningRange}. Actual compensation depends on room type, meals included, placement length, and school partner terms — figures are not guaranteed.`,
        },
        {
          question: `Who will I host in ${data.name}?`,
          answer: data.studentProfile,
        },
        {
          question: "Is Fore Beyond only for tourists?",
          answer:
            "No. Fore Beyond prioritizes structured cultural exchange — language-school students, study-abroad partners, and travelers exploring Japanese culture — not anonymous short-term vacation rentals.",
        },
      ],
      relatedLinks: [
        link("become-a-host-japan", "Become a host in Japan"),
        link("how-to-become-a-host-family-in-japan", "How to become a host family"),
        link("homestay-host-requirements-japan", "Host requirements in Japan"),
        link("how-much-do-host-families-earn-japan", "Host family earnings in Japan"),
        ...(citySlug !== "tokyo" ? [link("host-family-tokyo", "Host family Tokyo")] : []),
      ],
      ctaKind: "host",
      ctaLabel: "Apply to Become a Host",
      image: sampleImages.japanStreet,
      imageAlt: data.imageAlt,
      cityName: data.name,
      earningRange: data.earningRange,
      demandSignal: data.demandSignal,
      studentProfile: data.studentProfile,
      languageSchoolPresence: data.languageSchoolPresence,
    };
  });
}

const CORE_PAGE: JapanHostSeoPage = {
  slug: "become-a-host-japan",
  type: "core",
  pageTitle: "Become a Host Family in Japan — Earn Hosting International Travelers",
  metaDescription:
    "Apply to become a verified host family in Japan. Earn supplemental income hosting international travelers and students with Fore Beyond's vetting, safety standards, and placement partners.",
  heroTitle: "Become a host family in Japan",
  heroSubtitle:
    "Earn supplemental income hosting international travelers and students — with vetting, support, and placements handled through Fore Beyond.",
  intro:
    "Language schools, study-abroad coordinators, and travelers across Japan need trusted host families — not informal listings. Fore Beyond connects qualified households with vetted placements, identity verification, and ongoing support so you can focus on welcoming a guest into daily life.",
  sections: [
    {
      title: "Why host through Fore Beyond",
      body: "You set your availability, house rules, and meal preferences. We handle verification, partner introductions, and platform communication until a placement is confirmed. Hosting becomes structured cultural exchange — not an unstructured side gig.",
    },
    {
      title: "Who you will host",
      body: "Placements may include international language students, university exchange participants, and travelers seeking to explore Japanese culture through a local home. These are structured cultural exchange stays — not anonymous short-term rentals.",
    },
    {
      title: "Estimated earnings",
      body: "Host families in major Japanese cities often receive roughly ¥55,000–¥150,000 per month depending on city, room type, and meals included. Amounts vary by school partner and placement — earnings are estimates, not guarantees.",
    },
    SHARED_TRUST_SECTION,
    {
      title: "How to get started",
      body: "Create a Fore Beyond account, complete host onboarding, pass verification, and publish your household profile. Once approved, coordinators can match you with travelers and students whose schedules and expectations align with your home.",
    },
  ],
  faq: [
    {
      question: "Do I need to speak fluent English?",
      answer:
        "No. Many successful hosts communicate patiently in Japanese with beginner-level English or translation tools. Coordinators value clarity, kindness, and stable household routines over perfect bilingualism.",
    },
    {
      question: "What safety steps does Fore Beyond take?",
      answer:
        "Hosts complete identity verification and profile review before receiving placement inquiries. Communication stays on-platform until a stay is confirmed, and our team supports both hosts and coordinators if issues arise.",
    },
    {
      question: "Can I host if I work full time?",
      answer:
        "Yes, many hosts work daytime jobs. Coordinators look for hosts who can provide a safe room, predictable routines, and reasonable responsiveness — not 24/7 supervision.",
    },
    {
      question: "Is hosting the same as Airbnb?",
      answer:
        "No. Fore Beyond focuses on structured cultural exchange with partner programs — background expectations, study- or travel-friendly environments, and longer-term homestays rather than nightly tourism.",
    },
  ],
  relatedLinks: [
    link("host-family-tokyo", "Host family Tokyo"),
    link("host-family-osaka", "Host family Osaka"),
    link("how-to-become-a-host-family-in-japan", "How to become a host family"),
    link("partner-language-schools-japan", "Partner with language schools"),
    link("homestay-host-requirements-japan", "Host requirements"),
  ],
  ctaKind: "host",
  ctaLabel: "Apply to Become a Host",
  heroStyle: "solid",
  image: sampleImages.homeHostPortrait,
  imageAlt: "Welcoming Japanese host family ready to host international travelers",
};

const INTENT_PAGES: JapanHostSeoPage[] = [
  {
    slug: "how-to-become-a-host-family-in-japan",
    type: "intent",
    pageTitle: "How to Become a Host Family in Japan",
    metaDescription:
      "Step-by-step guide to becoming a homestay host family in Japan — requirements, vetting, school placements, and how Fore Beyond supports new hosts.",
    heroTitle: "How to become a host family in Japan",
    heroSubtitle:
      "A practical path from application to your first traveler or student placement — with vetting and coordinator support built in.",
    intro:
      "Becoming a host family in Japan is less about having a perfect bilingual household and more about offering a safe room, respectful daily routines, and genuine interest in cultural exchange. Fore Beyond structures the process so schools and travelers can trust your profile before a placement is confirmed.",
    sections: [
      {
        title: "Step 1 — Confirm your household fit",
        body: "You need a spare room (private or semi-private), stable housing, and household members aligned on hosting. Coordinators prefer clear rules about meals, curfew, guests, and study hours before matching.",
      },
      {
        title: "Step 2 — Apply and complete verification",
        body: "Register on Fore Beyond, complete host onboarding, and pass identity verification. This protects travelers, partner programs, and your household before any placement proceeds.",
      },
      {
        title: "Step 3 — Publish an accurate host profile",
        body: "Describe your neighborhood transit access, meal inclusion, languages spoken, and typical daily schedule. Accurate profiles reduce mismatches and help coordinators place the right traveler or student.",
      },
      {
        title: "Step 4 — Review placement requests carefully",
        body: "Partner programs share guest program length, commute needs, and expectations. Accept placements that fit your capacity — hosting works best when both sides understand house rules upfront.",
      },
    ],
    faq: [
      {
        question: "Do I need special licensing to host in Japan?",
        answer:
          "Requirements vary by municipality and placement type. Fore Beyond guides approved hosts through program expectations; coordinators clarify contractual terms before a stay begins.",
      },
      {
        question: "Can retirees or single adults host?",
        answer:
          "Yes, if you meet safety and housing standards and can provide a stable environment. Coordinators evaluate suitability case by case — age alone is not a barrier.",
      },
      {
        question: "What if the guest and my family are not a good fit?",
        answer:
          "Clear onboarding and written house rules prevent many issues. Fore Beyond and partner coordinators support structured communication if adjustments are needed during a placement.",
      },
    ],
    relatedLinks: [
      link("become-a-host-japan", "Become a host in Japan"),
      link("homestay-host-requirements-japan", "Host requirements"),
      link("is-hosting-international-students-safe-japan", "Is hosting safe?"),
      link("host-family-tokyo", "Host family Tokyo"),
    ],
    ctaKind: "host",
    ctaLabel: "Start Your Host Application",
    heroStyle: "solid",
    image: sampleImages.familyKitchen,
    imageAlt: "Japanese home kitchen where host families share meals with travelers",
  },
  {
    slug: "earn-money-hosting-international-students-japan",
    type: "intent",
    pageTitle: "Earn Money Hosting International Travelers in Japan",
    metaDescription:
      "Learn how host families in Japan earn supplemental income hosting travelers and language students — typical ranges, what affects pay, and how Fore Beyond placements work.",
    heroTitle: "Earn money hosting international travelers in Japan",
    heroSubtitle:
      "Supplemental household income through structured homestay placements — for travelers and students, not short-term tourism.",
    intro:
      "Host family compensation in Japan reflects city, room type, meals, and program length. Fore Beyond connects verified households with language schools and travelers seeking reliable homestay capacity — especially in Tokyo, Osaka, Yokohama, and Fukuoka where demand exceeds supply.",
    sections: [
      {
        title: "Typical monthly ranges (estimates)",
        body: "Major cities often see roughly ¥55,000–¥150,000 per month for active placements. Tokyo and Yokohama tend toward the upper range; regional cities may differ. These are estimates — not guaranteed offers.",
      },
      {
        title: "What increases host compensation",
        body: "Private rooms, included meals, short commutes to school, and availability during peak intakes (April and October) often command higher rates. Transparent profiles help coordinators match appropriate compensation.",
      },
      {
        title: "What hosting income is not",
        body: "Hosting through Fore Beyond is not unregulated short-term rental income. Placements are structured cultural exchange with expectations around guest welfare, study or travel time, and communication with coordinators.",
      },
    ],
    faq: [
      {
        question: "Is hosting income taxable in Japan?",
        answer:
          "Tax treatment depends on your situation and placement structure. Many hosts consult a tax professional once they receive regular placement income.",
      },
      {
        question: "Do all hosts earn the same amount?",
        answer:
          "No. Room quality, meal plan, location, and partner terms all affect compensation. Fore Beyond helps you document your offering clearly so coordinators can price appropriately.",
      },
      {
        question: "How quickly can I receive my first placement?",
        answer:
          "After verification, timing depends on city demand and your profile fit. High-demand cities like Tokyo and Fukuoka often match faster when hosts offer weekday-friendly commutes.",
      },
    ],
    relatedLinks: [
      link("how-much-do-host-families-earn-japan", "How much do host families earn?"),
      link("become-a-host-japan", "Become a host in Japan"),
      link("host-family-tokyo", "Host family Tokyo"),
      link("host-family-fukuoka", "Host family Fukuoka"),
    ],
    ctaKind: "host",
    ctaLabel: "Apply to Become a Host",
    image: sampleImages.japanStreet,
    imageAlt: "Host family earning supplemental income hosting travelers in Japan",
  },
  {
    slug: "is-hosting-international-students-safe-japan",
    type: "intent",
    pageTitle: "Is Hosting International Travelers Safe in Japan?",
    metaDescription:
      "Safety considerations for host families in Japan — vetting, verification, coordinator oversight, and how Fore Beyond reduces risk for households hosting travelers and students.",
    heroTitle: "Is hosting international travelers safe in Japan?",
    heroSubtitle:
      "Structured placements with verification, coordinator oversight, and clear house rules — not anonymous short-term guests.",
    intro:
      "Safety is the first question thoughtful families ask — and the reason Fore Beyond exists for structured homestay placements rather than informal listings. Schools, hosts, travelers, and students all benefit when identity, expectations, and communication are handled before arrival.",
    sections: [
      {
        title: "Verification before placement",
        body: "Hosts complete identity verification and profile review. Travelers arrive through school or coordinator programs with defined contacts — not as unknown short-term renters.",
      },
      {
        title: "Written house rules reduce conflict",
        body: "Curfew, guests, kitchen use, laundry, and quiet hours should be documented before a traveler moves in. Fore Beyond encourages explicit rules so misunderstandings are rare.",
      },
      {
        title: "Platform communication until confirmed",
        body: "Initial coordination flows through Fore Beyond so both parties understand placement terms before sharing private contact details.",
      },
      {
        title: "When concerns arise",
        body: "Partner coordinators and Fore Beyond support channels exist for non-emergency placement issues. For emergencies, hosts and travelers should follow local emergency services and school protocols first.",
      },
    ],
    faq: [
      {
        question: "Are travelers background-checked?",
        answer:
          "Travelers arrive through institutional programs with coordinator oversight. Requirements vary by school partner; Fore Beyond focuses on verified hosts and structured placement terms.",
      },
      {
        question: "Should I host if I have children?",
        answer:
          "Many families with children host successfully. Schools assess household composition during matching — transparency about ages and routines helps place compatible travelers.",
      },
      {
        question: "Can I decline a placement request?",
        answer:
          "Yes. Hosting works best when you accept placements that fit your household. There is no obligation to accept every inquiry.",
      },
    ],
    relatedLinks: [
      link("homestay-host-requirements-japan", "Host requirements"),
      link("how-to-become-a-host-family-in-japan", "How to become a host"),
      link("become-a-host-japan", "Become a host in Japan"),
      link("partner-language-schools-japan", "School partnerships"),
    ],
    ctaKind: "host",
    ctaLabel: "Apply with Confidence",
    image: sampleImages.trustCenter,
    imageAlt: "Trust and safety for host families hosting international travelers",
  },
  {
    slug: "homestay-host-requirements-japan",
    type: "intent",
    pageTitle: "Homestay Host Requirements in Japan",
    metaDescription:
      "Requirements to become a homestay host family in Japan — housing, verification, household standards, and what coordinators expect from hosts.",
    heroTitle: "Homestay host requirements in Japan",
    heroSubtitle:
      "What coordinators and travelers evaluate before approving a host family profile.",
    intro:
      "Language schools and travelers prioritize predictable, safe households over luxury amenities. Fore Beyond aligns host onboarding with what placement coordinators actually review before sending guests to your home.",
    sections: [
      {
        title: "Housing requirements",
        body: "A clean spare room with study space and secure locks. Shared or private bathroom arrangements should be stated clearly.",
      },
      {
        title: "Household standards",
        body: "Stable residence, adult accountability in the home, smoke-free preferences if required, and agreement among household members to host. Coordinators may ask about pets, allergies, and meal inclusion.",
      },
      {
        title: "Verification requirements",
        body: "This protects travelers and legitimizes your profile with institutional partners.",
      },
      {
        title: "Communication expectations",
        body: "Hosts should respond to coordinator messages within a reasonable window, provide accurate availability dates, and update profiles when capacity changes.",
      },
    ],
    faq: [
      {
        question: "Must I provide meals?",
        answer:
          "Many placements include breakfast or several dinners weekly, but terms vary. Document what you offer; coordinators match travelers and students accordingly.",
      },
      {
        question: "Can apartment renters host?",
        answer:
          "Often yes, if your lease allows subtenants or guests for the placement period. Confirm building rules before publishing your profile.",
      },
    ],
    relatedLinks: [
      link("how-to-become-a-host-family-in-japan", "How to become a host"),
      link("become-a-host-japan", "Become a host in Japan"),
      link("is-hosting-international-students-safe-japan", "Hosting safety"),
      link("host-family-osaka", "Host family Osaka"),
    ],
    ctaKind: "host",
    ctaLabel: "Check Your Eligibility — Apply",
    heroStyle: "solid",
    image: sampleImages.heroFamily,
    imageAlt: "Japanese host family home meeting homestay requirements",
  },
  {
    slug: "how-much-do-host-families-earn-japan",
    type: "intent",
    pageTitle: "How Much Do Host Families Earn in Japan?",
    metaDescription:
      "Host family earnings in Japan by city — estimated monthly ranges for homestay placements with travelers and students, what affects pay, and how Fore Beyond partnerships work.",
    heroTitle: "How much do host families earn in Japan?",
    heroSubtitle:
      "City-by-city estimates for homestay placements with travelers and students — transparent ranges, not guaranteed rates.",
    intro:
      "Earnings depend on city, room type, meals, and partner terms. Below are typical monthly estimate ranges Fore Beyond hosts see in active Japanese markets when hosting travelers or students. Individual offers vary and nothing here is a guarantee of income.",
    sections: [
      {
        title: "Estimated ranges by city",
        body: "Tokyo / Yokohama: roughly ¥75,000–¥150,000 · Osaka / Kyoto: roughly ¥65,000–¥130,000 · Nagoya: roughly ¥60,000–¥110,000 · Fukuoka / Sapporo: roughly ¥50,000–¥100,000 per month during active placements.",
      },
      {
        title: "Variables that change compensation",
        body: "Private room vs shared space, number of meals, utilities included, peak intake season, and commute distance all shift offers. Hosts who document details clearly receive better-matched inquiries.",
      },
      {
        title: "Structured placements vs short-term rental",
        body: "Coordinator-managed homestays include guest welfare expectations and oversight. Compensation reflects ongoing household participation — not nightly tourism pricing.",
      },
    ],
    faq: [
      {
        question: "Are payments monthly?",
        answer:
          "Payment schedules depend on partner contracts. Many programs use monthly homestay fees to hosts during active placement periods.",
      },
      {
        question: "Can I host multiple travelers?",
        answer:
          "Some households host more than one guest if space and demand allow. Each placement should meet room and supervision standards defined with coordinators.",
      },
      {
        question: "What if my room is empty between placements?",
        answer:
          "Gap periods happen between intakes. Updating availability on Fore Beyond helps coordinators fill your calendar during peak seasons.",
      },
    ],
    relatedLinks: [
      link("earn-money-hosting-international-students-japan", "Earn money hosting travelers"),
      link("host-family-tokyo", "Host family Tokyo"),
      link("host-family-kyoto", "Host family Kyoto"),
      link("become-a-host-japan", "Become a host in Japan"),
    ],
    ctaKind: "host",
    ctaLabel: "Apply to Become a Host",
    image: sampleImages.japanStreet,
    imageAlt: "Host family supplemental income estimates in Japanese cities",
  },
];

const PARTNERSHIP_PAGES: JapanHostSeoPage[] = [
  {
    slug: "partner-language-schools-japan",
    type: "partnership",
    pageTitle: "Homestay Partner for Language Schools in Japan",
    metaDescription:
      "Fore Beyond partners with Japanese language schools for reliable homestay placement — vetted host networks, student experience quality, and coordinator support.",
    heroTitle: "Partner with Fore Beyond — language schools in Japan",
    heroSubtitle:
      "Reliable homestay capacity, vetted host families, and placement quality your coordinators can stand behind.",
    intro:
      "Language school administrators need homestay partners who treat placement quality as seriously as enrollment. Fore Beyond supplies a verified host network, structured host profiles, and communication tools aligned with coordinator workflows — reducing last-minute housing gaps each intake.",
    sections: [
      {
        title: "Placement reliability",
        body: "Access hosts who complete verification and document commute times, meal plans, and house rules before matching. Reduce intake-week scrambling with a searchable host network by city.",
      },
      {
        title: "Vetted host network",
        body: "Identity verification and profile standards give coordinators confidence when placing international students — especially first-time arrivals who need structured onboarding at home.",
      },
      {
        title: "Student experience quality",
        body: "Homestays succeed when expectations are explicit. Fore Beyond profiles emphasize study-friendly environments, cultural exchange, and household accountability — not generic vacation rentals.",
      },
      {
        title: "Coordinator workflow support",
        body: "Centralized communication and documented placement terms help your team track availability, confirm matches, and escalate issues with platform support when needed.",
      },
    ],
    faq: [
      {
        question: "Which cities does Fore Beyond cover in Japan?",
        answer:
          "We are building host capacity across Tokyo, Yokohama, Osaka, Kyoto, Nagoya, Fukuoka, Sapporo, and expanding based on school partner demand.",
      },
      {
        question: "How are hosts vetted?",
        answer:
          "Hosts complete identity verification and profile review before appearing in placement matching. Schools receive transparent household details before confirming a match.",
      },
      {
        question: "Can we pilot with one intake?",
        answer:
          "Yes. Many institutions begin with a single city or intake cohort before scaling homestay volume across programs.",
      },
    ],
    relatedLinks: [
      link("homestay-programs-for-language-schools", "Homestay programs for schools"),
      link("study-abroad-accommodation-partners-japan", "Study abroad accommodation partners"),
      link("become-a-host-japan", "Host families in Japan"),
      link("host-family-tokyo", "Tokyo host network"),
    ],
    ctaKind: "partnership",
    ctaLabel: "Contact Partnership Team",
    heroStyle: "solid",
    image: sampleImages.trustCenter,
    imageAlt: "Fore Beyond partnership with Japanese language schools",
  },
  {
    slug: "homestay-programs-for-language-schools",
    type: "partnership",
    pageTitle: "Homestay Programs for Language Schools — Fore Beyond",
    metaDescription:
      "Structured homestay programs for Japanese language schools — vetted hosts, placement reliability, and student cultural immersion at scale.",
    heroTitle: "Homestay programs built for language schools",
    heroSubtitle:
      "Scale homestay placements without sacrificing vetting, student safety, or coordinator visibility.",
    intro:
      "Running homestay programs in-house consumes coordinator hours — host recruiting, verification, mismatch resolution, and intake surge management. Fore Beyond provides infrastructure so your team focuses on student success while we maintain host network quality.",
    sections: [
      {
        title: "Program design support",
        body: "Align homestay tiers with your curriculum calendar — short intensives, semester exchange, or rolling admissions — with host availability tracked by city and intake.",
      },
      {
        title: "Quality assurance",
        body: "Standardized host profiles, verification, and documented house rules give your staff a consistent baseline before every placement.",
      },
      {
        title: "Cultural immersion outcomes",
        body: "Students in vetted homestays report stronger conversation practice and daily routine immersion — outcomes language schools market with integrity when placements are structured.",
      },
    ],
    faq: [
      {
        question: "Do you replace our homestay coordinator?",
        answer:
          "No. Fore Beyond supports your coordinators with host supply and platform tools — institutional relationships and student advising remain with your school.",
      },
    ],
    relatedLinks: [
      link("partner-language-schools-japan", "Language school partnerships"),
      link("study-abroad-accommodation-partners-japan", "Study abroad partners"),
      link("homestay-host-requirements-japan", "Host requirements"),
    ],
    ctaKind: "partnership",
    ctaLabel: "Contact Partnership Team",
    image: sampleImages.japanStreet,
    imageAlt: "Homestay program infrastructure for Japanese language schools",
  },
  {
    slug: "study-abroad-accommodation-partners-japan",
    type: "partnership",
    pageTitle: "Study Abroad Accommodation Partners in Japan",
    metaDescription:
      "Fore Beyond partners with study abroad offices and housing coordinators in Japan for vetted homestay networks and reliable student accommodation placements.",
    heroTitle: "Study abroad accommodation partners in Japan",
    heroSubtitle:
      "Homestay capacity for international offices, pathway programs, and exchange coordinators.",
    intro:
      "Study abroad teams need housing partners who understand F-1/J-style program accountability adapted to Japan's language-school and university exchange ecosystem. Fore Beyond connects international educators with vetted host families and transparent placement workflows.",
    sections: [
      {
        title: "For international education offices",
        body: "Offer homestay options alongside dormitory and apartment sourcing — with verification standards your office can document for risk review and partner audits.",
      },
      {
        title: "For pathway and exchange providers",
        body: "Place cohort students across Tokyo, Kansai, and regional hubs with host profiles that specify commute, meals, and household composition before arrival.",
      },
      {
        title: "Outcome-focused housing",
        body: "Homestays support language acquisition and cultural competency goals better than isolated apartment stays when hosts are vetted and expectations are clear.",
      },
    ],
    faq: [
      {
        question: "Do you work with university exchange offices?",
        answer:
          "Yes. We partner with language schools, pathway providers, and study abroad coordinators placing students in Japan across multiple intake models.",
      },
      {
        question: "How do we start a partnership conversation?",
        answer:
          "Email info@forebeyond.com with your cities, annual student volume, and intake calendar. Our partnership team will outline a pilot structure matched to your housing needs.",
      },
    ],
    relatedLinks: [
      link("partner-language-schools-japan", "Language school partners"),
      link("homestay-programs-for-language-schools", "Homestay programs"),
      link("become-a-host-japan", "Host families"),
    ],
    ctaKind: "partnership",
    ctaLabel: "Contact Partnership Team",
    heroStyle: "solid",
    image: sampleImages.heroTravel,
    imageAlt: "Study abroad accommodation partnership in Japan",
  },
];

export const JAPAN_HOST_SEO_PAGES: JapanHostSeoPage[] = [
  CORE_PAGE,
  ...buildCityPages(),
  ...INTENT_PAGES,
  ...PARTNERSHIP_PAGES,
];

const PAGE_BY_SLUG = new Map(JAPAN_HOST_SEO_PAGES.map((page) => [page.slug, page]));

export function getJapanHostSeoPage(slug: string): JapanHostSeoPage | undefined {
  return PAGE_BY_SLUG.get(slug);
}

export function getAllJapanHostSeoSlugs(): string[] {
  return JAPAN_HOST_SEO_PAGES.map((page) => page.slug);
}

export function getJapanHostCityPages(): JapanHostSeoPage[] {
  return JAPAN_HOST_SEO_PAGES.filter((page) => page.type === "city");
}

export function getJapanHostPartnershipPages(): JapanHostSeoPage[] {
  return JAPAN_HOST_SEO_PAGES.filter((page) => page.type === "partnership");
}

export function getJapanHostIntentPages(): JapanHostSeoPage[] {
  return JAPAN_HOST_SEO_PAGES.filter((page) => page.type === "intent");
}

export function getJapanHostCtaHref(page: JapanHostSeoPage): string {
  return page.ctaKind === "partnership" ? PARTNERSHIP_CONTACT_HREF : HOST_APPLY_HREF;
}
