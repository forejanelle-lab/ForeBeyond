"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PrivacySettings } from "@/types/database";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Partial<PrivacySettings>>({
    profile_visible: true,
    show_location: true,
    show_bio: true,
    analytics_cookies: false,
    marketing_emails: false,
    functional_cookies: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/sign-in?redirect=/settings/privacy");
        return;
      }

      const { data } = await supabase.from("privacy_settings").select("*").eq("user_id", user.id).single();

      if (data) setSettings(data as PrivacySettings);
      setIsLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    setIsSaving(true);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("privacy_settings")
      .upsert({ user_id: user.id, ...settings });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Privacy settings saved.");
    }
    setIsSaving(false);
  }

  function toggle(key: keyof PrivacySettings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  }

  return (
    <PageShell title="Privacy Settings" subtitle="Control your data and visibility">
      <Card variant="elevated" padding="lg" className="max-w-2xl space-y-6">
        <section>
          <h2 className="font-semibold text-forest mb-3">Profile Visibility</h2>
          <div className="space-y-3">
            {([
              ["profile_visible", "Show my profile to other members"],
              ["show_location", "Show my general location"],
              ["show_bio", "Show my bio"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings[key]}
                  onChange={() => toggle(key)}
                  className="rounded text-forest"
                />
                <span className="text-sm text-charcoal">{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-forest mb-3">Cookies & Communications</h2>
          <div className="space-y-3">
            {([
              ["functional_cookies", "Functional cookies (recommended)"],
              ["analytics_cookies", "Analytics cookies"],
              ["marketing_emails", "Marketing emails"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings[key]}
                  onChange={() => toggle(key)}
                  className="rounded text-forest"
                />
                <span className="text-sm text-charcoal">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {message && (
          <p
            className={`text-sm rounded-xl px-4 py-3 ${
              message.includes("saved") ? "bg-sage text-forest" : "bg-red-50 text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <Button variant="primary" size="lg" className="w-full" onClick={handleSave} isLoading={isSaving}>
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </Card>
    </PageShell>
  );
}
