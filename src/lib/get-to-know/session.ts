import type { SupabaseClient } from "@supabase/supabase-js";
import type { GetToKnowAnswers } from "@/lib/get-to-know/match";

export type GetToKnowDecision = "love_to_stay" | "learn_more" | "not_right_fit";

export interface GetToKnowSessionState {
  answers: GetToKnowAnswers;
  selectedPromptId: string | null;
  interestDecision: GetToKnowDecision | null;
  completedAt: string | null;
}

export const GET_TO_KNOW_DECISIONS: { id: GetToKnowDecision; label: string; hint: string }[] = [
  {
    id: "love_to_stay",
    label: "I'd love to stay with this host",
    hint: "Continue to a stay request. This stays private until you send it.",
  },
  {
    id: "learn_more",
    label: "I'd like to learn more",
    hint: "Keep exploring the profile, conversation prompts, or send a stay request when you're ready.",
  },
  {
    id: "not_right_fit",
    label: "Not the right fit for me",
    hint: "That's okay. Return to search and keep looking. Hosts are not ranked or penalized.",
  },
];

const STORAGE_PREFIX = "fb_gtk_";

export function getToKnowStorageKey(listingId: string) {
  return `${STORAGE_PREFIX}${listingId}`;
}

export function emptyGetToKnowSession(): GetToKnowSessionState {
  return {
    answers: {},
    selectedPromptId: null,
    interestDecision: null,
    completedAt: null,
  };
}

export function readLocalGetToKnowSession(listingId: string): GetToKnowSessionState {
  if (typeof window === "undefined") return emptyGetToKnowSession();
  try {
    const raw = localStorage.getItem(getToKnowStorageKey(listingId));
    if (!raw) return emptyGetToKnowSession();
    const parsed = JSON.parse(raw) as Partial<GetToKnowSessionState>;
    return {
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      selectedPromptId: parsed.selectedPromptId ?? null,
      interestDecision: parsed.interestDecision ?? null,
      completedAt: parsed.completedAt ?? null,
    };
  } catch {
    return emptyGetToKnowSession();
  }
}

export function writeLocalGetToKnowSession(listingId: string, state: GetToKnowSessionState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getToKnowStorageKey(listingId), JSON.stringify(state));
  } catch {
    // Private mode / quota should not break the flow.
  }
}

export function isGetToKnowSchemaError(message: string) {
  return /get_to_know_sessions|schema cache|could not find the table/i.test(message);
}

export async function loadGetToKnowSession(
  supabase: SupabaseClient,
  travelerId: string,
  listingId: string
): Promise<GetToKnowSessionState | null> {
  const { data, error } = await supabase
    .from("get_to_know_sessions")
    .select("answers, selected_prompt_id, interest_decision, completed_at")
    .eq("traveler_id", travelerId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error) {
    if (isGetToKnowSchemaError(error.message)) return null;
    return null;
  }
  if (!data) return null;

  const row = data as {
    answers: GetToKnowAnswers | null;
    selected_prompt_id: string | null;
    interest_decision: GetToKnowDecision | null;
    completed_at: string | null;
  };

  return {
    answers: row.answers ?? {},
    selectedPromptId: row.selected_prompt_id,
    interestDecision: row.interest_decision,
    completedAt: row.completed_at,
  };
}

export async function saveGetToKnowSession(
  supabase: SupabaseClient,
  input: {
    travelerId: string;
    listingId: string;
    hostId: string;
    state: GetToKnowSessionState;
  }
) {
  const { error } = await supabase.from("get_to_know_sessions").upsert(
    {
      traveler_id: input.travelerId,
      listing_id: input.listingId,
      host_id: input.hostId,
      answers: input.state.answers,
      selected_prompt_id: input.state.selectedPromptId,
      interest_decision: input.state.interestDecision,
      completed_at: input.state.completedAt,
    },
    { onConflict: "traveler_id,listing_id" }
  );

  if (error && !isGetToKnowSchemaError(error.message)) {
    console.error("Failed to save Get to Know session:", error.message);
  }
}

export async function isGetToKnowSchemaReady(supabase: SupabaseClient) {
  const { error } = await supabase.from("get_to_know_sessions").select("id").limit(1);
  if (!error) return true;
  return !isGetToKnowSchemaError(error.message);
}
