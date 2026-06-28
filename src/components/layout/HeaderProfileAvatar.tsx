import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";

interface HeaderProfileAvatarProps {
  avatarUrl: string | null;
  fullName?: string | null;
}

export function HeaderProfileAvatar({ avatarUrl, fullName }: HeaderProfileAvatarProps) {
  const initials = fullName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href="/settings"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden border border-sage-dark/40 bg-sage hover:ring-2 hover:ring-forest/20 transition-shadow"
      aria-label="Settings"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={36}
          height={36}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : initials ? (
        <span className="text-xs font-semibold text-forest">{initials}</span>
      ) : (
        <User className="h-4 w-4 text-forest" />
      )}
    </Link>
  );
}
