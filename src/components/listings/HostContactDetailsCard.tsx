import { Mail, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ListingContactDetails } from "@/types/database";

interface HostContactDetailsCardProps {
  contact: Pick<ListingContactDetails, "contact_email" | "contact_address">;
  title?: string;
  description?: string;
}

export function HostContactDetailsCard({
  contact,
  title = "Host contact",
  description = "Your stay is confirmed. Use these details to coordinate arrival and payment with your host.",
}: HostContactDetailsCardProps) {
  const { contact_email: email, contact_address: address } = contact;
  if (!email && !address) return null;

  return (
    <Card variant="outline" padding="md" className="space-y-3">
      <h3 className="font-semibold text-forest">{title}</h3>
      {description && <p className="text-sm text-charcoal-light">{description}</p>}
      {email && (
        <div className="flex items-start gap-2 text-sm">
          <Mail className="h-4 w-4 text-forest shrink-0 mt-0.5" />
          <a href={`mailto:${email}`} className="font-medium text-forest hover:underline break-all">
            {email}
          </a>
        </div>
      )}
      {address && (
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-forest shrink-0 mt-0.5" />
          <p className="text-charcoal whitespace-pre-wrap">{address}</p>
        </div>
      )}
    </Card>
  );
}
