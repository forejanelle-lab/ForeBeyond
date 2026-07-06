"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminToolbar, AdminSelect } from "@/components/admin/AdminToolbar";
import { formatAdminDate } from "@/lib/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import type { SupportRequest, SupportRequestStatus } from "@/types/database";

interface AdminSupportPanelProps {
  requests: SupportRequest[];
}

const SOURCE_LABEL: Record<SupportRequest["source"], string> = {
  member: "Member",
  partnership: "Partnership",
  contact: "Contact",
};

const SOURCE_VARIANT: Record<SupportRequest["source"], "gold" | "outline" | "default"> = {
  member: "default",
  partnership: "gold",
  contact: "outline",
};

const STATUS_VARIANT: Record<
  SupportRequestStatus,
  "warning" | "success" | "default" | "outline"
> = {
  open: "warning",
  resolved: "success",
  archived: "default",
};

function formatRequestedAt(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminSupportPanel({ requests: initial }: AdminSupportPanelProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all_closed");
  const [sortBy, setSortBy] = useState("newest");
  const [showClosed, setShowClosed] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [draftResponses, setDraftResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const openRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = requests.filter((r) => r.status === "open");
    if (q) {
      rows = rows.filter(
        (r) =>
          r.message.toLowerCase().includes(q) ||
          (r.user_full_name?.toLowerCase().includes(q) ?? false) ||
          (r.user_email?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...rows].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "name") {
        return (a.user_full_name ?? a.user_email ?? "").localeCompare(
          b.user_full_name ?? b.user_email ?? ""
        );
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [requests, search, sortBy]);

  const closedRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = requests.filter((r) => r.status === "resolved" || r.status === "archived");
    if (statusFilter === "resolved") {
      rows = rows.filter((r) => r.status === "resolved");
    } else if (statusFilter === "archived") {
      rows = rows.filter((r) => r.status === "archived");
    }
    if (q) {
      rows = rows.filter(
        (r) =>
          r.message.toLowerCase().includes(q) ||
          (r.user_full_name?.toLowerCase().includes(q) ?? false) ||
          (r.user_email?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...rows].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "name") {
        return (a.user_full_name ?? a.user_email ?? "").localeCompare(
          b.user_full_name ?? b.user_email ?? ""
        );
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [requests, search, sortBy, statusFilter]);

  async function updateRequest(
    requestId: string,
    status: SupportRequestStatus,
    adminResponse?: string
  ) {
    setLoadingId(requestId);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload: Partial<SupportRequest> = {
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id ?? null,
    };

    const response = adminResponse ?? draftResponses[requestId];
    if (response?.trim()) {
      payload.admin_response = response.trim();
    }

    const { error: updateError } = await supabase
      .from("support_requests")
      .update(payload)
      .eq("id", requestId);

    if (updateError) {
      setError(updateError.message);
      setLoadingId(null);
      return;
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              admin_response: payload.admin_response ?? r.admin_response,
              resolved_at: payload.resolved_at ?? r.resolved_at,
            }
          : r
      )
    );
    setLoadingId(null);
    router.refresh();
  }

  function renderRequestCard(request: SupportRequest, showActions: boolean) {
    return (
      <div
        key={request.id}
        className="rounded-xl border border-sage-dark/30 bg-white p-4 space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {request.user_id ? (
                <Link
                  href={`/admin/users/${request.user_id}`}
                  className="font-medium text-forest hover:underline"
                >
                  {request.user_full_name ?? "Member"}
                </Link>
              ) : (
                <span className="font-medium text-forest">
                  {request.user_full_name ?? "Guest"}
                </span>
              )}
              <Badge variant={SOURCE_VARIANT[request.source ?? "contact"]}>
                {SOURCE_LABEL[request.source ?? "contact"]}
              </Badge>
              <Badge variant={STATUS_VARIANT[request.status]}>{request.status}</Badge>
            </div>
            <p className="text-xs text-charcoal-light mt-1">{request.user_email}</p>
            <p className="text-xs text-charcoal-light mt-1">
              Requested {formatRequestedAt(request.created_at)}
            </p>
          </div>
          {request.user_id ? (
            <Link
              href={`/admin/users/${request.user_id}?message=1`}
              className="inline-flex items-center gap-1 text-sm text-forest hover:underline shrink-0"
            >
              <MessageSquare className="h-4 w-4" />
              Message user
            </Link>
          ) : null}
        </div>

        <div className="rounded-xl bg-sage/30 px-4 py-3">
          <p className="text-xs font-medium text-forest mb-1">Member message</p>
          <p className="text-sm text-charcoal-light whitespace-pre-wrap">{request.message}</p>
        </div>

        {showActions ? (
          <>
            <Textarea
              label="Admin response (optional)"
              value={draftResponses[request.id] ?? request.admin_response ?? ""}
              onChange={(e) =>
                setDraftResponses((prev) => ({ ...prev, [request.id]: e.target.value }))
              }
              placeholder="Reply to include when resolving or archiving…"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={loadingId === request.id}
                onClick={() => updateRequest(request.id, "resolved")}
              >
                <Check className="h-4 w-4" />
                Resolve
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === request.id}
                onClick={() => updateRequest(request.id, "archived")}
              >
                <Archive className="h-4 w-4" />
                Archive
              </Button>
            </div>
          </>
        ) : (
          request.admin_response && (
            <div className="rounded-xl border border-sage-dark/20 px-4 py-3">
              <p className="text-xs font-medium text-forest mb-1">Admin response</p>
              <p className="text-sm text-charcoal-light whitespace-pre-wrap">
                {request.admin_response}
              </p>
              {request.resolved_at && (
                <p className="text-xs text-charcoal-light mt-2">
                  Closed {formatAdminDate(request.resolved_at)}
                </p>
              )}
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, or message…"
      >
        <AdminSelect
          label="Closed filter"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all_closed", label: "All closed" },
            { value: "resolved", label: "Resolved only" },
            { value: "archived", label: "Archived only" },
          ]}
        />
        <AdminSelect
          label="Sort"
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "name", label: "Name" },
          ]}
        />
      </AdminToolbar>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="text-lg font-semibold text-forest mb-3">
          Open requests ({openRequests.length})
        </h2>
        {openRequests.length === 0 ? (
          <p className="text-sm text-charcoal-light">No open support requests.</p>
        ) : (
          <div className="space-y-3">{openRequests.map((r) => renderRequestCard(r, true))}</div>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowClosed((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
        >
          {showClosed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Resolved &amp; archived ({closedRequests.length})
        </button>

        {showClosed && (
          <div className="space-y-3 mt-3">
            {closedRequests.length === 0 ? (
              <p className="text-sm text-charcoal-light">No closed support requests.</p>
            ) : (
              closedRequests.map((r) => renderRequestCard(r, false))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
