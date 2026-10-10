export type GetToKnowInterestId =
  | "cooking"
  | "food"
  | "countryside"
  | "nature"
  | "local-food"
  | "history"
  | "people"
  | "family"
  | "traditions"
  | "explore"
  | "independence"
  | "festivals"
  | "everyday-life"
  | "hidden-places"
  | "culture"
  | "friendship"
  | "slow-travel"
  | "local-discoveries";

export interface GetToKnowOption {
  id: string;
  label: string;
  icon: string;
  interest: { id: GetToKnowInterestId; label: string };
  keywords: string[];
}

export interface GetToKnowQuestion {
  id: string;
  category: string;
  prompt: string;
  options: GetToKnowOption[];
}

export const GET_TO_KNOW_QUESTIONS: GetToKnowQuestion[] = [
  {
    id: "food",
    category: "Food",
    prompt: "You're making dinner together. What are you bringing to the table?",
    options: [
      {
        id: "help-cook",
        label: "I'll help cook.",
        icon: "ChefHat",
        interest: { id: "cooking", label: "Cooking and food" },
        keywords: ["cook", "cooking", "kitchen", "meal", "cuisine"],
      },
      {
        id: "bring-dish",
        label: "I'll bring a favorite dish from home.",
        icon: "UtensilsCrossed",
        interest: { id: "food", label: "Sharing food from home" },
        keywords: ["cook", "meal", "food", "cuisine", "recipe", "dish"],
      },
      {
        id: "try-whatever",
        label: "I'll happily try whatever you make.",
        icon: "Soup",
        interest: { id: "food", label: "Home cooking" },
        keywords: ["meal", "dinner", "home-cooked", "cooking", "food"],
      },
      {
        id: "surprise-me",
        label: "I'm adventurous — surprise me!",
        icon: "Sparkles",
        interest: { id: "local-food", label: "Local food" },
        keywords: ["market", "food", "cuisine", "local dish", "street food"],
      },
    ],
  },
  {
    id: "local-life",
    category: "Local Life",
    prompt: "What's your ideal day in a new destination?",
    options: [
      {
        id: "countryside",
        label: "Exploring the countryside.",
        icon: "Trees",
        interest: { id: "countryside", label: "Countryside and nature" },
        keywords: ["countryside", "nature", "garden", "farm", "hike", "outdoors", "walk"],
      },
      {
        id: "food-spots",
        label: "Discovering local food spots.",
        icon: "MapPin",
        interest: { id: "local-food", label: "Local food spots" },
        keywords: ["market", "food", "restaurant", "cafe", "cuisine", "neighborhood"],
      },
      {
        id: "museums",
        label: "Visiting museums and historical places.",
        icon: "Landmark",
        interest: { id: "history", label: "History and heritage" },
        keywords: ["history", "heritage", "museum", "tradition", "historic", "culture"],
      },
      {
        id: "local-people",
        label: "Spending time with local people.",
        icon: "Users",
        interest: { id: "people", label: "Time with local people" },
        keywords: ["family", "community", "neighbor", "people", "conversation", "language"],
      },
    ],
  },
  {
    id: "family-home",
    category: "Family & Home",
    prompt: "What would make you feel most welcome in someone's home?",
    options: [
      {
        id: "meals-talk",
        label: "Sharing meals and conversations.",
        icon: "MessageCircle",
        interest: { id: "family", label: "Shared meals and conversation" },
        keywords: ["meal", "dinner", "conversation", "family", "table", "talk"],
      },
      {
        id: "traditions",
        label: "Learning family traditions.",
        icon: "Heart",
        interest: { id: "traditions", label: "Family traditions" },
        keywords: ["tradition", "custom", "ceremony", "festival", "family", "culture"],
      },
      {
        id: "explore-together",
        label: "Having opportunities to explore together.",
        icon: "Compass",
        interest: { id: "explore", label: "Exploring together" },
        keywords: ["walk", "tour", "explore", "neighborhood", "outing", "together"],
      },
      {
        id: "independence",
        label: "Having a comfortable space and some independence.",
        icon: "Home",
        interest: { id: "independence", label: "A comfortable, independent stay" },
        keywords: ["private room", "quiet", "workspace", "independent", "privacy"],
      },
    ],
  },
  {
    id: "culture",
    category: "Culture",
    prompt: "If your host could introduce you to one local tradition, what would you choose?",
    options: [
      {
        id: "traditional-food",
        label: "Traditional food.",
        icon: "CookingPot",
        interest: { id: "food", label: "Traditional food" },
        keywords: ["food", "cook", "cuisine", "recipe", "meal", "dish"],
      },
      {
        id: "festivals",
        label: "Festivals and celebrations.",
        icon: "PartyPopper",
        interest: { id: "festivals", label: "Festivals and celebrations" },
        keywords: ["festival", "celebration", "ceremony", "holiday", "music"],
      },
      {
        id: "everyday",
        label: "Everyday family life.",
        icon: "Sun",
        interest: { id: "everyday-life", label: "Everyday family life" },
        keywords: ["daily", "everyday", "family", "routine", "home", "life"],
      },
      {
        id: "hidden-places",
        label: "Hidden local places.",
        icon: "Map",
        interest: { id: "hidden-places", label: "Hidden local places" },
        keywords: ["hidden", "local", "neighborhood", "secret", "favorite place", "walk"],
      },
    ],
  },
  {
    id: "travel-style",
    category: "Travel Style",
    prompt: "What are you hoping to take away from your stay?",
    options: [
      {
        id: "deeper-culture",
        label: "A deeper understanding of local culture.",
        icon: "Globe",
        interest: { id: "culture", label: "Local culture" },
        keywords: ["culture", "tradition", "custom", "language", "heritage"],
      },
      {
        id: "friendships",
        label: "New friendships and connections.",
        icon: "Handshake",
        interest: { id: "friendship", label: "Friendship and connection" },
        keywords: ["connect", "friend", "conversation", "community", "people", "welcome"],
      },
      {
        id: "slower",
        label: "A slower, more personal travel experience.",
        icon: "Leaf",
        interest: { id: "slow-travel", label: "A slower, more personal stay" },
        keywords: ["slow", "everyday", "home", "family", "quiet", "simple"],
      },
      {
        id: "recommendations",
        label: "Local recommendations and discoveries.",
        icon: "Lightbulb",
        interest: { id: "local-discoveries", label: "Local recommendations" },
        keywords: ["recommend", "neighborhood", "local", "favorite", "discover", "place"],
      },
    ],
  },
];

export function getGetToKnowQuestion(id: string) {
  return GET_TO_KNOW_QUESTIONS.find((question) => question.id === id) ?? null;
}

export function getGetToKnowOption(questionId: string, optionId: string) {
  const question = getGetToKnowQuestion(questionId);
  return question?.options.find((option) => option.id === optionId) ?? null;
}
