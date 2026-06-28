export const DEMO_PASSWORD = "ForeBeyond123!";

export const DEMO_HOST = {
  email: "maria@forebeyond.demo",
  password: DEMO_PASSWORD,
  label: "Host — Maria Tanaka",
  shortLabel: "Demo host",
};

export const DEMO_TRAVELER = {
  email: "alex@forebeyond.demo",
  password: DEMO_PASSWORD,
  label: "Traveler — Alex Rivera",
  shortLabel: "Demo traveler",
};

/** Legacy demo emails from older seeds/docs → current accounts. */
const LEGACY_DEMO_EMAIL_ALIASES: Record<string, string> = {
  "traveler@forebeyond.demo": DEMO_TRAVELER.email,
  "demo@forebeyond.demo": DEMO_HOST.email,
  "host@forebeyond.demo": DEMO_HOST.email,
};

export function normalizeLoginEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return LEGACY_DEMO_EMAIL_ALIASES[normalized] ?? normalized;
}
