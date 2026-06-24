"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Profile } from "@/types/database";

interface AdminTrustScorePanelProps {
  users: Pick<
    Profile,
    "id" | "full_name" | "email" | "role" | "trust_score" | "verification_status"
  >[];
}

export function AdminTrustScorePanel({ users: initial }: AdminTrustScorePanelProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function recalculate(userId: string) {
    setLoadingId(userId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newScore } = await supabase.rpc("admin_recalculate_trust_score", {
      p_user_id: userId,
      p_admin_id: user.id,
    });

    if (typeof newScore === "number") {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, trust_score: newScore } : u))
      );
    }

    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="rounded-xl border border-sage-dark/30 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
        >
          <div className="flex items-center gap-4">
            <TrustScoreRing score={user.trust_score} size="sm" />
            <div>
              <p className="font-medium text-forest">{user.full_name ?? "Unnamed"}</p>
              <p className="text-xs text-charcoal-light">{user.email}</p>
              <div className="flex gap-2 mt-1">
                {user.role && <Badge variant="outline">{user.role}</Badge>}
                <Badge variant="outline">{user.verification_status}</Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loadingId === user.id}
            onClick={() => recalculate(user.id)}
          >
            <RefreshCw className="h-4 w-4" />
            Recalculate
          </Button>
        </div>
      ))}
    </div>
  );
}
