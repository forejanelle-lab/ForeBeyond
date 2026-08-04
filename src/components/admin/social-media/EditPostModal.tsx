"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-sage-dark/20">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-dark/20 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-forest">Edit post</h2>
          <button type="button" onClick={onClose} className="text-charcoal-light hover:text-forest">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {imageUrl && (
            <div className="aspect-square max-w-xs rounded-xl overflow-hidden bg-sage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Post preview" className="h-full w-full object-cover" />
            </div>
          )}

          <Input label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <Textarea label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} required />
          <Input
            label="Hashtags (comma-separated, max 5)"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            hint="Example: ForeBeyond, CulturalTravel, Homestay, TravelDeeper, AuthenticTravel"
          />
          <Input
            label="Publish date & time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={loading}>Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
