"use client";

import { useState, type ReactNode } from "react";
import {
  Calendar,
  Check,
  ClipboardCopy,
  Copy,
  Download,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { formatAdminDateTime } from "@/lib/admin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { copySocialPostCaption, downloadSocialPostImage } from "@/lib/social-media/export";
import type { SocialPost } from "@/lib/social-media/types";

interface SocialPostCardProps {
  post: SocialPost;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onApprove: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRegenerateImage: () => void;
  onRegenerateCaption: () => void;
  onRetryPublish?: () => void;
  loading?: boolean;
}

const STATUS_VARIANT: Record<SocialPost["status"], "warning" | "gold" | "success" | "outline"> = {
  draft: "warning",
  scheduled: "gold",
  published: "success",
  failed: "outline",
};

function IconAction({
  label,
  onClick,
  disabled,
  children,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors disabled:opacity-40 ${
        variant === "danger"
          ? "border-red-200/80 bg-red-50/50 text-red-600 hover:bg-red-100"
          : "border-sage-dark/15 bg-white text-charcoal-light hover:border-forest/20 hover:bg-sage/30 hover:text-forest"
      }`}
    >
      {children}
    </button>
  );
}

export function SocialPostCard({
  post,
  selected,
  onSelect,
  onApprove,
  onEdit,
  onDelete,
  onDuplicate,
  onRegenerateImage,
  onRegenerateCaption,
  onRetryPublish,
  loading = false,
}: SocialPostCardProps) {
  const [manualFeedback, setManualFeedback] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function showFeedback(message: string) {
    setManualFeedback(message);
    setTimeout(() => setManualFeedback(""), 2000);
  }

  async function handleCopyCaption() {
    try {
      await copySocialPostCaption(post);
      showFeedback("Caption copied");
    } catch {
      showFeedback("Could not copy caption");
    }
  }

  async function handleDownloadImage() {
    try {
      await downloadSocialPostImage(post);
      showFeedback("Image downloaded");
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : "Download failed");
    }
  }

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
        selected
          ? "border-forest/40 ring-2 ring-forest/15"
          : "border-sage-dark/15"
      }`}
    >
      <div className="relative aspect-[4/5] bg-gradient-to-br from-sage/40 to-sage-dark/10">
        {post.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-charcoal-light/70">
            <ImageIcon className="h-10 w-10" />
            <span className="text-xs font-medium">No image yet</span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              aria-label="Select post"
              className="h-4 w-4 rounded border-sage-dark/40 text-forest focus:ring-forest/30"
            />
          </label>
          <Badge variant={STATUS_VARIANT[post.status]} className="capitalize shadow-sm">
            {post.status}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal-light">
          {post.strategy_topic && (
            <span className="rounded-full bg-sage/40 px-2.5 py-1 font-medium text-forest">
              {post.strategy_topic}
            </span>
          )}
          {post.scheduled_at && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatAdminDateTime(post.scheduled_at)}
            </span>
          )}
        </div>

        <p className="line-clamp-4 text-sm leading-relaxed text-charcoal-light whitespace-pre-wrap">
          {post.caption}
        </p>

        {(post.hashtags ?? []).length > 0 && (
          <p className="text-xs leading-relaxed text-forest/80">
            {(post.hashtags ?? []).map((tag) => `#${tag.replace(/^#+/, "")}`).join(" ")}
          </p>
        )}

        {post.publish_error && (
          <p className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {post.publish_error}
          </p>
        )}

        <div className="rounded-xl bg-gradient-to-r from-gold/10 to-sage/20 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-forest/70">
            Manual Instagram post
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="white"
              onClick={handleDownloadImage}
              disabled={loading || !post.image_url}
              className="shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button size="sm" variant="white" onClick={handleCopyCaption} disabled={loading} className="shadow-sm">
              <ClipboardCopy className="h-3.5 w-3.5" />
              Copy caption
            </Button>
          </div>
          {manualFeedback && (
            <p className="mt-2 text-xs font-medium text-forest">{manualFeedback}</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-sage-dark/10 pt-3">
          <div className="flex flex-wrap gap-2">
            {post.status === "draft" && (
              <Button size="sm" variant="primary" onClick={onApprove} disabled={loading}>
                <Check className="h-3.5 w-3.5" />
                Approve
              </Button>
            )}
            {post.status === "failed" && onRetryPublish && (
              <Button size="sm" variant="primary" onClick={onRetryPublish} disabled={loading}>
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onEdit} disabled={loading}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>

          <div className="relative flex items-center gap-1.5">
            <IconAction label="Regenerate caption" onClick={onRegenerateCaption} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </IconAction>
            <IconAction label="Regenerate image" onClick={onRegenerateImage} disabled={loading}>
              <ImageIcon className="h-4 w-4" />
            </IconAction>
            <button
              type="button"
              aria-label="More actions"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sage-dark/15 bg-white text-charcoal-light hover:bg-sage/30 hover:text-forest"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute bottom-full right-0 z-20 mb-2 min-w-[160px] overflow-hidden rounded-xl border border-sage-dark/15 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-charcoal-light hover:bg-sage/30 hover:text-forest"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate();
                    }}
                    disabled={loading}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
