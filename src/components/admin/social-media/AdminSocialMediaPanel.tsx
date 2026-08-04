"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2, Check, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EditPostModal } from "@/components/admin/social-media/EditPostModal";
import { GenerateContentModal } from "@/components/admin/social-media/GenerateContentModal";
import { SocialPostCard } from "@/components/admin/social-media/SocialPostCard";
import type {
  GenerateSocialContentInput,
  SocialPost,
  SocialPostStatus,
} from "@/lib/social-media/types";

type TabId = "drafts" | "scheduled" | "published";

interface AdminSocialMediaPanelProps {
  posts: SocialPost[];
}

const TABS: { id: TabId; label: string; statuses: SocialPostStatus[] }[] = [
  { id: "drafts", label: "Drafts", statuses: ["draft", "failed"] },
  { id: "scheduled", label: "Scheduled", statuses: ["scheduled"] },
  { id: "published", label: "Published", statuses: ["published"] },
];

export function AdminSocialMediaPanel({ posts: initial }: AdminSocialMediaPanelProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initial);
  const [tab, setTab] = useState<TabId>("drafts");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGenerate, setShowGenerate] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkScheduleAt, setBulkScheduleAt] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    const statuses = TABS.find((t) => t.id === tab)?.statuses ?? [];
    return posts
      .filter((post) => statuses.includes(post.status))
      .sort((a, b) => {
        const aTime = a.scheduled_at ?? a.created_at;
        const bTime = b.scheduled_at ?? b.created_at;
        return new Date(aTime).getTime() - new Date(bTime).getTime();
      });
  }, [posts, tab]);

  const selectedInView = filtered.filter((post) => selectedIds.has(post.id));

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function refreshPosts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as SocialPost[]);
    router.refresh();
  }

  async function handleGenerate(input: GenerateSocialContentInput) {
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/admin/social-media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { error?: string; posts?: SocialPost[] };
      if (!response.ok) {
        throw new Error(payload.error ?? "Generation failed.");
      }
      if (payload.posts?.length) {
        setPosts((prev) => [...payload.posts!, ...prev]);
      } else {
        await refreshPosts();
      }
      setTab("drafts");
    } finally {
      setGenerating(false);
    }
  }

  async function updatePost(postId: string, updates: Partial<SocialPost>) {
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("social_posts")
      .update(updates)
      .eq("id", postId)
      .select("*")
      .single();
    if (updateError) throw new Error(updateError.message);
    setPosts((prev) => prev.map((p) => (p.id === postId ? (data as SocialPost) : p)));
  }

  async function approvePost(postId: string) {
    setLoadingId(postId);
    setError("");
    const supabase = createClient();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const { data, error: updateError } = await supabase
      .from("social_posts")
      .update({
        approved: true,
        status: "scheduled",
        scheduled_at: post.scheduled_at ?? new Date().toISOString(),
        publish_error: null,
      })
      .eq("id", postId)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
    } else {
      setPosts((prev) => prev.map((p) => (p.id === postId ? (data as SocialPost) : p)));
      setTab("scheduled");
    }
    setLoadingId(null);
  }

  async function deletePost(postId: string) {
    setLoadingId(postId);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("social_posts").delete().eq("id", postId);
    if (deleteError) setError(deleteError.message);
    else setPosts((prev) => prev.filter((p) => p.id !== postId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
    setLoadingId(null);
  }

  async function duplicatePost(post: SocialPost) {
    setLoadingId(post.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error: insertError } = await supabase
      .from("social_posts")
      .insert({
        platform: post.platform,
        image_url: post.image_url,
        image_prompt: post.image_prompt,
        caption: post.caption,
        hashtags: post.hashtags,
        theme: post.theme,
        goal: post.goal,
        tone: post.tone,
        strategy_week: post.strategy_week,
        strategy_topic: post.strategy_topic,
        scheduled_at: post.scheduled_at,
        status: "draft",
        approved: false,
        created_by: user?.id ?? null,
      })
      .select("*")
      .single();

    if (insertError) setError(insertError.message);
    else if (data) setPosts((prev) => [data as SocialPost, ...prev]);
    setLoadingId(null);
  }

  async function regenerateImage(postId: string) {
    setLoadingId(postId);
    setError("");
    const response = await fetch("/api/admin/social-media/regenerate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const payload = (await response.json()) as { error?: string; post?: SocialPost };
    if (!response.ok || !payload.post) {
      setError(payload.error ?? "Image regeneration failed.");
    } else {
      setPosts((prev) => prev.map((p) => (p.id === postId ? payload.post! : p)));
    }
    setLoadingId(null);
  }

  async function regenerateCaption(postId: string) {
    setLoadingId(postId);
    setError("");
    const response = await fetch("/api/admin/social-media/regenerate-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const payload = (await response.json()) as { error?: string; post?: SocialPost };
    if (!response.ok || !payload.post) {
      setError(payload.error ?? "Caption regeneration failed.");
    } else {
      setPosts((prev) => prev.map((p) => (p.id === postId ? payload.post! : p)));
    }
    setLoadingId(null);
  }

  async function retryPublish(postId: string) {
    setLoadingId(postId);
    setError("");
    const response = await fetch("/api/admin/social-media/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const payload = (await response.json()) as { error?: string; post?: SocialPost };
    if (!response.ok || !payload.post) {
      setError(payload.error ?? "Publish failed.");
    } else {
      setPosts((prev) => prev.map((p) => (p.id === postId ? payload.post! : p)));
      if (payload.post.status === "published") setTab("published");
    }
    setLoadingId(null);
  }

  async function bulkApprove() {
    setBulkLoading(true);
    setError("");
    for (const post of selectedInView) {
      if (post.status === "draft" || post.status === "failed") {
        await approvePost(post.id);
      }
    }
    setBulkLoading(false);
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    setBulkLoading(true);
    for (const post of selectedInView) {
      await deletePost(post.id);
    }
    setBulkLoading(false);
    setSelectedIds(new Set());
  }

  async function bulkReschedule() {
    if (!bulkScheduleAt) {
      setError("Choose a date and time for bulk reschedule.");
      return;
    }
    setBulkLoading(true);
    setError("");
    const iso = new Date(bulkScheduleAt).toISOString();
    for (const post of selectedInView) {
      await updatePost(post.id, { scheduled_at: iso });
    }
    setBulkLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.id
                  ? "bg-forest text-white"
                  : "bg-white border border-sage-dark/30 text-charcoal-light hover:text-forest"
              }`}
            >
              {item.label}
              <span className="ml-2 opacity-70">
                {posts.filter((p) => item.statuses.includes(p.status)).length}
              </span>
            </button>
          ))}
        </div>

        <Button variant="primary" onClick={() => setShowGenerate(true)} disabled={generating}>
          <Sparkles className="h-4 w-4" />
          Generate Monthly Content
        </Button>
      </div>

      {selectedInView.length > 0 && (
        <div className="rounded-xl border border-sage-dark/30 bg-white p-4 flex flex-col lg:flex-row lg:items-end gap-4">
          <p className="text-sm text-forest font-medium">{selectedInView.length} selected</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={bulkApprove} disabled={bulkLoading}>
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={bulkDelete} disabled={bulkLoading}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
            <Input
              type="datetime-local"
              value={bulkScheduleAt}
              onChange={(e) => setBulkScheduleAt(e.target.value)}
              className="min-w-[220px]"
            />
            <Button size="sm" variant="outline" onClick={bulkReschedule} disabled={bulkLoading}>
              <CalendarClock className="h-4 w-4" />
              Reschedule
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {generating && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-forest">
          Generating your monthly content strategy, captions, and images. This may take a few minutes…
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-dark/40 bg-white/60 px-6 py-16 text-center">
          <p className="text-charcoal-light">
            No {tab} posts yet. Generate a month of premium Instagram content to get started.
          </p>
          <Button className="mt-4" variant="primary" onClick={() => setShowGenerate(true)}>
            <Sparkles className="h-4 w-4" />
            Generate Monthly Content
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              selected={selectedIds.has(post.id)}
              onSelect={(checked) => toggleSelect(post.id, checked)}
              onApprove={() => approvePost(post.id)}
              onEdit={() => setEditingPost(post)}
              onDelete={() => deletePost(post.id)}
              onDuplicate={() => duplicatePost(post)}
              onRegenerateImage={() => regenerateImage(post.id)}
              onRegenerateCaption={() => regenerateCaption(post.id)}
              onRetryPublish={
                post.status === "failed" ? () => retryPublish(post.id) : undefined
              }
              loading={loadingId === post.id || bulkLoading}
            />
          ))}
        </div>
      )}

      <GenerateContentModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onGenerate={handleGenerate}
      />

      <EditPostModal
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={(updates) => updatePost(editingPost!.id, updates)}
      />
    </div>
  );
}
