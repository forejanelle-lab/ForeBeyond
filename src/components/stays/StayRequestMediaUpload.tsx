"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export interface DraftStayRequestPhoto {
  file_url: string;
  storage_path: string;
}

interface StayRequestMediaUploadProps {
  userId: string;
  photos: DraftStayRequestPhoto[];
  onPhotosChange: (photos: DraftStayRequestPhoto[]) => void;
}

export function StayRequestMediaUpload({
  userId,
  photos,
  onPhotosChange,
}: StayRequestMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const supabase = createClient();
    const nextPhotos = [...photos];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        setError("Each photo must be under 5MB");
        continue;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const storagePath = `${userId}/draft/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("stay-request-photos")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("stay-request-photos")
        .getPublicUrl(storagePath);

      nextPhotos.push({
        file_url: urlData.publicUrl,
        storage_path: storagePath,
      });
    }

    onPhotosChange(nextPhotos);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removePhoto(photo: DraftStayRequestPhoto) {
    const supabase = createClient();
    await supabase.storage.from("stay-request-photos").remove([photo.storage_path]);
    onPhotosChange(photos.filter((item) => item.storage_path !== photo.storage_path));
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.storage_path}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-sage-dark/30 bg-sage/30"
            >
              <Image
                src={photo.file_url}
                alt="Stay request photo"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 200px"
              />
              <button
                type="button"
                onClick={() => void removePhoto(photo)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : photos.length ? "Add more photos" : "Upload photos"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
