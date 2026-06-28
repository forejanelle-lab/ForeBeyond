"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAdminDateTime } from "@/lib/admin";
import { formatDocumentType } from "@/lib/verification-documents";
import { ViewVerificationDocumentButton } from "@/components/admin/ViewVerificationDocumentButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { VerificationDocument, VerificationStatus } from "@/types/database";

type AdminVerificationDoc = VerificationDocument & {
  user_name: string | null;
  user_email: string | null;
  user_id: string;
};

interface AdminVerificationPanelProps {
  documents: AdminVerificationDoc[];
}

interface UserVerificationGroup {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  documents: AdminVerificationDoc[];
}

export function AdminVerificationPanel({ documents: initial }: AdminVerificationPanelProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [collapsedUserIds, setCollapsedUserIds] = useState<Set<string>>(() => new Set());

  function isUserExpanded(userId: string) {
    return !collapsedUserIds.has(userId);
  }

  function toggleUserExpanded(userId: string) {
    setCollapsedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function expandAllUsers() {
    setCollapsedUserIds(new Set());
  }

  function collapseAllUsers(userIds: string[]) {
    setCollapsedUserIds(new Set(userIds));
  }

  const groups = useMemo(() => {
    const pending = documents.filter(
    (d) => d.status === "pending" || d.status === "in_review"
  );
    const byUser = new Map<string, AdminVerificationDoc[]>();

    for (const doc of pending) {
      const list = byUser.get(doc.user_id) ?? [];
      list.push(doc);
      byUser.set(doc.user_id, list);
    }

    const result: UserVerificationGroup[] = [];
    for (const [userId, docs] of byUser.entries()) {
      result.push({
        userId,
        userName: docs[0]?.user_name ?? null,
        userEmail: docs[0]?.user_email ?? null,
        documents: [...docs].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      });
    }

    return result.sort((a, b) => {
      const aLatest = a.documents[a.documents.length - 1]?.created_at ?? "";
      const bLatest = b.documents[b.documents.length - 1]?.created_at ?? "";
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });
  }, [documents]);

  const pendingCount = useMemo(
    () => documents.filter((d) => d.status === "pending" || d.status === "in_review").length,
    [documents]
  );

  async function moderate(doc: AdminVerificationDoc, status: VerificationStatus) {
    setLoadingId(doc.id);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setLoadingId(null);
      return;
    }

    const rejectionNotes =
      "Your submission needs to be updated. Please resubmit from Verification Center.";

    const { data, error: rpcError } = await supabase.rpc("admin_update_verification", {
      p_document_id: doc.id,
      p_admin_id: user.id,
      p_status: status,
      p_notes: status === "verified" ? "Approved by admin" : rejectionNotes,
    });

    if (rpcError || !data) {
      setError(rpcError?.message ?? "Unable to update verification.");
      setLoadingId(null);
      return;
    }

    if (status === "rejected") {
      void fetch("/api/notifications/verification-rejected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: doc.user_id,
          userEmail: doc.user_email,
          userName: doc.user_name,
          documentType: doc.document_type,
          notes: rejectionNotes,
        }),
      });
    }

    setDocuments((prev) =>
      prev.map((row) => (row.id === doc.id ? { ...row, status } : row))
    );
    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-charcoal-light">
          {groups.length} member{groups.length !== 1 ? "s" : ""} · {pendingCount} document
          {pendingCount !== 1 ? "s" : ""} to review
        </p>
        {groups.length > 1 && (
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={expandAllUsers}
              className="text-forest hover:underline font-medium"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={() => collapseAllUsers(groups.map((g) => g.userId))}
              className="text-forest hover:underline font-medium"
            >
              Collapse all
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {groups.length === 0 ? (
        <p className="text-sm text-charcoal-light">No verification requests pending review.</p>
      ) : (
        groups.map((group) => {
          const expanded = isUserExpanded(group.userId);

          return (
          <Card key={group.userId} variant="outline" padding="md" className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => toggleUserExpanded(group.userId)}
              aria-expanded={expanded}
              className="w-full border-b border-sage-dark/20 bg-sage/30 px-4 py-4 sm:px-5 text-left hover:bg-sage/50 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  {expanded ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-forest mt-0.5" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-forest mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <span className="text-lg font-semibold text-forest">
                      {group.userName ?? "Unknown member"}
                    </span>
                    {group.userEmail && (
                      <p className="mt-1 text-sm text-charcoal-light truncate">
                        {group.userEmail}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Badge variant="warning">
                    {group.documents.length} pending document
                    {group.documents.length !== 1 ? "s" : ""}
                  </Badge>
                  <Link
                    href={`/admin/users/${group.userId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-forest hover:underline font-medium"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </button>

            {expanded && (
            <ul className="divide-y divide-sage-dark/20">
              {group.documents.map((doc) => (
                <li key={doc.id} className="px-4 py-4 sm:px-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-forest capitalize">
                      {formatDocumentType(doc.document_type)}
                    </span>
                    <Badge variant={doc.status === "in_review" ? "gold" : "warning"}>
                      {doc.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-charcoal-light">
                      Submitted {formatAdminDateTime(doc.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {doc.file_url ? (
                      <ViewVerificationDocumentButton fileUrl={doc.file_url} />
                    ) : (
                      <span className="text-sm text-charcoal-light">No file attached</span>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={loadingId === doc.id}
                      onClick={() => moderate(doc, "verified")}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingId === doc.id}
                      onClick={() => moderate(doc, "rejected")}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </Card>
          );
        })
      )}
    </div>
  );
}
