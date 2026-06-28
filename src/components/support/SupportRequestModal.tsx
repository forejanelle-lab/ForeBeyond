"use client";

import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface SupportRequestModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  fullName: string | null;
  email: string;
}

export function SupportRequestModal({
  open,
  onClose,
  userId,
  fullName,
  email,
}: SupportRequestModalProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMessage("");
      setError("");
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setError("Please enter at least 10 characters describing how we can help.");
      return;
    }

    setError("");
    setIsLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("support_requests").insert({
      user_id: userId,
      user_full_name: fullName?.trim() || null,
      user_email: email,
      message: trimmed,
      status: "open",
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
    setTimeout(() => onClose(), 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close support dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-request-title"
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-charcoal-light hover:text-forest"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 mb-5 pr-8">
          <div className="rounded-full bg-sage p-2 text-forest">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="support-request-title" className="text-lg font-semibold text-forest">
              Help &amp; Support
            </h2>
            <p className="text-sm text-charcoal-light mt-1">
              Tell us what you need. Our team will review your message and get back to you.
            </p>
          </div>
        </div>

        {success ? (
          <p className="text-sm text-forest bg-sage/40 rounded-xl px-4 py-3">
            Support request sent. We&apos;ll be in touch soon.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              <Input
                label="Your name"
                value={fullName ?? ""}
                readOnly
                disabled
              />
              <Textarea
                label="How can we help?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or issue…"
                rows={5}
                required
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
              <Button variant="ghost" size="md" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={isLoading}
                className="flex-1"
              >
                Send
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
