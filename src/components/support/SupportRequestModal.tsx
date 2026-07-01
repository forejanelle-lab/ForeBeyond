"use client";

import { ContactModal } from "@/components/support/ContactModal";

interface SupportRequestModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  fullName: string | null;
  email: string;
}

export function SupportRequestModal(props: SupportRequestModalProps) {
  return (
    <ContactModal
      {...props}
      title="Help & Support"
      description="Tell us what you need. Our team will review your message and get back to you."
    />
  );
}
