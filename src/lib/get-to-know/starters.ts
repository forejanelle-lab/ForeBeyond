export type ConversationStarterCategory =
  | "Food"
  | "Local Life"
  | "Travel"
  | "Family & Home"
  | "Culture"
  | "Random Questions";

export interface ConversationStarter {
  id: string;
  category: ConversationStarterCategory;
  prompt: string;
  relatedInterests: string[];
}

export const CONVERSATION_STARTERS: ConversationStarter[] = [
  {
    id: "local-dish",
    category: "Food",
    prompt: "What's one local dish you think every visitor should try?",
    relatedInterests: ["cooking", "food", "local-food"],
  },
  {
    id: "cook-together",
    category: "Food",
    prompt: "Is there a meal you enjoy cooking with guests?",
    relatedInterests: ["cooking", "family"],
  },
  {
    id: "typical-sunday",
    category: "Local Life",
    prompt: "What does a typical Sunday look like in your hometown?",
    relatedInterests: ["everyday-life", "family", "slow-travel"],
  },
  {
    id: "tourists-miss",
    category: "Travel",
    prompt: "What's something tourists often miss about your area?",
    relatedInterests: ["hidden-places", "local-discoveries", "culture"],
  },
  {
    id: "special-place",
    category: "Travel",
    prompt: "If you could show a guest one special place near your home, where would you take them?",
    relatedInterests: ["explore", "hidden-places", "countryside", "nature"],
  },
  {
    id: "family-tradition",
    category: "Family & Home",
    prompt: "What's a tradition your family looks forward to every year?",
    relatedInterests: ["traditions", "festivals", "family"],
  },
  {
    id: "welcome-home",
    category: "Family & Home",
    prompt: "What helps a guest feel at home with your family?",
    relatedInterests: ["family", "everyday-life", "independence"],
  },
  {
    id: "local-celebration",
    category: "Culture",
    prompt: "Is there a local celebration or custom you'd love to share with a visitor?",
    relatedInterests: ["festivals", "culture", "traditions"],
  },
  {
    id: "language-moment",
    category: "Culture",
    prompt: "What's a word or phrase from your language that you wish more visitors knew?",
    relatedInterests: ["culture", "people", "friendship"],
  },
  {
    id: "neighborhood-walk",
    category: "Local Life",
    prompt: "Where would you take a guest on a slow walk around your neighborhood?",
    relatedInterests: ["people", "hidden-places", "explore"],
  },
  {
    id: "season-favorite",
    category: "Random Questions",
    prompt: "What's your favorite season at home, and why?",
    relatedInterests: ["everyday-life", "nature", "slow-travel"],
  },
  {
    id: "guest-story",
    category: "Random Questions",
    prompt: "What's a moment with a guest that still makes you smile?",
    relatedInterests: ["friendship", "family", "people"],
  },
];

export const CONVERSATION_STARTER_CATEGORIES: ConversationStarterCategory[] = [
  "Food",
  "Local Life",
  "Travel",
  "Family & Home",
  "Culture",
  "Random Questions",
];

export function startersForInterests(interestIds: string[]) {
  if (interestIds.length === 0) return CONVERSATION_STARTERS;
  const ranked = [...CONVERSATION_STARTERS].sort((a, b) => {
    const aScore = a.relatedInterests.filter((id) => interestIds.includes(id)).length;
    const bScore = b.relatedInterests.filter((id) => interestIds.includes(id)).length;
    return bScore - aScore;
  });
  return ranked;
}

export function nextStarter(currentId: string, list: ConversationStarter[]) {
  const index = list.findIndex((starter) => starter.id === currentId);
  if (index < 0) return list[0] ?? null;
  return list[(index + 1) % list.length] ?? null;
}
