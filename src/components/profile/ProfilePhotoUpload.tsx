"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface ProfilePhotoUploadProps {
  userId: string;
  avatarUrl: string | null;
  fullName?: string | null;
  onAvatarChange?: (url: string | null) => void;
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function removeExistingAvatars(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data: existing } = await supabase.storage.from("profile-avatars").list(userId);
  if (!existing?.length) return;

  const paths = existing.map((file) => `${userId}/${file.name}`);
  if (paths.length > 0) {
    await supabase.storage.from("profile-avatars").remove(paths);
  }
}

export function ProfilePhotoUpload({
  userId,
  avatarUrl,
  fullName,
  onAvatarChange,
}: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [cacheKey, setCacheKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  async function handleFile(file: File | null) {
    if (!file) return;

    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_TYPES.has(mimeType)) {
      setError("Use a JPEG, PNG, WebP, or GIF image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB");
      return;
    }

    setUploading(true);
    setError("");
    const supabase = createClient();
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    await removeExistingAvatars(supabase, userId);

    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(path, file, {
        upsert: true,
        contentType: mimeType,
      });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("profile-avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setPreview(publicUrl);
      setCacheKey((k) => k + 1);
      onAvatarChange?.(publicUrl);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    setUploading(true);
    setError("");
    const supabase = createClient();

    await removeExistingAvatars(supabase, userId);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setPreview(null);
      onAvatarChange?.(null);
    }

    setUploading(false);
  }

  const initials = fullName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-sage shrink-0 border-2 border-sage-dark/40">
        {preview ? (
          <Image
            key={cacheKey}
            src={preview}
            alt="Profile photo"
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-charcoal-light">
            {initials ? (
              <span className="text-xl font-semibold text-forest">{initials}</span>
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {preview ? "Change photo" : "Upload photo"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-charcoal-light">JPEG, PNG, or WebP · max 5MB</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
