import { Sparkles } from "lucide-react";
import { matchSharedInterests, type GetToKnowAnswers, type GetToKnowHostProfile } from "@/lib/get-to-know/match";
import { GetToKnowButton } from "@/components/get-to-know/GetToKnowButton";

interface SharedInterestsPanelProps {
  listingId: string;
  hostName: string;
  host: GetToKnowHostProfile;
  answers: GetToKnowAnswers | null;
}

export function SharedInterestsPanel({
  listingId,
  hostName,
  host,
  answers,
}: SharedInterestsPanelProps) {
  const matches = answers ? matchSharedInterests(answers, host) : [];

  return (
    <section className="rounded-2xl border border-sage-dark/20 bg-sage/30 p-5 md:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
        <div>
          <h2 className="text-xl font-serif font-semibold text-forest">
            What you might have in common
          </h2>
          <p className="text-sm text-muted mt-1">
            Based on Get to Know answers and this host&apos;s profile. You should talk more to find what else you share.
          </p>
        </div>
      </div>

      {matches.length > 0 ? (
        <ul className="space-y-2">
          {matches.map((match) => (
            <li key={match.interestId} className="text-sm text-charcoal">
              <span className="font-medium text-forest">{match.label}.</span>{" "}
              From {match.source}: “{match.evidence}”
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-charcoal-light">
          You&apos;re ready to start a conversation and discover what you have in common.
        </p>
      )}

      <GetToKnowButton listingId={listingId} hostName={hostName} variant="outline" size="sm" />
    </section>
  );
}
