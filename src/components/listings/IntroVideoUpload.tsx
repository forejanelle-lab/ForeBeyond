"use client";

import { useRef, useState } from "react";
import { Upload, Video, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const MAX_DURATION_SECONDS = 30;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = "video/mp4,video/webm,video/quicktime";

interface IntroVideoUploadProps {
  listingId: string;
  userId: string;
  videoUrl?: string | null;
  onVideoChange?: (url: string | null) => void;
}

function extensionForMime(mime: string) {
  if (mime.includes("mp4") || mime.includes("quicktime")) return "mp4";
  return "webm";
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read video file"));
    };
    video.src = objectUrl;
  });
}

export function IntroVideoUpload({
  listingId,
  userId,
  videoUrl = null,
  onVideoChange,
}: IntroVideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState(videoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    setError("");

    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file (MP4, WebM, or MOV)");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Video must be under 50MB");
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_DURATION_SECONDS) {
        setError(`Intro video must be ${MAX_DURATION_SECONDS} seconds or less`);
        return;
      }
    } catch {
      setError("Could not read video file. Try a different format.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = extensionForMime(file.type);
    const path = `${userId}/${listingId}/intro-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-videos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("listing-videos").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("host_listings")
      .update({ intro_video_url: publicUrl })
      .eq("id", listingId)
      .eq("host_id", userId);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    setCurrentUrl(publicUrl);
    onVideoChange?.(publicUrl);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removeVideo() {
    setError("");
    setUploading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("host_listings")
      .update({ intro_video_url: null })
      .eq("id", listingId)
      .eq("host_id", userId);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    setCurrentUrl(null);
    onVideoChange?.(null);
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
        <p className="text-sm text-charcoal-light">
          <strong className="text-forest">Highly recommended:</strong> A short intro video helps
          travelers connect with your family before they book. When uploaded, it automatically
          becomes your listing cover in search and on your profile — no separate cover photo needed.
        </p>
      </div>

      {currentUrl ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
          <video
            src={currentUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={removeVideo}
            disabled={uploading}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm hover:bg-white transition-colors"
            aria-label="Remove intro video"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-sage-dark rounded-2xl p-8 text-center cursor-pointer hover:border-forest/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Video className="h-8 w-8 text-forest mx-auto mb-2" />
          <p className="text-sm font-medium text-forest">Upload intro video</p>
          <p className="text-xs text-charcoal-light mt-1">
            MP4, WebM, or MOV — max {MAX_DURATION_SECONDS} seconds
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {uploading && (
        <p className="text-sm text-charcoal-light text-center">Uploading video...</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      {!currentUrl && !uploading && (
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Choose Video
        </Button>
      )}
    </div>
  );
}
