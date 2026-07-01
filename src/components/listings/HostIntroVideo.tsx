"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useIntroVideoAudio } from "@/components/listings/IntroVideoAudioContext";

interface HostIntroVideoProps {
  src: string;
  variant?: "preview" | "player";
  listingId?: string;
  className?: string;
  containerClassName?: string;
  ariaLabel?: string;
}

export function HostIntroVideo({
  src,
  variant = "preview",
  listingId,
  className = "",
  containerClassName = "",
  ariaLabel = "Host intro video",
}: HostIntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const { unmutedId, setUnmutedId } = useIntroVideoAudio();
  const isPreview = variant === "preview";

  useEffect(() => {
    if (!listingId || !unmutedId || unmutedId === listingId) return;
    setIsMuted(true);
    if (videoRef.current) videoRef.current.muted = true;
  }, [unmutedId, listingId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncMutedState = () => setIsMuted(video.muted);
    video.addEventListener("volumechange", syncMutedState);
    return () => video.removeEventListener("volumechange", syncMutedState);
  }, []);

  function handleToggleMute(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (listingId) {
      setUnmutedId(nextMuted ? null : listingId);
    }
  }

  return (
    <div className={`relative h-full w-full ${containerClassName}`}>
      <video
        ref={videoRef}
        src={src}
        muted
        loop={isPreview}
        autoPlay={isPreview}
        playsInline
        controls={!isPreview}
        className={className}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={handleToggleMute}
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        aria-pressed={!isMuted}
        className="absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
