import { Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { hostListingGetToKnowPath } from "@/lib/get-to-know/paths";

interface GetToKnowButtonProps {
  listingId: string;
  hostName?: string | null;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function GetToKnowButton({
  listingId,
  hostName,
  variant = "primary",
  size = "md",
  className = "",
}: GetToKnowButtonProps) {
  const label = hostName ? `Get to Know ${hostName}` : "Get to Know";

  return (
    <ButtonLink
      href={hostListingGetToKnowPath(listingId)}
      variant={variant}
      size={size}
      className={className}
    >
      <Users className="h-4 w-4" />
      {label}
    </ButtonLink>
  );
}
