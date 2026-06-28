import {
  TRUST_SCORE_FACTORS,
  VERIFICATION_WORKFLOWS,
  getTrustScoreFactorDescription,
  type TrustScoreBreakdown,
} from "@/lib/trust-score";
import {
  getDocumentVerificationStatusLabel,
  getProfileVerificationStatusLabel,
} from "@/lib/verification-labels";
import type { DocumentType, UserRole, VerificationStatus } from "@/types/database";

export type TrustDetailItemStatus =
  | "complete"
  | "submitted"
  | "rejected"
  | "missing";

export interface TrustScoreDetailItem {
  id: string;
  label: string;
  description: string;
  points: number;
  earned: number;
  status: TrustDetailItemStatus;
}

function documentStatus(
  documentType: DocumentType | null,
  documentStatuses: Record<string, VerificationStatus>
): VerificationStatus | null {
  if (!documentType) return null;
  return documentStatuses[documentType] ?? null;
}

function mapDocumentStatus(status: VerificationStatus | null): TrustDetailItemStatus {
  if (status === "verified") return "complete";
  if (status === "rejected") return "rejected";
  if (status === "pending" || status === "in_review") return "submitted";
  return "missing";
}

export function buildTrustScoreDetailItems(input: {
  breakdown: TrustScoreBreakdown;
  emailVerified: boolean;
  phoneVerified: boolean;
  documentStatuses: Record<string, VerificationStatus>;
  role?: UserRole | null;
}): TrustScoreDetailItem[] {
  const { breakdown, emailVerified, phoneVerified, documentStatuses, role } = input;
  const items: TrustScoreDetailItem[] = [];

  for (const workflow of VERIFICATION_WORKFLOWS) {
    let status: TrustDetailItemStatus = "missing";
    let earned = 0;

    if (workflow.id === "email") {
      status = emailVerified ? "complete" : "missing";
      earned = breakdown.email_verified ?? 0;
    } else if (workflow.id === "phone") {
      status = phoneVerified ? "complete" : "missing";
      earned = breakdown.phone_verified ?? 0;
    } else if (workflow.documentType) {
      status = mapDocumentStatus(documentStatus(workflow.documentType, documentStatuses));
      if (workflow.id === "government_id") earned = breakdown.government_id ?? 0;
      if (workflow.id === "address") earned = breakdown.address_verification ?? 0;
      if (workflow.id === "video") earned = breakdown.video_verification ?? 0;
    }

    items.push({
      id: workflow.id,
      label: workflow.title,
      description: workflow.description,
      points: workflow.points,
      earned,
      status,
    });
  }

  for (const factor of TRUST_SCORE_FACTORS) {
    if (
      factor.key === "email_verified" ||
      factor.key === "phone_verified" ||
      factor.key === "government_id" ||
      factor.key === "address_verification" ||
      factor.key === "video_verification"
    ) {
      continue;
    }

    const earned = breakdown[factor.key] ?? 0;
    items.push({
      id: factor.key,
      label: factor.label,
      description: getTrustScoreFactorDescription(factor.key, role),
      points: factor.maxPoints,
      earned,
      status: earned > 0 ? "complete" : "missing",
    });
  }

  return items;
}

export function getRemainingTrustDetailItems(items: TrustScoreDetailItem[]) {
  return items.filter((item) => item.status !== "complete");
}

export function getVerificationStatusLabel(status: string) {
  return getProfileVerificationStatusLabel(status);
}

export function getTrustDetailItemStatusLabel(status: TrustDetailItemStatus) {
  if (status === "complete") return "Complete";
  if (status === "submitted") return "Submitted";
  if (status === "rejected") return getDocumentVerificationStatusLabel("rejected");
  return "Not submitted";
}
