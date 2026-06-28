"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ReportCategory } from "@/types/database";

interface ReportUserButtonProps {
  reportedUserId: string;
  reportedListingId?: string | null;
  reportedReviewId?: string | null;
  label?: string;
  className?: string;
}

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "fraud", label: "Fraud" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export function ReportUserButton({
  reportedUserId,
  reportedListingId = null,
  reportedReviewId = null,
  label = "Report",
  className = "",
}: ReportUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>("other");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submitReport() {
    if (description.trim().length < 10) {
      setError("Please describe the issue (at least 10 characters).");
      return;
    }

    setLoading(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sign in to submit a report.");
      setLoading(false);
      return;
    }

    if (user.id === reportedUserId) {
      setError("You cannot report yourself.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("content_reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      reported_listing_id: reportedListingId,
      reported_review_id: reportedReviewId,
      category,
      description: description.trim(),
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setDescription("");
    }, 1500);
  }

  if (open) {
    return (
      <Card variant="outline" padding="md" className={`space-y-3 ${className}`}>
        <p className="text-sm font-semibold text-forest">Report this member</p>
        {success ? (
          <p className="text-sm text-forest">Report submitted. Our team will review it.</p>
        ) : (
          <>
            <label className="block text-xs text-charcoal-light">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="mt-1 w-full rounded-xl border border-sage-dark/30 bg-white px-3 py-2 text-sm text-forest"
              >
                {CATEGORIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-charcoal-light">
              What happened?
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-sage-dark/30 bg-white px-3 py-2 text-sm text-forest resize-y"
                placeholder="Describe the issue…"
              />
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="primary" size="sm" disabled={loading} onClick={submitReport}>
                Submit report
              </Button>
              <Button variant="ghost" size="sm" disabled={loading} onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Card>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => setOpen(true)}
      className={`text-charcoal-light hover:text-forest ${className}`}
      aria-label={label}
    >
      <Flag className="h-4 w-4" />
      <span className="sr-only sm:not-sr-only sm:ml-1">{label}</span>
    </Button>
  );
}
