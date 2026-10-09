"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminTable, AdminDateCell, AdminBadgeCell } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  buildShareReferralUrl,
  formatReferralAttribution,
  isValidReferralCode,
  normalizeReferralCode,
  slugifyReferralCode,
} from "@/lib/referral";
import type { ReferralLink } from "@/types/database";

interface ReferralRow extends ReferralLink {
  booking_count: number;
}

interface AdminReferralsPanelProps {
  links: ReferralRow[];
}

function ReferralUrl({ href }: { href: string }) {
  const display = href.replace(/^https:\/\//, "");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-forest hover:underline font-mono whitespace-nowrap"
    >
      <span>{display}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}

export function AdminReferralsPanel({ links: initial }: AdminReferralsPanelProps) {
  const [links, setLinks] = useState(initial);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const previewCode = codeTouched ? normalizeReferralCode(code) : slugifyReferralCode(name);
  const previewUrl = isValidReferralCode(previewCode) ? buildShareReferralUrl(previewCode) : "";

  const sorted = useMemo(
    () =>
      [...links].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [links]
  );

  async function copyLink(link: ReferralLink) {
    const url = buildShareReferralUrl(link.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      window.setTimeout(() => setCopiedId((current) => (current === link.id ? null : current)), 2000);
    } catch {
      setError("Could not copy the link. Select it and copy manually.");
    }
  }

  async function createLink(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const nextCode = normalizeReferralCode(codeTouched ? code : slugifyReferralCode(trimmedName));
    if (!trimmedName) {
      setError("Enter a partner or campaign name.");
      return;
    }
    if (!isValidReferralCode(nextCode)) {
      setError("Use 2–48 lowercase letters, numbers, and hyphens for the link code.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: insertError } = await supabase
      .from("referral_links")
      .insert({
        name: trimmedName,
        code: nextCode,
        created_by: user?.id ?? null,
      })
      .select("*")
      .single();

    if (insertError) {
      setError(
        insertError.message.toLowerCase().includes("duplicate")
          ? "That link code is already in use. Choose a different one."
          : insertError.message
      );
      setSaving(false);
      return;
    }

    const created = data as ReferralLink;
    setLinks((prev) => [{ ...created, booking_count: 0 }, ...prev]);
    const url = buildShareReferralUrl(created.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(created.id);
    } catch {
      // Copy is optional; the clickable URL is still shown in the table.
    }
    setName("");
    setCode("");
    setCodeTouched(false);
    setSaving(false);
  }

  async function toggleActive(link: ReferralRow) {
    setLoadingId(link.id);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("referral_links")
      .update({ is_active: !link.is_active })
      .eq("id", link.id);

    if (updateError) {
      setError(updateError.message);
      setLoadingId(null);
      return;
    }

    setLinks((prev) =>
      prev.map((row) => (row.id === link.id ? { ...row, is_active: !row.is_active } : row))
    );
    setLoadingId(null);
  }

  return (
    <div className="space-y-6">
      <Card variant="outline" padding="md">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-forest">Create a referral link</h2>
            <p className="text-sm text-charcoal-light mt-1">
              Creates a live Fore Beyond URL such as{" "}
              <span className="font-medium text-forest">https://forebeyond.com/r/sarah-chen</span>.
              If someone books a stay after opening it, that name appears on their admin user page.
            </p>
          </div>
        </div>

        <form onSubmit={createLink} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Sarah Chen"
            autoComplete="off"
          />
          <Input
            label="Link code"
            value={codeTouched ? code : slugifyReferralCode(name)}
            onChange={(event) => {
              setCodeTouched(true);
              setCode(event.target.value.toLowerCase());
            }}
            placeholder="sarah-chen"
            hint="Becomes https://forebeyond.com/r/your-code"
            autoComplete="off"
          />
          <Button type="submit" isLoading={saving} disabled={saving}>
            Create link
          </Button>
        </form>

        {previewUrl && (
          <p className="mt-3 text-sm text-charcoal-light">
            Live link: <ReferralUrl href={previewUrl} />
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <AdminTable
        rows={sorted}
        emptyMessage="No referral links yet. Create one above to get a shareable URL."
        columns={[
          {
            key: "name",
            label: "Name",
            render: (row) => <span className="font-medium text-forest">{row.name}</span>,
          },
          {
            key: "code",
            label: "Code",
            render: (row) => <span className="font-mono text-xs">{row.code}</span>,
          },
          {
            key: "url",
            label: "Link",
            className: "max-w-[220px] overflow-x-auto",
            render: (row) => (
              <span className="text-xs">
                <ReferralUrl href={buildShareReferralUrl(row.code)} />
              </span>
            ),
          },
          {
            key: "bookings",
            label: "Bookings",
            render: (row) => row.booking_count,
          },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <AdminBadgeCell
                label={row.is_active ? "Active" : "Inactive"}
                variant={row.is_active ? "success" : "outline"}
              />
            ),
          },
          {
            key: "created",
            label: "Created",
            render: (row) => <AdminDateCell value={row.created_at} />,
          },
          {
            key: "actions",
            label: "",
            className: "text-right",
            render: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void copyLink(row)}
                  aria-label={`Copy ${formatReferralAttribution(row)} link`}
                >
                  {copiedId === row.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedId === row.id ? "Copied" : "Copy"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loadingId === row.id}
                  onClick={() => void toggleActive(row)}
                >
                  {row.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
