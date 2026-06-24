"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { VerificationDocument, VerificationStatus } from "@/types/database";

interface AdminVerificationPanelProps {
  documents: (VerificationDocument & { user_name: string | null; user_email: string | null })[];
}

export function AdminVerificationPanel({ documents: initial }: AdminVerificationPanelProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function moderate(documentId: string, status: VerificationStatus) {
    setLoadingId(documentId);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setLoadingId(null);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("admin_update_verification", {
      p_document_id: documentId,
      p_admin_id: user.id,
      p_status: status,
      p_notes: status === "verified" ? "Approved by admin" : "Rejected by admin",
    });

    if (rpcError || !data) {
      setError(rpcError?.message ?? "Unable to update verification.");
      setLoadingId(null);
      return;
    }

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === documentId ? { ...doc, status } : doc))
    );
    setLoadingId(null);
    router.refresh();
  }

  const pending = documents.filter((d) => d.status === "pending" || d.status === "in_review");

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {pending.length === 0 ? (
        <p className="text-sm text-charcoal-light">No verification requests pending review.</p>
      ) : (
        pending.map((doc) => (
          <div
            key={doc.id}
            className="rounded-xl border border-sage-dark/30 bg-white p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-forest">{doc.user_name ?? "User"}</span>
              <Badge variant="warning">{doc.status}</Badge>
              <Badge variant="outline">{doc.document_type.replace(/_/g, " ")}</Badge>
            </div>
            <p className="text-xs text-charcoal-light">{doc.user_email}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={loadingId === doc.id}
                onClick={() => moderate(doc.id, "verified")}
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === doc.id}
                onClick={() => moderate(doc.id, "rejected")}
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
