"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { ListingPhoto } from "@/types/database";

interface PhotoUploadProps {
  listingId: string;
  userId: string;
  existingPhotos?: ListingPhoto[];
  onPhotosChange?: (photos: ListingPhoto[]) => void;
  showCoverSelection?: boolean;
}

export function PhotoUpload({
  listingId,
  userId,
  existingPhotos = [],
  onPhotosChange,
  showCoverSelection = true,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<ListingPhoto[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const supabase = createClient();
    let workingPhotos = [...photos];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        setError("Each photo must be under 5MB");
        continue;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
      const isCover = showCoverSelection && workingPhotos.length === 0;

      const { data: photo, error: insertError } = await supabase
        .from("listing_photos")
        .insert({
          listing_id: listingId,
          file_url: urlData.publicUrl,
          sort_order: workingPhotos.length,
          is_cover: isCover,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (photo) {
        workingPhotos = [...workingPhotos, photo as ListingPhoto];
      }
    }

    if (workingPhotos.length !== photos.length) {
      setPhotos(workingPhotos);
      onPhotosChange?.(workingPhotos);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removePhoto(photo: ListingPhoto) {
    const supabase = createClient();
    await supabase.from("listing_photos").delete().eq("id", photo.id);
    const next = photos.filter((p) => p.id !== photo.id);
    setPhotos(next);
    onPhotosChange?.(next);
  }

  async function setCover(photo: ListingPhoto) {
    const supabase = createClient();
    await supabase.from("listing_photos").update({ is_cover: false }).eq("listing_id", listingId);
    await supabase.from("listing_photos").update({ is_cover: true }).eq("id", photo.id);
    const next = photos.map((p) => ({ ...p, is_cover: p.id === photo.id }));
    setPhotos(next);
    onPhotosChange?.(next);
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-sage-dark rounded-2xl p-8 text-center cursor-pointer hover:border-forest/40 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-forest mx-auto mb-2" />
        <p className="text-sm font-medium text-forest">Upload family photos</p>
        <p className="text-xs text-charcoal-light mt-1">JPEG, PNG, WebP up to 5MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploading && (
        <p className="text-sm text-charcoal-light text-center">Uploading...</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-sage">
              <Image
                src={photo.file_url}
                alt={photo.caption ?? "Listing photo"}
                fill
                className="object-cover"
                sizes="200px"
              />
              {showCoverSelection && photo.is_cover && (
                <span className="absolute top-2 left-2 bg-gold text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" /> Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {showCoverSelection && !photo.is_cover && (
                  <button
                    type="button"
                    onClick={() => setCover(photo)}
                    className="p-2 bg-white rounded-full text-forest"
                    aria-label="Set as cover"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo)}
                  className="p-2 bg-white rounded-full text-red-600"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Choose Photos
        </Button>
      )}
    </div>
  );
}
