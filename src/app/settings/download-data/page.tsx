"use client";

import { useState } from "react";
import { Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

export default function DownloadDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleExport() {
    setIsLoading(true);
    setMessage("");
    setDownloadUrl(null);

    const res = await fetch("/api/account/export", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Export failed");
      setIsLoading(false);
      return;
    }

    setMessage("Your data export is ready.");
    setDownloadUrl(data.downloadUrl);
    setIsLoading(false);
  }

  return (
    <Container size="sm" className="py-16 md:py-24">
      <div className="mb-8">
        <Badge variant="gold" className="mb-4">
          <Shield className="h-3 w-3" />
          Download My Data
        </Badge>
        <h1 className="text-3xl font-bold text-forest">Export your data</h1>
        <p className="mt-2 text-charcoal-light">
          Download a copy of your profile, verification status, trips, and reviews.
        </p>
      </div>

      <Card variant="elevated" padding="lg">
        <p className="text-sm text-charcoal-light mb-6">
          Under GDPR and similar privacy laws, you have the right to access your personal data.
          Your export includes all information stored in your {`Fore Beyond`} account.
        </p>

        <Button variant="primary" size="lg" className="w-full" onClick={handleExport} isLoading={isLoading}>
          <Download className="h-4 w-4" />
          Request Data Export
        </Button>

        {message && (
          <p className="mt-4 text-sm bg-sage text-forest rounded-lg px-4 py-3">{message}</p>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            download="fore-beyond-data.json"
            className="mt-4 block text-center text-sm text-forest font-medium underline"
          >
            Download fore-beyond-data.json
          </a>
        )}
      </Card>
    </Container>
  );
}
