"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";

function firstNameInitial(firstName?: string | null): string | null {
  const letter = firstName?.trim().charAt(0);
  return letter ? letter.toUpperCase() : null;
}

interface HostAvatarProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  hostName?: string | null;
  sizeClass?: string;
  expandable?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export function HostAvatar({
  avatarUrl,
  firstName,
  hostName,
  sizeClass = "h-24 w-24 md:h-28 md:w-28",
  expandable = true,
  className = "",
  onClick,
}: HostAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const initial = firstNameInitial(firstName) ?? firstNameInitial(hostName?.split(/\s+/)[0]);
  const hasImage = Boolean(avatarUrl?.trim()) && !imageError;
  const alt = hostName ? `${hostName} — host` : "Host";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!expanded) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expanded]);

  function handleActivate(event: React.MouseEvent) {
    onClick?.(event);
    if (!expandable) return;
    event.preventDefault();
    event.stopPropagation();
    setExpanded(true);
  }

  const avatarBody = (
    <>
      {hasImage ? (
        <Image
          src={avatarUrl!}
          alt={alt}
          fill
          className="object-cover"
          sizes="112px"
          unoptimized
          onError={() => setImageError(true)}
        />
      ) : initial ? (
        <span className="flex h-full w-full items-center justify-center text-xl md:text-2xl font-semibold text-forest">
          {initial}
        </span>
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-forest">
          H
        </span>
      )}
    </>
  );

  const lightbox =
    expanded && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close photo"
              className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
              onClick={() => setExpanded(false)}
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none">
              <div className="relative pointer-events-auto max-w-sm w-full">
                <button
                  type="button"
                  aria-label="Close photo"
                  onClick={() => setExpanded(false)}
                  className="absolute -top-3 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-charcoal shadow-lg hover:bg-sage/80 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="relative aspect-square w-full max-w-[min(88vw,22rem)] mx-auto overflow-hidden rounded-full bg-sage ring-4 ring-white/90 shadow-2xl">
                  {hasImage ? (
                    <Image
                      src={avatarUrl!}
                      alt={alt}
                      fill
                      className="object-cover"
                      sizes="352px"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-6xl font-serif font-semibold text-forest">
                      {initial ?? "H"}
                    </span>
                  )}
                </div>
                {hostName && (
                  <p className="mt-4 text-center text-white text-lg font-medium">{hostName}</p>
                )}
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  if (expandable) {
    return (
      <>
        <button
          type="button"
          onClick={handleActivate}
          aria-label={hasImage ? `View ${hostName ?? "host"} photo` : `${hostName ?? "Host"} avatar`}
          className={`relative shrink-0 overflow-hidden rounded-full bg-sage ring-2 ring-sage-dark/30 transition-transform hover:scale-[1.03] hover:ring-forest/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 cursor-pointer ${sizeClass} ${className}`}
        >
          {avatarBody}
        </button>
        {lightbox}
      </>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-sage ring-2 ring-sage-dark/30 ${sizeClass} ${className}`}
    >
      {avatarBody}
    </div>
  );
}
