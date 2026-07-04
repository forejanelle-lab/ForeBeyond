"use client";

import { ContactModal } from "@/components/support/ContactModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface SupportRequestModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  fullName: string | null;
  email: string;
}

export function SupportRequestModal(props: SupportRequestModalProps) {
  const t = useTranslations();

  return (
    <ContactModal
      {...props}
      title={t("contact.supportTitle")}
      description={t("contact.supportDescription")}
    />
  );
}
