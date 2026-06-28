"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminToolbar, AdminSelect } from "@/components/admin/AdminToolbar";
import { AdminTable, AdminBadgeCell, AdminDateCell } from "@/components/admin/AdminTable";
import { AdminDeleteUserModal } from "@/components/admin/AdminDeleteUserModal";
import { Button } from "@/components/ui/Button";
import { getProfileVerificationStatusLabel } from "@/lib/verification-labels";
import type { Profile } from "@/types/database";

type AdminUserRow = Pick<
  Profile,
  | "id"
  | "full_name"
  | "email"
  | "role"
  | "verification_status"
  | "trust_score"
  | "created_at"
  | "last_login_at"
  | "last_active_at"
>;

interface AdminUsersPanelProps {
  users: AdminUserRow[];
}

export function AdminUsersPanel({ users: initial }: AdminUsersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") ?? "all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (verificationFilter !== "all" && user.verification_status !== verificationFilter) {
        return false;
      }
      if (!q) return true;
      return (
        user.email.toLowerCase().includes(q) ||
        (user.full_name?.toLowerCase().includes(q) ?? false)
      );
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "name") {
        return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email);
      }
      if (sortBy === "trust") {
        return (b.trust_score ?? 0) - (a.trust_score ?? 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "last_login") {
        return (
          new Date(b.last_login_at ?? 0).getTime() - new Date(a.last_login_at ?? 0).getTime()
        );
      }
      if (sortBy === "last_active") {
        return (
          new Date(b.last_active_at ?? 0).getTime() - new Date(a.last_active_at ?? 0).getTime()
        );
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return rows;
  }, [users, search, roleFilter, verificationFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" || roleFilter !== "all" || verificationFilter !== "all";
  const totalCount = users.length;
  const filteredCount = filtered.length;

  async function deleteUser(user: AdminUserRow) {
    setLoadingId(user.id);
    setError("");
    const supabase = createClient();
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();
    if (!adminUser) {
      setError("You must be signed in.");
      setLoadingId(null);
      return;
    }

    const { error: rpcError } = await supabase.rpc("admin_delete_user", {
      p_user_id: user.id,
      p_admin_id: adminUser.id,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoadingId(null);
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setLoadingId(null);
    setPendingDelete(null);
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
          label="Verification"
          value={verificationFilter}
          onChange={setVerificationFilter}
          options={[
            { value: "all", label: "All" },
            { value: "verified", label: "Verified" },
            { value: "pending", label: "Pending" },
            { value: "unverified", label: "Unverified" },
            { value: "rejected", label: "Incomplete" },
          ]}
        />
        <AdminSelect
          label="Sort"
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "name", label: "Name" },
            { value: "trust", label: "Trust score" },
            { value: "last_login", label: "Last login" },
            { value: "last_active", label: "Last active" },
          ]}
        />
      </AdminToolbar>

      <p className="text-sm text-charcoal-light mb-4">
        {hasActiveFilters
          ? `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()} users`
          : `${totalCount.toLocaleString()} users`}
      </p>

      {error && !pendingDelete && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <AdminTable
        wide
        rows={filtered}
        emptyMessage="No users match your filters."
        columns={[
          {
            key: "name",
            label: "Name",
            headerClassName: "w-[16%]",
            render: (r) => (
              <Link
                href={`/admin/users/${r.id}`}
                className="font-medium text-forest hover:underline"
              >
                {r.full_name ?? "—"}
              </Link>
            ),
          },
          {
            key: "email",
            label: "Email",
            headerClassName: "w-[28%]",
            render: (r) => (
              <a href={`mailto:${r.email}`} className="text-forest hover:underline">
                {r.email}
              </a>
            ),
          },
          {
            key: "role",
            label: "Role",
            headerClassName: "w-[10%]",
            render: (r) => (r.role ? <AdminBadgeCell label={r.role} /> : "—"),
          },
          {
            key: "verification",
            label: "Verification",
            headerClassName: "w-[14%]",
            render: (r) => (
              <AdminBadgeCell
                label={getProfileVerificationStatusLabel(r.verification_status)}
                variant="outline"
              />
            ),
          },
          {
            key: "trust",
            label: "Trust",
            headerClassName: "w-[8%]",
            render: (r) => r.trust_score,
          },
          {
            key: "last_login",
            label: "Last login",
            headerClassName: "w-[12%] whitespace-nowrap",
            render: (r) => <AdminDateCell value={r.last_login_at} />,
          },
          {
            key: "last_active",
            label: "Last active",
            headerClassName: "w-[12%] whitespace-nowrap",
            render: (r) => <AdminDateCell value={r.last_active_at} />,
          },
          {
            key: "joined",
            label: "Joined",
            headerClassName: "w-[12%] whitespace-nowrap",
            render: (r) => <AdminDateCell value={r.created_at} />,
          },
          {
            key: "actions",
            label: "Actions",
            headerClassName: "w-[10%] whitespace-nowrap",
            className: "whitespace-nowrap",
            render: (r) => (
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === r.id}
                onClick={() => {
                  setError("");
                  setPendingDelete(r);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ),
          },
        ]}
      />

      <AdminDeleteUserModal
        open={pendingDelete !== null}
        userName={pendingDelete?.full_name ?? null}
        userEmail={pendingDelete?.email ?? ""}
        isLoading={pendingDelete !== null && loadingId === pendingDelete.id}
        error={pendingDelete ? error : ""}
        onClose={() => {
          if (loadingId) return;
          setPendingDelete(null);
          setError("");
        }}
        onConfirm={() => {
          if (pendingDelete) void deleteUser(pendingDelete);
        }}
      />
    </>
  );
}
