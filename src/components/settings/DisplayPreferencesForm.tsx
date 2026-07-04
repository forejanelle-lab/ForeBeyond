"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/components/i18n/CurrencyProvider";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { SUPPORTED_CURRENCIES, normalizeCurrencyCode } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface DisplayPreferencesFormProps {
  userId: string;
  initialCurrency: string;
}

export function DisplayPreferencesForm({ userId, initialCurrency }: DisplayPreferencesFormProps) {
  const router = useRouter();
  const { setDisplayCurrency } = useCurrency();
  const t = useTranslations();
  const [currency, setCurrency] = useState(normalizeCurrencyCode(initialCurrency));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ default_currency: currency })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setDisplayCurrency(currency);
    setSuccess(t("settings.saved"));
    setIsLoading(false);
    router.refresh();
  }

  return (
    <Card variant="outline" padding="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-forest">{t("settings.displayCurrency")}</h2>
          <p className="text-sm text-charcoal-light mt-1">{t("settings.displayCurrencyDesc")}</p>
        </div>

        <div>
          <label htmlFor="default_currency" className="block text-sm font-medium text-forest mb-1.5">
            {t("settings.preferredCurrency")}
          </label>
          <select
            id="default_currency"
            value={currency}
            onChange={(e) => setCurrency(normalizeCurrencyCode(e.target.value))}
            className="w-full rounded-xl border border-sage-dark bg-white px-4 py-2.5 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
          >
            {SUPPORTED_CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label} ({item.code})
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-forest">{success}</p>}

        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          {t("common.save")}
        </Button>
      </form>
    </Card>
  );
}
