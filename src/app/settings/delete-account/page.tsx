"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [scheduled, setScheduled] = useState(false);

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      setError('Type "DELETE" to confirm');
      return;
    }

    setIsLoading(true);
    setError("");

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Deletion request failed");
      setIsLoading(false);
      return;
    }

    setScheduled(true);
    setIsLoading(false);

    const supabase = createClient();
    await supabase.auth.signOut();
    setTimeout(() => router.push("/"), 3000);
  }

  if (scheduled) {
    return (
      <Container size="sm" className="py-16 md:py-24">
        <Card variant="elevated" padding="lg" className="text-center">
          <h1 className="text-2xl font-bold text-forest">Account deletion scheduled</h1>
          <p className="mt-3 text-charcoal-light">
            Your account will be permanently deleted in 7 days. You have been signed out.
          </p>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="sm" className="py-16 md:py-24">
      <div className="mb-8">
        <Badge variant="outline" className="mb-4">
          <AlertTriangle className="h-3 w-3" />
          Delete Account
        </Badge>
        <h1 className="text-3xl font-bold text-forest">Delete your account</h1>
        <p className="mt-2 text-charcoal-light">
          This action is permanent after a 7-day grace period.
        </p>
      </div>

      <Card variant="outline" padding="lg" className="border-red-200">
        <div className="flex gap-3 mb-6 p-4 rounded-xl bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            Deleting your account removes your profile, verification data, trips, and reviews.
            This cannot be undone after the grace period.
          </p>
        </div>

        <div className="space-y-4">
          <Textarea
            label="Reason for leaving (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Help us improve..."
          />
          <Input
            label='Type "DELETE" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full !bg-red-600 hover:!bg-red-700"
            onClick={handleDelete}
            isLoading={isLoading}
          >
            <Trash2 className="h-4 w-4" />
            Request Account Deletion
          </Button>
        </div>
      </Card>
    </Container>
  );
}
