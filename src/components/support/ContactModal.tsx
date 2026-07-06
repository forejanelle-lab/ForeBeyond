"use client";

import { useEffect, useState } from "react";
import { Mail, X } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
  fullName?: string | null;
  email?: string;
  title?: string;
  description?: string;
  inbox?: "default" | "partnership";
}

export function ContactModal({
  open,
  onClose,
  userId,
  fullName = null,
  email = "",
  title,
  description,
  inbox = "default",
}: ContactModalProps) {
  const t = useTranslations();
  const isLoggedIn = Boolean(userId);
  const [name, setName] = useState(fullName ?? "");
  const [contactEmail, setContactEmail] = useState(email);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const modalTitle = title ?? t("contact.title");
  const modalDescription = description ?? t("contact.description");

  useEffect(() => {
    if (!open) {
      setMessage("");
      setError("");
      setSuccess(false);
      return;
    }

    setName(fullName ?? "");
    setContactEmail(email);
  }, [open, fullName, email]);

  if (!open) return null;

  async function handleSubmit() {
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setError(t("contact.errorMinLength"));
      return;
    }

    if (!isLoggedIn) {
      if (!name.trim()) {
        setError(t("contact.errorNameRequired"));
        return;
      }
      if (!contactEmail.trim()) {
        setError(t("contact.errorEmailRequired"));
        return;
      }
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          name: name.trim() || undefined,
          email: contactEmail.trim() || undefined,
          inbox,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        saved?: boolean;
      };

      if (!response.ok) {
        if (payload.saved) {
          setSuccess(true);
          setIsLoading(false);
          setTimeout(() => onClose(), 1800);
          return;
        }
        setError(payload.error ?? t("contact.errorGeneric"));
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
      setTimeout(() => onClose(), 1800);
    } catch {
      setError(t("contact.errorGeneric"));
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label={t("contact.closeDialog")}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-charcoal-light hover:text-forest"
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 mb-5 pr-8">
          <div className="rounded-full bg-sage p-2 text-forest">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 id="contact-modal-title" className="text-lg font-semibold text-forest">
              {modalTitle}
            </h2>
            <p className="text-sm text-charcoal-light mt-1">{modalDescription}</p>
          </div>
        </div>

        {success ? (
          <p className="text-sm text-forest bg-sage/40 rounded-xl px-4 py-3">{t("contact.success")}</p>
        ) : (
          <>
            <div className="space-y-4">
              {isLoggedIn ? (
                <>
                  <Input label={t("contact.yourName")} value={name} readOnly disabled />
                  <Input label={t("contact.yourEmail")} value={contactEmail} readOnly disabled />
                </>
              ) : (
                <>
                  <Input
                    label={t("contact.yourName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("contact.namePlaceholder")}
                    required
                  />
                  <Input
                    label={t("contact.yourEmail")}
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t("contact.emailPlaceholder")}
                    required
                  />
                </>
              )}
              <Textarea
                label={t("contact.messageLabel")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("contact.messagePlaceholder")}
                rows={5}
                required
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
              <Button variant="ghost" size="md" onClick={onClose} className="flex-1">
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={isLoading}
                className="flex-1"
              >
                {t("contact.sendMessage")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
