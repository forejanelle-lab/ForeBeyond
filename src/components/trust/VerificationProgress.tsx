import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { VERIFICATION_WORKFLOWS } from "@/lib/trust-score";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { VerificationStatus } from "@/types/database";

interface VerificationProgressProps {
  emailVerified: boolean;
  phoneVerified: boolean;
  documentStatuses: Record<string, VerificationStatus>;
}

function isVerified(
  workflowId: string,
  emailVerified: boolean,
  phoneVerified: boolean,
  documentStatuses: Record<string, VerificationStatus>
): boolean {
  if (workflowId === "email") return emailVerified;
  if (workflowId === "phone") return phoneVerified;
  const wf = VERIFICATION_WORKFLOWS.find((w) => w.id === workflowId);
  if (!wf?.documentType) return false;
  return documentStatuses[wf.documentType] === "verified";
}

function isPending(
  workflowId: string,
  documentStatuses: Record<string, VerificationStatus>
): boolean {
  const wf = VERIFICATION_WORKFLOWS.find((w) => w.id === workflowId);
  if (!wf?.documentType) return false;
  const status = documentStatuses[wf.documentType];
  return status === "pending" || status === "in_review";
}

export function VerificationProgress({
  emailVerified,
  phoneVerified,
  documentStatuses,
}: VerificationProgressProps) {
  const verified = VERIFICATION_WORKFLOWS.filter((w) =>
    isVerified(w.id, emailVerified, phoneVerified, documentStatuses)
  ).length;
  const submitted = VERIFICATION_WORKFLOWS.filter((w) => {
    if (isVerified(w.id, emailVerified, phoneVerified, documentStatuses)) return true;
    return isPending(w.id, documentStatuses);
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-light">
          {verified} of {VERIFICATION_WORKFLOWS.length} verified · {submitted} submitted
        </p>
        <Badge variant="gold">{Math.round((submitted / VERIFICATION_WORKFLOWS.length) * 100)}%</Badge>
      </div>

      <div className="space-y-3">
        {VERIFICATION_WORKFLOWS.map((workflow) => {
          const done = isVerified(workflow.id, emailVerified, phoneVerified, documentStatuses);
          const pending = isPending(workflow.id, documentStatuses);

          return (
            <Card key={workflow.id} variant="outline" padding="sm">
              <div className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-forest shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-sage-dark shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-forest text-sm">{workflow.title}</p>
                    {workflow.points > 0 && (
                      <Badge variant="outline">+{workflow.points} pts</Badge>
                    )}
                    {pending && <Badge variant="warning">Submitted</Badge>}
                    {done && <Badge variant="success">Verified</Badge>}
                  </div>
                  <p className="text-xs text-charcoal-light mt-0.5">{workflow.description}</p>
                </div>
                {!done && (
                  <Link href={workflow.href} className="shrink-0">
                    <ArrowRight className="h-4 w-4 text-forest" />
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
