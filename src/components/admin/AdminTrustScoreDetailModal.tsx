"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  buildTrustScoreDetailItems,
  getRemainingTrustDetailItems,
  getTrustDetailItemStatusLabel,
  getVerificationStatusLabel,
  type TrustScoreDetailItem,
} from "@/lib/trust-score-detail";
import { TrustScoreBreakdown } from "@/components/trust/TrustScoreBreakdown";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { Badge } from "@/components/ui/Badge";
import type { Profile, VerificationDocument } from "@/types/database";
import type { TrustScoreBreakdown as Breakdown } from "@/lib/trust-score";

interface AdminTrustScoreDetailModalProps {
  open: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  onClose: () => void;
}

function statusBadgeVariant(status: TrustScoreDetailItem["status"]) {
  if (status === "complete") return "success" as const;
  if (status === "submitted") return "warning" as const;
  if (status === "rejected") return "outline" as const;
  return "outline" as const;
}

function statusLabel(status: TrustScoreDetailItem["status"]) {
  return getTrustDetailItemStatusLabel(status);
}

export function AdminTrustScoreDetailModal({
  open,
  userId,
  userName,
  userEmail,
  onClose,
}: AdminTrustScoreDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Pick<
    Profile,
    "trust_score" | "trust_score_breakdown" | "verification_status" | "email_verified_at" | "phone_verified_at" | "profile_completion" | "role"
  > | null>(null);
  const [documents, setDocuments] = useState<Pick<VerificationDocument, "document_type" | "status">[]>([]);

  useEffect(() => {
    if (!open || !userId) return;

    async function load() {
      setLoading(true);
      setError("");
      const supabase = createClient();

      const [{ data: profileData, error: profileError }, { data: documentData, error: documentError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "trust_score, trust_score_breakdown, verification_status, email_verified_at, phone_verified_at, profile_completion, role"
            )
            .eq("id", userId)
            .single(),
          supabase.from("verification_documents").select("document_type, status").eq("user_id", userId),
        ]);

      if (profileError || documentError) {
        setError(profileError?.message ?? documentError?.message ?? "Unable to load trust details.");
        setLoading(false);
        return;
      }

      setProfile(profileData as typeof profile);
      setDocuments((documentData as typeof documents) ?? []);
      setLoading(false);
    }

    void load();
  }, [open, userId]);

  const detailItems = useMemo(() => {
    if (!profile) return [];

    const docMap: Record<string, VerificationDocument["status"]> = {};
    documents.forEach((doc) => {
      docMap[doc.document_type] = doc.status;
    });

    return buildTrustScoreDetailItems({
      breakdown: (profile.trust_score_breakdown ?? {}) as Breakdown,
      emailVerified: !!profile.email_verified_at,
      phoneVerified: !!profile.phone_verified_at,
      documentStatuses: docMap,
      role: profile.role,
    });
  }, [profile, documents]);

  const remainingItems = useMemo(
    () => getRemainingTrustDetailItems(detailItems),
    [detailItems]
  );

  if (!open || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close trust score details"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trust-score-detail-title"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-sage-dark/30"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-sage-dark/20 bg-white px-6 py-4">
          <div>
            <h2 id="trust-score-detail-title" className="text-lg font-semibold text-forest">
              {userName ?? "Member"} — Trust Score
            </h2>
            {userEmail && <p className="text-sm text-charcoal-light mt-1">{userEmail}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-sage/50 transition-colors text-charcoal-light hover:text-forest"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {loading && <p className="text-sm text-charcoal-light">Loading trust details…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && profile && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <TrustScoreRing score={profile.trust_score ?? 0} size="md" />
                <div className="space-y-2">
                  <Badge variant="outline">
                    Verification: {getVerificationStatusLabel(profile.verification_status)}
                  </Badge>
                  <p className="text-sm text-charcoal-light">
                    Profile {profile.profile_completion ?? 0}% complete
                  </p>
                  <Link
                    href={`/admin/users/${userId}`}
                    className="inline-block text-sm text-forest hover:underline"
                  >
                    View member profile
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-forest mb-3">
                  Remaining ({remainingItems.length})
                </h3>
                {remainingItems.length === 0 ? (
                  <p className="text-sm text-charcoal-light">All tracked trust items are complete.</p>
                ) : (
                  <ul className="space-y-2">
                    {remainingItems.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-sage-dark/20 bg-sage/20 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-forest text-sm">{item.label}</span>
                          <Badge variant={statusBadgeVariant(item.status)}>
                            {statusLabel(item.status)}
                          </Badge>
                          {item.points > 0 && (
                            <Badge variant="outline">Up to +{item.points} pts</Badge>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-light mt-1">{item.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-forest mb-3">Score breakdown</h3>
                <TrustScoreBreakdown
                  breakdown={(profile.trust_score_breakdown ?? {}) as Breakdown}
                  role={profile.role}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-forest mb-3">All items</h3>
                <ul className="divide-y divide-sage-dark/20 rounded-xl border border-sage-dark/20 overflow-hidden">
                  {detailItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white"
                    >
                      <div>
                        <p className="text-sm font-medium text-forest">{item.label}</p>
                        <p className="text-xs text-charcoal-light">{item.description}</p>
                      </div>
                      <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
