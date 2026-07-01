"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 1024;

function guessMimeFromName(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return null;
  }
}

function mimeToExtension(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  return mimeType.split("/")[1] ?? "jpg";
}

function withAvatarCacheBuster(url: string): string {
  const base = url.split("?")[0] ?? url;
  return `${base}?v=${Date.now()}`;
}

async function prepareProfilePhotoFile(
  file: File
): Promise<{ file: File; mimeType: string; ext: string } | { error: string }> {
  const guessedMime = (file.type || guessMimeFromName(file.name) || "").toLowerCase();

  if (guessedMime && ALLOWED_TYPES.has(guessedMime)) {
    return {
      file,
      mimeType: guessedMime,
      ext: mimeToExtension(guessedMime),
    };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return { error: "Could not process this image. Try a JPEG or PNG." };
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!blob) {
      return { error: "Could not process this image. Try a JPEG or PNG." };
    }

    return {
      file: new File([blob], "avatar.jpg", { type: "image/jpeg" }),
      mimeType: "image/jpeg",
      ext: "jpg",
    };
  } catch {
    return {
      error: "This image could not be uploaded. Use JPEG, PNG, WebP, or GIF.",
    };
  }
}

async function removeExistingAvatars(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data: existing, error: listError } = await supabase.storage
    .from("profile-avatars")
    .list(userId);

  if (listError) {
    return listError.message;
  }

  if (!existing?.length) {
    return null;
  }

  const paths = existing.map((file) => `${userId}/${file.name}`);
  const { error: removeError } = await supabase.storage.from("profile-avatars").remove(paths);
  return removeError?.message ?? null;
}

export function ProfilePhotoUpload({
  userId,
  avatarUrl,
  fullName,
  onAvatarChange,
}: ProfilePhotoUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  async function handleFile(file: File | null) {
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setError("Photo must be under 5MB");
      return;
    }

    const prepared = await prepareProfilePhotoFile(file);
    if ("error" in prepared) {
      setError(prepared.error);
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const path = `${userId}/avatar-${Date.now()}.${prepared.ext}`;

    const removeError = await removeExistingAvatars(supabase, userId);
    if (removeError) {
      setError(removeError);
      setUploading(false);
      return;
    }

    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(path, prepared.file, {
        cacheControl: "3600",
        contentType: prepared.mimeType,
        upsert: false,
      });

    if (uploadError) {
      const message =
        uploadError.message.includes("Bucket not found") ||
        uploadError.message.includes("profile-avatars")
          ? "Profile photo storage is not set up yet. Please contact support."
          : uploadError.message;
      setError(message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("profile-avatars").getPublicUrl(path);
    const publicUrl = withAvatarCacheBuster(urlData.publicUrl);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    setPreview(publicUrl);
    onAvatarChange?.(publicUrl);
    setSuccess("Profile photo updated.");
    router.refresh();
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    setUploading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const removeError = await removeExistingAvatars(supabase, userId);
    if (removeError) {
      setError(removeError);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    setPreview(null);
    onAvatarChange?.(null);
    setSuccess("Profile photo removed.");
    router.refresh();
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
            key={preview}
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
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
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
        <p className="text-xs text-charcoal-light">JPEG, PNG, WebP, or HEIC · max 5MB</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-forest">{success}</p>}
      </div>
    </div>
  );
}
