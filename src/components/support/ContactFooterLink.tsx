"use client";

import { useState } from "react";
import { ContactModal } from "@/components/support/ContactModal";

interface ContactFooterLinkProps {
  label: string;
  className?: string;
}

export function ContactFooterLink({ label, className }: ContactFooterLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {label}
      </button>
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
