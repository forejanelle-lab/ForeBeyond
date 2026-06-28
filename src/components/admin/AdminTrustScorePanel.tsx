"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { AdminTrustScoreDetailModal } from "@/components/admin/AdminTrustScoreDetailModal";
import { AdminToolbar, AdminSelect } from "@/components/admin/AdminToolbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getVerificationStatusLabel } from "@/lib/trust-score-detail";
import type { Profile } from "@/types/database";

interface AdminTrustScorePanelProps {
  users: Pick<
    Profile,
    "id" | "full_name" | "email" | "role" | "trust_score" | "verification_status"
  >[];
}

function formatRefreshedAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminTrustScorePanel({ users: initial }: AdminTrustScorePanelProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trust_desc");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Record<string, string>>({});
  const [detailUser, setDetailUser] = useState<Pick<
    Profile,
    "id" | "full_name" | "email"
  > | null>(null);

  useEffect(() => {
    setUsers(initial);
  }, [initial]);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (!q) return true;
      return (
        user.email.toLowerCase().includes(q) ||
        (user.full_name?.toLowerCase().includes(q) ?? false)
      );
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "trust_asc") return (a.trust_score ?? 0) - (b.trust_score ?? 0);
      if (sortBy === "name") {
        return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email);
      }
      return (b.trust_score ?? 0) - (a.trust_score ?? 0);
    });

    return rows;
  }, [users, search, roleFilter, sortBy]);

  async function recalculate(userId: string) {
    setLoadingId(userId);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoadingId(null);
      return;
    }

    const { data: newScore } = await supabase.rpc("admin_recalculate_trust_score", {
      p_user_id: userId,
      p_admin_id: user.id,
    });

    if (typeof newScore === "number") {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, trust_score: newScore } : u))
      );
      setLastRefreshed((prev) => ({ ...prev, [userId]: new Date().toISOString() }));
    }

    setLoadingId(null);
    router.refresh();
  }

  return (
    <>
      <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search name or email…">
        <AdminSelect
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "all", label: "All roles" },
            { value: "traveler", label: "Travelers" },
            { value: "host", label: "Hosts" },
          ]}
        />
        <AdminSelect
          label="Sort"
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "trust_desc", label: "Trust (high → low)" },
            { value: "trust_asc", label: "Trust (low → high)" },
            { value: "name", label: "Name" },
          ]}
        />
      </AdminToolbar>

      <p className="text-xs text-charcoal-light mb-4">
        Scores auto-refresh every 15 seconds when trust-related data changes.
      </p>

      <div className="space-y-3">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="rounded-xl border border-sage-dark/30 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setDetailUser({
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                  })
                }
                className="rounded-full transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-forest/30"
                aria-label={`View trust score details for ${user.full_name ?? user.email}`}
              >
                <TrustScoreRing score={user.trust_score} size="sm" />
              </button>
              <div>
                <p className="font-medium text-forest">{user.full_name ?? "Unnamed"}</p>
                <p className="text-xs text-charcoal-light">{user.email}</p>
                <div className="flex gap-2 mt-1">
                  {user.role && <Badge variant="outline">{user.role}</Badge>}
                  <Badge variant="outline">
                    {getVerificationStatusLabel(user.verification_status)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === user.id}
                onClick={() => recalculate(user.id)}
              >
                <RefreshCw className="h-4 w-4" />
                Recalculate
              </Button>
              <p className="text-[11px] text-charcoal-light">
                {lastRefreshed[user.id]
                  ? `Last recalculated ${formatRefreshedAt(lastRefreshed[user.id])}`
                  : "Not recalculated this session"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <AdminTrustScoreDetailModal
        open={detailUser !== null}
        userId={detailUser?.id ?? null}
        userName={detailUser?.full_name ?? null}
        userEmail={detailUser?.email ?? null}
        onClose={() => setDetailUser(null)}
      />
    </>
  );
}
