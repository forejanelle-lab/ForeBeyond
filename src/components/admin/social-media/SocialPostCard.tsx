"use client";

import {
  Calendar,
  Check,
  Copy,
  ImageIcon,
  Pencil,
  RefreshCw,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { formatAdminDateTime } from "@/lib/admin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  return (
    <Card variant="outline" padding="sm" className="overflow-hidden">
      <div className="flex gap-4">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label="Select post"
            className="h-4 w-4 rounded border-sage-dark/50 text-forest focus:ring-forest/30"
          />
        </div>

        <div className="w-36 shrink-0">
          <div className="aspect-square rounded-xl overflow-hidden bg-sage relative">
            {post.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-charcoal-light">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[post.status]} className="capitalize">
              {post.status}
            </Badge>
            {post.strategy_topic && (
              <Badge variant="outline">{post.strategy_topic}</Badge>
            )}
            {post.scheduled_at && (
              <span className="inline-flex items-center gap-1 text-xs text-charcoal-light">
                <Calendar className="h-3.5 w-3.5" />
                {formatAdminDateTime(post.scheduled_at)}
              </span>
            )}
          </div>

          <p className="text-sm text-charcoal-light line-clamp-4 whitespace-pre-wrap">{post.caption}</p>

          {post.hashtags.length > 0 && (
            <p className="text-xs text-forest">
              {post.hashtags.map((tag) => `#${tag.replace(/^#+/, "")}`).join(" ")}
            </p>
          )}

          {post.publish_error && (
            <p className="flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {post.publish_error}
            </p>
          )}

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
            <Button size="sm" variant="outline" onClick={onRegenerateCaption} disabled={loading}>
              <RefreshCw className="h-3.5 w-3.5" />
              Caption
            </Button>
            <Button size="sm" variant="outline" onClick={onRegenerateImage} disabled={loading}>
              <ImageIcon className="h-3.5 w-3.5" />
              Image
            </Button>
            <Button size="sm" variant="outline" onClick={onDuplicate} disabled={loading}>
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} disabled={loading}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
