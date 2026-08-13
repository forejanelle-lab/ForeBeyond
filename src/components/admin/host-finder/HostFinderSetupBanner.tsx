import Link from "next/link";
import { Database, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";

const SUPABASE_SQL =
  "https://supabase.com/dashboard/project/pudfethylijrfilcihgp/sql/new";

export function HostFinderSetupBanner() {
  return (
    <Card variant="outline" padding="lg" className="border-gold/40 bg-cream">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest/10 text-forest">
          <Database className="h-6 w-6" />
        </div>
        <div className="space-y-3 min-w-0">
          <div>
            <h2 className="text-lg font-semibold text-forest">Host Finder setup required</h2>
            <p className="mt-1 text-sm text-charcoal-light leading-relaxed">
              The database tables for Host Finder have not been created yet. Run migration{" "}
              <code className="text-xs bg-sage/60 px-1.5 py-0.5 rounded">075_host_finder.sql</code>{" "}
              in Supabase, then refresh this page.
            </p>
          </div>
          <ol className="text-sm text-charcoal-light space-y-1.5 list-decimal list-inside">
            <li>
              Run locally:{" "}
              <code className="text-xs bg-sage/60 px-1.5 py-0.5 rounded">
                npm run db:migrate-host-finder
              </code>{" "}
              (copies SQL and opens the editor)
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
          <p className="text-xs text-charcoal-light">
            Optional: add{" "}
            <code className="bg-sage/60 px-1 rounded">SUPABASE_DB_PASSWORD</code> or{" "}
            <code className="bg-sage/60 px-1 rounded">DATABASE_URL</code> to{" "}
            <code className="bg-sage/60 px-1 rounded">.env.local</code> so future migrations run
            automatically.
          </p>
        </div>
      </div>
    </Card>
  );
}
