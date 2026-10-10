import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";

interface HostConnectionGuideProps {
  listingId: string;
}

export function HostConnectionGuide({ listingId }: HostConnectionGuideProps) {
  return (
    <Card variant="outline" padding="md" className="mb-8 space-y-3">
      <div className="flex items-start gap-3">
        <MessageCircle className="h-5 w-5 text-forest shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-forest">Help travelers get to know you</h2>
          <p className="text-sm text-charcoal-light mt-1 leading-relaxed">
            Travelers can now start with Get to Know before they request a stay. Add conversation
            topics, local recommendations, and a clear family story so matches are based on what
            you actually share — never on guessed details. Exact addresses and identity documents
            stay private.
          </p>
        </div>
      </div>
      <ButtonLink href={`/host/listings/${listingId}/edit`} variant="secondary" size="sm">
        Improve your introduction
      </ButtonLink>
      <p className="text-xs text-muted">
        Stay requests and messages still arrive in{" "}
        <Link href="/host/requests" className="underline hover:no-underline">
          Requests
        </Link>
        .
      </p>
    </Card>
  );
}
