"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Compass,
  Copy,
  Globe,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GET_TO_KNOW_QUESTIONS } from "@/lib/get-to-know/questions";
import {
  CONVERSATION_STARTER_CATEGORIES,
  CONVERSATION_STARTERS,
  nextStarter,
  startersForInterests,
  type ConversationStarter,
  type ConversationStarterCategory,
} from "@/lib/get-to-know/starters";
import {
  answeredInterestIds,
  buildOpeningMessage,
  hostProfileFromListing,
  matchSharedInterests,
} from "@/lib/get-to-know/match";
import {
  GET_TO_KNOW_DECISIONS,
  emptyGetToKnowSession,
  loadGetToKnowSession,
  readLocalGetToKnowSession,
  saveGetToKnowSession,
  writeLocalGetToKnowSession,
  type GetToKnowSessionState,
} from "@/lib/get-to-know/session";
import { GetToKnowEvents, captureGetToKnowEvent } from "@/lib/get-to-know/analytics";
import {
  conversationDraftPath,
  stayRequestWithIntroPath,
} from "@/lib/get-to-know/paths";
import { hostListingPath } from "@/lib/listing-access";
import { HostAvatar } from "@/components/design/HostAvatar";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import type { PublicListing } from "@/types/database";

const OPTION_ICONS: Record<string, LucideIcon> = {
  ChefHat: Utensils,
  UtensilsCrossed: Utensils,
  Soup: Utensils,
  Sparkles,
  Trees: Compass,
  MapPin,
  Landmark: Globe,
  Users,
  MessageCircle,
  Heart,
  Compass,
  Home,
  CookingPot: Utensils,
  PartyPopper: Sparkles,
  Sun: Sparkles,
  Map: MapPin,
  Globe,
  Handshake: Users,
  Leaf: Compass,
  Lightbulb: Sparkles,
};

type FlowStep = "intro" | "questions" | "matches" | "starters" | "decide";

interface GetToKnowFlowProps {
  listing: PublicListing;
  hostName: string;
  hostAvatarUrl?: string | null;
  canMessageHost?: boolean;
  messageConversationId?: string | null;
}

function persist(
  listingId: string,
  hostId: string,
  travelerId: string | null,
  state: GetToKnowSessionState
) {
  writeLocalGetToKnowSession(listingId, state);
  if (!travelerId) return;
  const supabase = createClient();
  void saveGetToKnowSession(supabase, {
    travelerId,
    listingId,
    hostId,
    state,
  });
}

export function GetToKnowFlow({
  listing,
  hostName,
  hostAvatarUrl = null,
  canMessageHost = false,
  messageConversationId = null,
}: GetToKnowFlowProps) {
  const router = useRouter();
  const host = useMemo(() => hostProfileFromListing(listing), [listing]);
  const introSnippet = useMemo(() => {
    const story = (listing.family_story ?? listing.host_motivation ?? "").trim();
    if (!story) return null;
    return story.length > 220 ? `${story.slice(0, 220).trim()}…` : story;
  }, [listing.family_story, listing.host_motivation]);

  const [step, setStep] = useState<FlowStep>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [session, setSession] = useState<GetToKnowSessionState>(emptyGetToKnowSession);
  const [travelerId, setTravelerId] = useState<string | null>(null);
  const [category, setCategory] = useState<ConversationStarterCategory>("Food");
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = readLocalGetToKnowSession(listing.id);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      let next = local;
      if (user) {
        setTravelerId(user.id);
        const remote = await loadGetToKnowSession(supabase, user.id, listing.id);
        if (remote && Object.keys(remote.answers).length >= Object.keys(local.answers).length) {
          next = remote;
        }
      }
      setSession(next);
      setHydrated(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  const matches = useMemo(
    () => matchSharedInterests(session.answers, host),
    [session.answers, host]
  );
  const interestIds = useMemo(
    () => answeredInterestIds(session.answers),
    [session.answers]
  );
  const rankedStarters = useMemo(
    () => startersForInterests(interestIds),
    [interestIds]
  );
  const categoryStarters = useMemo(
    () =>
      rankedStarters.filter((starter) => starter.category === category).length > 0
        ? rankedStarters.filter((starter) => starter.category === category)
        : CONVERSATION_STARTERS.filter((starter) => starter.category === category),
    [rankedStarters, category]
  );
  const selectedStarter =
    rankedStarters.find((starter) => starter.id === session.selectedPromptId) ??
    categoryStarters[0] ??
    rankedStarters[0] ??
    CONVERSATION_STARTERS[0];

  const opening = useMemo(
    () =>
      buildOpeningMessage({
        hostName,
        location: host.location,
        matches,
        prompt: selectedStarter?.prompt ?? "What's everyday life like at your home?",
      }),
    [host.location, hostName, matches, selectedStarter?.prompt]
  );

  const question = GET_TO_KNOW_QUESTIONS[questionIndex];
  const progressCurrent =
    step === "intro"
      ? 0
      : step === "questions"
        ? questionIndex + 1
        : GET_TO_KNOW_QUESTIONS.length;
  const progressLabel =
    step === "questions"
      ? `Question ${questionIndex + 1} of ${GET_TO_KNOW_QUESTIONS.length}`
      : step === "intro"
        ? "Optional introduction"
        : "Your summary";

  function updateSession(partial: Partial<GetToKnowSessionState>) {
    setSession((prev) => {
      const next = { ...prev, ...partial };
      persist(listing.id, listing.host_id, travelerId, next);
      return next;
    });
  }

  function start() {
    captureGetToKnowEvent(GetToKnowEvents.STARTED, {
      listing_id: listing.id,
      host_id: listing.host_id,
    });
    setQuestionIndex(0);
    setStep("questions");
  }

  function answerQuestion(optionId: string) {
    if (!question) return;
    const answers = { ...session.answers, [question.id]: optionId };
    advanceFromAnswers(answers);
  }

  function goNextQuestion() {
    advanceFromAnswers(session.answers);
  }

  function advanceFromAnswers(answers: GetToKnowSessionState["answers"]) {
    if (questionIndex < GET_TO_KNOW_QUESTIONS.length - 1) {
      updateSession({ answers });
      setQuestionIndex((index) => index + 1);
      return;
    }
    finishQuestions(answers);
  }

  function finishQuestions(answers: GetToKnowSessionState["answers"]) {
    const completedAt = session.completedAt ?? new Date().toISOString();
    updateSession({ answers, completedAt });
    captureGetToKnowEvent(GetToKnowEvents.COMPLETED, {
      listing_id: listing.id,
      answered_count: Object.keys(answers).length,
    });
    captureGetToKnowEvent(GetToKnowEvents.SHARED_INTERESTS_VIEWED, {
      listing_id: listing.id,
      match_count: matchSharedInterests(answers, host).length,
    });
    setStep("matches");
  }

  function selectStarter(starter: ConversationStarter) {
    updateSession({ selectedPromptId: starter.id });
    captureGetToKnowEvent(GetToKnowEvents.CONVERSATION_PROMPT_SELECTED, {
      listing_id: listing.id,
      prompt_id: starter.id,
    });
  }

  async function copyOpening() {
    try {
      await navigator.clipboard.writeText(opening);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function startConversation() {
    captureGetToKnowEvent(GetToKnowEvents.HOST_MESSAGE_STARTED, {
      listing_id: listing.id,
      messaging_open: Boolean(canMessageHost && messageConversationId),
    });
    if (canMessageHost && messageConversationId) {
      router.push(conversationDraftPath(messageConversationId, opening));
      return;
    }
    captureGetToKnowEvent(GetToKnowEvents.BOOKING_REQUEST_STARTED, {
      listing_id: listing.id,
    });
    router.push(stayRequestWithIntroPath(listing.id, opening));
  }

  function chooseDecision(id: (typeof GET_TO_KNOW_DECISIONS)[number]["id"]) {
    updateSession({ interestDecision: id });
    if (id === "love_to_stay") {
      captureGetToKnowEvent(GetToKnowEvents.BOOKING_REQUEST_STARTED, {
        listing_id: listing.id,
      });
      router.push(stayRequestWithIntroPath(listing.id, opening));
      return;
    }
    if (id === "not_right_fit") {
      router.push("/search");
      return;
    }
    router.push(hostListingPath(listing.id));
  }

  if (!hydrated || !question) {
    return (
      <Card variant="outline" padding="lg" className="max-w-3xl mx-auto">
        <p className="text-sm text-muted">Loading Get to Know…</p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push(hostListingPath(listing.id))}
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-forest"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </button>
        <p className="text-xs text-muted">{progressLabel}</p>
      </div>

      <div
        className="h-1.5 rounded-full bg-sage overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={GET_TO_KNOW_QUESTIONS.length}
        aria-valuenow={progressCurrent}
      >
        <div
          className="h-full bg-forest transition-all"
          style={{
            width: `${(progressCurrent / GET_TO_KNOW_QUESTIONS.length) * 100}%`,
          }}
        />
      </div>

      {step === "intro" && (
        <Card variant="elevated" padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
            <HostAvatar
              avatarUrl={hostAvatarUrl}
              firstName={listing.host_first_name}
              hostName={hostName}
              sizeClass="h-24 w-24"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-forest">Get to Know</p>
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-forest text-balance">
                Get to Know {hostName}
              </h1>
              <p className="text-charcoal-light leading-relaxed">
                Take two minutes to discover what you might have in common before deciding
                whether this home is right for your trip.
              </p>
            </div>
          </div>
          {introSnippet && (
            <p className="text-sm text-charcoal leading-relaxed rounded-2xl bg-sage/40 px-4 py-3">
              “{introSnippet}”
            </p>
          )}
          <p className="text-sm text-muted">
            This is optional and does not commit you to booking. You can skip any question
            or leave at any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" size="lg" onClick={start}>
              Let&apos;s Get Started
            </Button>
            <ButtonLink href={hostListingPath(listing.id)} variant="outline" size="lg">
              View host profile
            </ButtonLink>
          </div>
        </Card>
      )}

      {step === "questions" && (
        <Card variant="elevated" padding="lg" className="space-y-6">
          <div>
            <p className="text-sm font-medium text-forest">{question.category}</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-serif font-semibold text-forest text-balance">
              {question.prompt}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option) => {
              const Icon = OPTION_ICONS[option.icon] ?? Sparkles;
              const selected = session.answers[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => answerQuestion(option.id)}
                  className={`text-left rounded-2xl border px-4 py-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                    selected
                      ? "border-forest bg-sage/70 shadow-sm"
                      : "border-sage-dark/30 bg-white hover:border-forest/40 hover:bg-sage/30"
                  }`}
                >
                  <Icon className="h-5 w-5 text-forest mb-2" />
                  <span className="text-sm font-medium text-charcoal">{option.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={goNextQuestion}
              className="text-sm text-muted hover:text-forest"
            >
              Skip this question
            </button>
            <button
              type="button"
              onClick={() => router.push(hostListingPath(listing.id))}
              className="text-sm text-muted hover:text-forest"
            >
              Exit
            </button>
          </div>
        </Card>
      )}

      {step === "matches" && (
        <Card variant="elevated" padding="lg" className="space-y-6">
          {matches.length > 0 ? (
            <>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-forest text-balance">
                You and {hostName} have some things in common
              </h2>
              <p className="text-sm text-muted">
                These notes come from your answers and what {hostName} has shared on their
                profile — not a compatibility score.
              </p>
              <ul className="space-y-3">
                {matches.map((match) => (
                  <li
                    key={match.interestId}
                    className="rounded-2xl border border-sage-dark/20 bg-sage/30 px-4 py-3"
                  >
                    <p className="font-medium text-forest">{match.label}</p>
                    <p className="text-sm text-charcoal-light mt-1">
                      From {match.source}: “{match.evidence}”
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-forest text-balance">
                You&apos;re ready to start a conversation
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                There isn&apos;t enough overlapping detail yet to highlight shared interests.
                A few thoughtful questions are a good next step.
              </p>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" size="lg" onClick={() => setStep("starters")}>
              See conversation starters
            </Button>
            <ButtonLink href={hostListingPath(listing.id)} variant="outline" size="lg">
              View host profile
            </ButtonLink>
          </div>
        </Card>
      )}

      {step === "starters" && selectedStarter && (
        <div className="space-y-4">
          <Card variant="elevated" padding="lg" className="space-y-5">
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-forest">
              Conversation cards
            </h2>
            <div className="flex flex-wrap gap-2">
              {CONVERSATION_STARTER_CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    category === item
                      ? "bg-forest text-white"
                      : "bg-sage text-forest hover:bg-sage-dark"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryStarters.map((starter) => (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => selectStarter(starter)}
                  className={`text-left rounded-2xl border px-4 py-4 text-sm ${
                    selectedStarter.id === starter.id
                      ? "border-forest bg-sage/70"
                      : "border-sage-dark/30 hover:border-forest/40"
                  }`}
                >
                  {starter.prompt}
                </button>
              ))}
            </div>
            <div className="rounded-2xl bg-cream border border-sage-dark/20 p-4 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Opening message
              </p>
              <p className="text-sm text-charcoal leading-relaxed">{opening}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={copyOpening}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = nextStarter(selectedStarter.id, categoryStarters);
                    if (next) selectStarter(next);
                  }}
                >
                  Suggest another question
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="button" size="lg" onClick={startConversation}>
                Start a conversation
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => setStep("decide")}>
                Decide next step
              </Button>
            </div>
            {!(canMessageHost && messageConversationId) && (
              <p className="text-xs text-muted">
                Messaging opens after a stay request, when the host writes first or approves.
                Your opening note can go in the stay request.
              </p>
            )}
          </Card>
        </div>
      )}

      {step === "decide" && (
        <Card variant="elevated" padding="lg" className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-forest">
            What feels right from here?
          </h2>
          <p className="text-sm text-muted">
            This choice is private to you unless you send a stay request or message.
          </p>
          <div className="space-y-3">
            {GET_TO_KNOW_DECISIONS.map((decision) => (
              <button
                key={decision.id}
                type="button"
                onClick={() => chooseDecision(decision.id)}
                className="w-full text-left rounded-2xl border border-sage-dark/30 px-4 py-4 hover:border-forest/40 hover:bg-sage/30"
              >
                <span className="flex items-center gap-2 font-medium text-forest">
                  {session.interestDecision === decision.id && <Check className="h-4 w-4" />}
                  {decision.label}
                </span>
                <span className="block text-sm text-muted mt-1">{decision.hint}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
