"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { HostSignalLibraryEntry } from "@/lib/host-finder/types";

interface HostSignalLibraryPanelProps {
  signals: HostSignalLibraryEntry[];
}

export function HostSignalLibraryPanel({ signals: initialSignals }: HostSignalLibraryPanelProps) {
  const [signals] = useState(initialSignals);

  const highIntent = signals.filter((s) => s.intent_level === "high");
  const mediumIntent = signals.filter((s) => s.intent_level === "medium");

  return (
    <div className="space-y-6">
      <Card variant="outline" padding="md">
        <p className="text-sm text-charcoal-light">
          Host Finder uses these behavioral signals to search for people with demonstrated
          interest in hosting and cultural exchange. The AI also understands semantic equivalents
          — exact phrase matches are not required.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="outline" padding="md">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-forest">High intent</h3>
            <Badge variant="success">{highIntent.length}</Badge>
          </div>
          <ul className="space-y-2">
            {highIntent.map((signal) => (
              <li
                key={signal.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-sage-dark/20 last:border-0"
              >
                <span className="text-charcoal">&ldquo;{signal.phrase}&rdquo;</span>
                {!signal.active && <Badge variant="outline">Inactive</Badge>}
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="outline" padding="md">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-forest">Medium intent</h3>
            <Badge variant="warning">{mediumIntent.length}</Badge>
          </div>
          <ul className="space-y-2">
            {mediumIntent.map((signal) => (
              <li
                key={signal.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-sage-dark/20 last:border-0"
              >
                <span className="text-charcoal">&ldquo;{signal.phrase}&rdquo;</span>
                {!signal.active && <Badge variant="outline">Inactive</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
