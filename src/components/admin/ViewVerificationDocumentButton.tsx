"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getVerificationDocumentViewUrl } from "@/lib/verification-documents";
import { Button } from "@/components/ui/Button";

interface ViewVerificationDocumentButtonProps {
  fileUrl: string;
  label?: string;
}

export function ViewVerificationDocumentButton({
  fileUrl,
  label = "View document",
}: ViewVerificationDocumentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleView() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { url, error: viewError } = await getVerificationDocumentViewUrl(supabase, fileUrl);

    if (viewError || !url) {
      setError(viewError ?? "Unable to open document.");
      setLoading(false);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    setLoading(false);
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button variant="outline" size="sm" disabled={loading} onClick={handleView}>
        <ExternalLink className="h-4 w-4" />
        {label}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
