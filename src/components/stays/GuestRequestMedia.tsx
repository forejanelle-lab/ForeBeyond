import Image from "next/image";
import Link from "next/link";
import { ExternalLink, User } from "lucide-react";
import {
  extractUrlsFromText,
  isLikelyImageUrl,
  parseStayRequestMessage,
} from "@/lib/stay-requests";
import { ReportUserButton } from "@/components/reports/ReportUserButton";
import { Card } from "@/components/ui/Card";
import type { StayRequestPhoto } from "@/types/database";

interface GuestRequestMediaProps {
  guestName: string;
  guestUserId: string;
  guestProfileHref?: string;
  avatarUrl: string | null;
  message: string | null;
  photos: StayRequestPhoto[];
}

function stripUrls(text: string): string {
  return text.replace(/https?:\/\/[^\s<>"']+/gi, "").trim();
}

export function GuestRequestMedia({
  guestName,
  guestUserId,
  guestProfileHref,
  avatarUrl,
  message,
  photos,
}: GuestRequestMediaProps) {
  const { mediaNote } = parseStayRequestMessage(message);
  const linkedImageUrls = extractUrlsFromText(mediaNote).filter(isLikelyImageUrl);
  const otherLinks = extractUrlsFromText(mediaNote).filter((url) => !isLikelyImageUrl(url));
  const uploadedPhotos = photos.map((photo) => photo.file_url);
  const galleryUrls = [...uploadedPhotos, ...linkedImageUrls];
  const hasProfilePhoto = Boolean(avatarUrl?.trim());
  const mediaNoteText = mediaNote ? stripUrls(mediaNote) : "";

  return (
    <Card variant="outline" padding="md" className="space-y-5">
      <h2 className="font-semibold text-forest">Guest photos</h2>

      <div className="flex items-center gap-4">
        {guestProfileHref ? (
          <Link
            href={guestProfileHref}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-sage-dark/40 bg-sage/40 hover:border-forest/50 transition-colors"
          >
            {hasProfilePhoto ? (
              <Image
                src={avatarUrl!}
                alt={`${guestName} profile`}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-charcoal-light">
                <User className="h-8 w-8" />
              </div>
            )}
          </Link>
        ) : (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-sage-dark/40 bg-sage/40">
            {hasProfilePhoto ? (
              <Image
                src={avatarUrl!}
                alt={`${guestName} profile`}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-charcoal-light">
                <User className="h-8 w-8" />
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-forest">Profile picture</p>
          <p className="text-sm text-charcoal-light">
            {guestProfileHref ? (
              <>
                <Link href={guestProfileHref} className="text-forest font-medium hover:underline">
                  {guestName}
                </Link>
                {" · "}
                <Link href={guestProfileHref} className="text-forest hover:underline">
                  View trust profile
                </Link>
              </>
            ) : hasProfilePhoto ? (
              guestName
            ) : (
              `${guestName} has not added a profile photo yet.`
            )}
          </p>
        </div>
        <ReportUserButton reportedUserId={guestUserId} label="Report guest" />
      </div>

      {galleryUrls.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-forest">Photos shared with this request</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-sage-dark/30 bg-sage/30"
              >
                <Image
                  src={url}
                  alt={`Photo from ${guestName}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 200px"
                />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-charcoal-light">No photos were uploaded with this request.</p>
      )}

      {(otherLinks.length > 0 || mediaNoteText) && (
        <div className="space-y-2 border-t border-sage-dark/30 pt-4">
          <p className="text-sm font-medium text-forest">Additional media</p>
          {mediaNoteText && (
            <p className="text-sm text-charcoal-light whitespace-pre-wrap">{mediaNoteText}</p>
          )}
          {otherLinks.length > 0 && (
            <ul className="space-y-2">
              {otherLinks.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-forest hover:underline break-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
