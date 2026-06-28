"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { AdminTable, AdminBadgeCell, AdminDateCell } from "@/components/admin/AdminTable";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getProfileVerificationStatusLabel } from "@/lib/verification-labels";
import type { Profile, UserLoginEvent } from "@/types/database";

interface TripSummary {
  id: string;
  role: "guest" | "host";
  listingTitle: string | null;
  otherPartyName: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  totalAmount: number | null;
  nightlyRate: number | null;
  conversationId: string | null;
}

interface AdminUserDetailProps {
  profile: Pick<
    Profile,
    | "id"
    | "full_name"
    | "email"
    | "role"
    | "verification_status"
    | "trust_score"
    | "bio"
    | "location"
    | "created_at"
    | "last_login_at"
    | "last_active_at"
  >;
  loginEvents: Pick<
    UserLoginEvent,
    "id" | "logged_in_at" | "ip_address" | "user_agent" | "auth_method"
  >[];
  trips: TripSummary[];
  showMessagePrompt?: boolean;
}

function formatMoney(amount: number | null) {
  if (amount == null) return "—";
  return `$${amount.toLocaleString()}`;
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "—";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const startLabel = start ? new Date(start).toLocaleDateString("en-US", opts) : "—";
  const endLabel = end ? new Date(end).toLocaleDateString("en-US", opts) : "—";
  return `${startLabel} – ${endLabel}`;
}

function formatAuthMethod(method: string) {
  return method.replace(/_/g, " ");
}

function shortenUserAgent(userAgent: string | null) {
  if (!userAgent) return "—";
  if (userAgent.length <= 72) return userAgent;
  return `${userAgent.slice(0, 69)}…`;
}

export function AdminUserDetail({ profile, loginEvents, trips, showMessagePrompt }: AdminUserDetailProps) {
  const guestTrips = trips.filter((t) => t.role === "guest");
  const hostTrips = trips.filter((t) => t.role === "host");
  const messageTrip = trips.find((t) => t.conversationId);

  return (
    <div className="space-y-6">
      <Card variant="outline" padding="md" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-forest">{profile.full_name ?? "Unnamed user"}</h2>
            <p className="text-sm text-charcoal-light">{profile.email}</p>
            {profile.location && (
              <p className="text-sm text-charcoal-light mt-1">{profile.location}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.role && <AdminBadgeCell label={profile.role} />}
            <AdminBadgeCell
              label={getProfileVerificationStatusLabel(profile.verification_status)}
              variant="outline"
            />
            <Badge variant="gold">Trust {profile.trust_score}</Badge>
          </div>
        </div>
        {profile.bio && <p className="text-sm text-charcoal-light">{profile.bio}</p>}
        <p className="text-xs text-charcoal-light">
          Joined <AdminDateCell value={profile.created_at} />
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-charcoal-light">
          <p>
            Last login <AdminDateCell value={profile.last_login_at} />
          </p>
          <p>
            Last active <AdminDateCell value={profile.last_active_at} />
          </p>
        </div>
        {showMessagePrompt && (
          <div className="rounded-xl bg-sage/40 px-4 py-3 text-sm text-charcoal-light">
            {messageTrip?.conversationId ? (
              <Link
                href={`/messages/${messageTrip.conversationId}`}
                className="inline-flex items-center gap-2 rounded-xl bg-forest text-white px-4 py-2 text-sm font-medium hover:bg-forest-light"
              >
                <MessageSquare className="h-4 w-4" />
                Open conversation
              </Link>
            ) : (
              <p>
                No in-app conversation yet. Use email at{" "}
                <a href={`mailto:${profile.email}`} className="text-forest underline">
                  {profile.email}
                </a>{" "}
                to request more verification details.
              </p>
            )}
          </div>
        )}
      </Card>

      <section>
        <h3 className="text-lg font-semibold text-forest mb-3">
          Login history ({loginEvents.length})
        </h3>
        <AdminTable
          rows={loginEvents}
          emptyMessage="No login events recorded yet."
          columns={[
            {
              key: "logged_in_at",
              label: "Logged in",
              render: (r) => <AdminDateCell value={r.logged_in_at} />,
            },
            {
              key: "auth_method",
              label: "Method",
              render: (r) => (
                <AdminBadgeCell label={formatAuthMethod(r.auth_method)} variant="outline" />
              ),
            },
            {
              key: "ip_address",
              label: "IP",
              render: (r) => r.ip_address ?? "—",
            },
            {
              key: "user_agent",
              label: "Device / browser",
              render: (r) => (
                <span className="text-sm text-charcoal-light" title={r.user_agent ?? undefined}>
                  {shortenUserAgent(r.user_agent)}
                </span>
              ),
            },
          ]}
        />
      </section>

      <section>
        <h3 className="text-lg font-semibold text-forest mb-3">Guest trips ({guestTrips.length})</h3>
        <AdminTable
          rows={guestTrips}
          emptyMessage="No trips as a guest."
          columns={[
            {
              key: "listing",
              label: "Listing",
              render: (r) => r.listingTitle ?? "—",
            },
            {
              key: "host",
              label: "Host",
              render: (r) => r.otherPartyName ?? "—",
            },
            {
              key: "dates",
              label: "Dates",
              render: (r) => formatDateRange(r.startDate, r.endDate),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <AdminBadgeCell label={r.status} variant="outline" />,
            },
            {
              key: "rate",
              label: "Nightly",
              render: (r) => formatMoney(r.nightlyRate),
            },
            {
              key: "total",
              label: "Total",
              render: (r) => formatMoney(r.totalAmount),
            },
            {
              key: "trip",
              label: "",
              render: (r) => (
                <Link href={`/trips/${r.id}`} className="text-sm text-forest hover:underline">
                  View trip
                </Link>
              ),
            },
          ]}
        />
      </section>

      <section>
        <h3 className="text-lg font-semibold text-forest mb-3">Hosted trips ({hostTrips.length})</h3>
        <AdminTable
          rows={hostTrips}
          emptyMessage="No trips as a host."
          columns={[
            {
              key: "listing",
              label: "Listing",
              render: (r) => r.listingTitle ?? "—",
            },
            {
              key: "guest",
              label: "Guest",
              render: (r) => r.otherPartyName ?? "—",
            },
            {
              key: "dates",
              label: "Dates",
              render: (r) => formatDateRange(r.startDate, r.endDate),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <AdminBadgeCell label={r.status} variant="outline" />,
            },
            {
              key: "rate",
              label: "Nightly",
              render: (r) => formatMoney(r.nightlyRate),
            },
            {
              key: "total",
              label: "Total",
              render: (r) => formatMoney(r.totalAmount),
            },
            {
              key: "trip",
              label: "",
              render: (r) => (
                <Link href={`/trips/${r.id}`} className="text-sm text-forest hover:underline">
                  View trip
                </Link>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
