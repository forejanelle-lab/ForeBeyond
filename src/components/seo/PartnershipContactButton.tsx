"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ContactModal } from "@/components/support/ContactModal";
import { Button } from "@/components/ui/Button";
import { PARTNERSHIP_EMAIL } from "@/lib/email-config";

interface PartnershipContactButtonProps {
  label: string;
  size?: "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "white";
  className?: string;
}

export function PartnershipContactButton({
  label,
  size = "lg",
  variant = "white",
  className = "",
}: PartnershipContactButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {label}
        <ArrowRight className="h-4 w-4" />
      </Button>
      <ContactModal
        open={open}
        onClose={() => setOpen(false)}
        inbox="partnership"
        title="Contact Partnership Team"
        description={`Tell us about your institution, cities, and intake calendar. Messages are sent to ${PARTNERSHIP_EMAIL}.`}
      />
    </>
  );
}
