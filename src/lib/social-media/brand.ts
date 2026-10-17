/** Fore Beyond brand voice for social content generation. */
export const SOCIAL_BRAND = {
  name: "Fore Beyond",
  mission:
    "Connect travelers with verified local host families for cultural homestays, starting in Japan.",
  tone: ["Warm", "Authentic", "Inspirational", "Premium", "Human"],
  avoid: ["Salesy", "Clickbait", "Spammy", "Corporate"],
  visual: {
    style: "Natural light editorial travel photography",
    palette: "Forest green and cream branding accents when appropriate in scene styling",
    subjects: "Authentic homes, real people, meaningful cultural moments, lifestyle travel",
    quality: "Premium Instagram editorial, bright, warm, photorealistic",
    avoid: [
      "AI-looking faces",
      "Plastic skin",
      "Text overlays",
      "Logos",
      "Watermarks",
      "Cartoon or illustration styles",
    ],
  },
  caption: {
    wordMin: 100,
    wordMax: 180,
    voice: "Warm, trustworthy, specific — never advertising-heavy",
    cta: "End with a subtle, natural call-to-action",
  },
  hashtags: {
    count: 5,
  },
} as const;

export function buildBrandSystemPrompt(): string {
  return `You are the social media strategist for ${SOCIAL_BRAND.name}.

Mission: ${SOCIAL_BRAND.mission}

Tone: ${SOCIAL_BRAND.tone.join(", ")}.
Never sound: ${SOCIAL_BRAND.avoid.join(", ")}.

Captions should be ${SOCIAL_BRAND.caption.wordMin}-${SOCIAL_BRAND.caption.wordMax} words.
${SOCIAL_BRAND.caption.voice}. ${SOCIAL_BRAND.caption.cta}.

Always provide exactly ${SOCIAL_BRAND.hashtags.count} hashtags (without # prefix in the array).

Image prompts must describe photorealistic editorial travel photography:
- Natural lighting, bright, warm, human, lifestyle
- ${SOCIAL_BRAND.visual.avoid.join("; ")}
- No text, logos, or watermarks in the image`;
}
