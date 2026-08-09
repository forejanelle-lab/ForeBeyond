"use client";

import { useEffect, useState } from "react";
import { ClipboardCopy, Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { copySocialPostCaption, downloadSocialPostImage } from "@/lib/social-media/export";
import type { SocialPost } from "@/lib/social-media/types";

interface EditPostModalProps {
  post: SocialPost | null;
  onClose: () => void;
  onSave: (updates: Partial<SocialPost>) => Promise<void>;
}

export function EditPostModal({ post, onClose, onSave }: EditPostModalProps) {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualFeedback, setManualFeedback] = useState("");

  useEffect(() => {
    if (!post) return;
    setCaption(post.caption);
    setHashtags(post.hashtags.join(", "));
    setScheduledAt(post.scheduled_at ? post.scheduled_at.slice(0, 16) : "");
    setImageUrl(post.image_url ?? "");
    setError("");
  }, [post]);

  if (!post) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave({
        caption: caption.trim(),
        hashtags: hashtags
          .split(",")
          .map((tag) => tag.trim().replace(/^#+/, ""))
          .filter(Boolean)
          .slice(0, 5),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        image_url: imageUrl.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCaption() {
    if (!post) return;
    try {
      await copySocialPostCaption({
        caption,
        hashtags: hashtags
          .split(",")
          .map((tag) => tag.trim().replace(/^#+/, ""))
          .filter(Boolean),
      });
      setManualFeedback("Caption copied");
      setTimeout(() => setManualFeedback(""), 2000);
    } catch {
      setManualFeedback("Could not copy caption");
      setTimeout(() => setManualFeedback(""), 2000);
    }
  }

  async function handleDownloadImage() {
    if (!post) return;
    try {
      await downloadSocialPostImage({ id: post.id, image_url: imageUrl.trim() || null });
      setManualFeedback("Image downloaded");
      setTimeout(() => setManualFeedback(""), 2000);
    } catch (err) {
      setManualFeedback(err instanceof Error ? err.message : "Download failed");
      setTimeout(() => setManualFeedback(""), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-sage-dark/15 bg-white shadow-2xl"
      >
        <div className="hidden w-[42%] shrink-0 flex-col border-r border-sage-dark/10 bg-gradient-to-b from-sage/30 to-sage/10 md:flex">
          <div className="flex flex-1 items-center justify-center p-6">
            {imageUrl ? (
              <div className="aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Post preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex aspect-[4/5] w-full max-w-sm items-center justify-center rounded-2xl border border-dashed border-sage-dark/25 bg-white/60 text-sm text-charcoal-light">
                No image preview
              </div>
            )}
          </div>
          <div className="border-t border-sage-dark/10 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest/70">
              Manual Instagram post
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDownloadImage}
                disabled={!imageUrl.trim()}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleCopyCaption}>
                <ClipboardCopy className="h-3.5 w-3.5" />
                Copy caption
              </Button>
            </div>
            {manualFeedback && (
              <p className="mt-2 text-xs font-medium text-forest">{manualFeedback}</p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-sage-dark/10 px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">Edit post</p>
              <h2 className="font-serif text-xl text-forest">{post.strategy_topic ?? "Instagram post"}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-charcoal-light hover:bg-sage/40 hover:text-forest"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6">
            <div className="space-y-4">
              <Input label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <Textarea
                label="Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
                className="min-h-[160px]"
              />
              <Input
                label="Hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                hint="Comma-separated, max 5 — e.g. ForeBeyond, CulturalTravel, Homestay"
              />
              <Input
                label="Publish date & time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />

              <div className="rounded-xl border border-sage-dark/15 bg-sage/10 p-4 md:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-forest/70">
                  Manual Instagram post
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadImage}
                    disabled={!imageUrl.trim()}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleCopyCaption}>
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Copy caption
                  </Button>
                </div>
                {manualFeedback && (
                  <p className="mt-2 text-xs font-medium text-forest">{manualFeedback}</p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-sage-dark/10 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Save changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
