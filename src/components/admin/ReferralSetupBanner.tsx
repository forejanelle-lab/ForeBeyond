import Link from "next/link";
import { Database, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";

const SUPABASE_SQL =
  "https://supabase.com/dashboard/project/pudfethylijrfilcihgp/sql/new";

export function ReferralSetupBanner() {
  return (
    <Card variant="outline" padding="lg" className="border-gold/40 bg-cream">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest/10 text-forest">
          <Database className="h-6 w-6" />
        </div>
        <div className="space-y-3 min-w-0">
          <div>
            <h2 className="text-lg font-semibold text-forest">Referral tables not created yet</h2>
            <p className="mt-1 text-sm text-charcoal-light leading-relaxed">
              Run migration{" "}
              <code className="text-xs bg-sage/60 px-1.5 py-0.5 rounded">079_referral_links.sql</code>{" "}
              in Supabase, then refresh this page.
            </p>
          </div>
          <ol className="text-sm text-charcoal-light space-y-1.5 list-decimal list-inside">
            <li>
              Run locally:{" "}
              <code className="text-xs bg-sage/60 px-1.5 py-0.5 rounded">
                npm run db:migrate-referrals
              </code>
            </li>
            <li>Paste into the Supabase SQL Editor and click Run</li>
            <li>Refresh this page</li>
          </ol>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={SUPABASE_SQL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors"
            >
              Open Supabase SQL Editor
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
