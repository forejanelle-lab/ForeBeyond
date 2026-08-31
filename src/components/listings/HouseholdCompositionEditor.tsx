"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  HOUSEHOLD_AGE_GROUPS,
  HOUSEHOLD_AGE_GROUP_LABELS,
  HOUSEHOLD_GENDERS,
  HOUSEHOLD_GENDER_LABELS,
  PREFERRED_GUEST_GENDERS,
  PREFERRED_GUEST_GENDER_CHOICES,
  defaultHouseholdMemberLabel,
  type HouseholdAgeGroup,
  type HouseholdGender,
  type PreferredGuestGender,
} from "@/lib/household";

const selectClassName =
  "w-full rounded-xl border border-sage-dark bg-white px-4 py-2.5 text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20";

export interface DraftHouseholdMember {
  key: string;
  label: string;
  gender: HouseholdGender | "";
  age_group: HouseholdAgeGroup | "";
}

interface HouseholdCompositionEditorProps {
  members: DraftHouseholdMember[];
  onMembersChange: (members: DraftHouseholdMember[]) => void;
  preferredGuestGender: PreferredGuestGender;
  onPreferredGuestGenderChange: (value: PreferredGuestGender) => void;
}

export function createDraftHouseholdMember(index: number): DraftHouseholdMember {
  return {
    key:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `person-${index}-${Date.now()}`,
    label: defaultHouseholdMemberLabel(index),
    gender: "",
    age_group: "",
  };
}

export function HouseholdCompositionEditor({
  members,
  onMembersChange,
  preferredGuestGender,
  onPreferredGuestGenderChange,
}: HouseholdCompositionEditorProps) {
  function updateMember(index: number, patch: Partial<DraftHouseholdMember>) {
    onMembersChange(members.map((member, i) => (i === index ? { ...member, ...patch } : member)));
  }

  function addMember() {
    onMembersChange([...members, createDraftHouseholdMember(members.length)]);
  }

  function removeMember(index: number) {
    onMembersChange(members.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-charcoal">Household composition</p>
          <p className="text-xs text-charcoal-light mt-1">
            Who lives in your home. Names are optional — we&apos;ll use Person #1, Person #2, and so
            on unless you change them. Child is 0–18 years old.
          </p>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-charcoal-light rounded-xl border border-dashed border-sage-dark bg-sage/20 px-4 py-4">
            No household members added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <div
                key={member.key}
                className="grid grid-cols-1 sm:grid-cols-[1fr_7.5rem_7.5rem_auto] gap-2 items-end rounded-xl border border-sage-dark/40 p-3"
              >
                <Input
                  label={index === 0 ? "Name or label" : undefined}
                  value={member.label}
                  onChange={(e) => updateMember(index, { label: e.target.value })}
                  placeholder={defaultHouseholdMemberLabel(index)}
                  aria-label={`Household member ${index + 1} label`}
                />
                <div className="w-full">
                  {index === 0 && (
                    <label
                      htmlFor={`household-gender-${member.key}`}
                      className="mb-1.5 block text-sm font-medium text-charcoal"
                    >
                      Gender
                    </label>
                  )}
                  <select
                    id={`household-gender-${member.key}`}
                    value={member.gender}
                    onChange={(e) =>
                      updateMember(index, { gender: e.target.value as HouseholdGender | "" })
                    }
                    required
                    aria-label={`Household member ${index + 1} gender`}
                    className={selectClassName}
                  >
                    <option value="">Select</option>
                    {HOUSEHOLD_GENDERS.map((gender) => (
                      <option key={gender} value={gender}>
                        {HOUSEHOLD_GENDER_LABELS[gender]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  {index === 0 && (
                    <label
                      htmlFor={`household-age-${member.key}`}
                      className="mb-1.5 block text-sm font-medium text-charcoal"
                    >
                      Age
                    </label>
                  )}
                  <select
                    id={`household-age-${member.key}`}
                    value={member.age_group}
                    onChange={(e) =>
                      updateMember(index, {
                        age_group: e.target.value as HouseholdAgeGroup | "",
                      })
                    }
                    required
                    aria-label={`Household member ${index + 1} age`}
                    className={selectClassName}
                  >
                    <option value="">Select</option>
                    {HOUSEHOLD_AGE_GROUPS.map((ageGroup) => (
                      <option key={ageGroup} value={ageGroup}>
                        {ageGroup === "child"
                          ? "Child (0–18 yrs)"
                          : HOUSEHOLD_AGE_GROUP_LABELS[ageGroup]}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMember(index)}
                  aria-label={`Remove ${member.label || defaultHouseholdMemberLabel(index)}`}
                  className="justify-center sm:mb-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="secondary" size="md" onClick={addMember}>
          <Plus className="h-4 w-4" />
          Add person
        </Button>
      </div>

      <div>
        <p className="text-sm font-medium text-charcoal mb-2">
          Guest gender preference <span className="text-red-600">*</span>
        </p>
        <p className="text-xs text-charcoal-light mb-2">
          Who you prefer to host. This appears on your listing.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PREFERRED_GUEST_GENDERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPreferredGuestGenderChange(value)}
              className={`rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all ${
                preferredGuestGender === value
                  ? "border-forest bg-sage/30 text-forest"
                  : "border-sage-dark text-charcoal-light hover:border-forest/30"
              }`}
            >
              {PREFERRED_GUEST_GENDER_CHOICES[value]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
