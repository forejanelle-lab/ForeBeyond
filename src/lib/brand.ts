export const brand = {
  name: "Fore Beyond",
  tagline: "Travel deeper. Belong anywhere.",
  secondaryTagline: "Fore the journey. Beyond the destination.",
  mission:
    "Fore Beyond helps travelers go beyond tourism through trusted local families, authentic cultural experiences, and meaningful human connection.",
} as const;

export const colors = {
  forest: "#214E34",
  sage: "#DCE8DD",
  cream: "#F9F7F2",
  white: "#FFFFFF",
  charcoal: "#333333",
  gold: "#D4AF37",
} as const;

export const navigation = {
  main: [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "About", href: "/#mission" },
    { label: "Contact", href: "mailto:contact@forebeyond.com" },
  ],
  auth: [
    { label: "Sign In", href: "/auth/sign-in" },
    { label: "Get Started", href: "/auth/sign-up" },
  ],
} as const;

export const footer = {
  product: [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Search Families", href: "/search" },
    { label: "Trust Center", href: "/trust-center" },
  ],
  company: [
    { label: "About", href: "/#mission" },
    { label: "Verification Center", href: "/verification-center" },
    { label: "Contact", href: "mailto:contact@forebeyond.com" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
    { label: "Community Guidelines", href: "/guidelines" },
  ],
} as const;
