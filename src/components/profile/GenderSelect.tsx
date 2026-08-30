"use client";

import { PROFILE_GENDERS, type ProfileGender, getGenderLabelKey } from "@/lib/gender";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface GenderSelectProps {
  value: ProfileGender | "";
  onChange: (value: ProfileGender | "") => void;
  label?: string;
  required?: boolean;
  error?: string;
  id?: string;
}

export function GenderSelect({
  value,
  onChange,
  label,
  required = false,
  error,
  id = "gender",
}: GenderSelectProps) {
  const t = useTranslations();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
          {label}
          {required ? " *" : ""}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as ProfileGender | "")}
        required={required}
        className={`w-full rounded-xl border border-sage-dark bg-white px-4 py-2.5 text-charcoal transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""
        }`}
      >
        <option value="">{t("common.genderSelect")}</option>
        {PROFILE_GENDERS.map((gender) => (
          <option key={gender} value={gender}>
            {t(getGenderLabelKey(gender))}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
