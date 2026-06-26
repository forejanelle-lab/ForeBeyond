import { Shield, MapPin, CheckCircle2, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const defaultBadges = [
  { icon: Shield, label: "Verified Identity" },
  { icon: CheckCircle2, label: "Background Checked" },
  { icon: MapPin, label: "Address Verified" },
  { icon: Users, label: "Community Reviewed" },
];

interface VerificationBadgeRowProps {
  verified?: boolean;
}

export function VerificationBadgeRow({ verified = true }: VerificationBadgeRowProps) {
  if (!verified) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {defaultBadges.map(({ icon: Icon, label }) => (
        <Badge key={label} variant="outline" className="gap-1.5 py-1.5 px-3">
          <Icon className="h-3.5 w-3.5 text-forest" />
          {label}
        </Badge>
      ))}
    </div>
  );
}
