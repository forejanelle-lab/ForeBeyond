import type { VerificationStatus } from "@/types/database";

/** Profile-level verification status shown to members and admins. */
export function getProfileVerificationStatusLabel(status: VerificationStatus | string): string {
  if (status === "verified") return "Verified";
  if (status === "rejected") return "Verification incomplete";
  if (status === "pending" || status === "in_review") return "Awaiting verification";
  if (status === "unverified") return "Not started";
  return String(status).replace(/_/g, " ");
}

/** Individual document status on verification checklist. */
export function getDocumentVerificationStatusLabel(status: VerificationStatus): string {
  if (status === "verified") return "Verified";
  if (status === "rejected") return "Needs resubmission";
  if (status === "pending") return "Submitted";
  if (status === "in_review") return "In review";
  if (status === "unverified") return "Not started";
  return String(status).replace(/_/g, " ");
}

export function formatDocumentTypeLabel(documentType: string) {
  return documentType.replace(/_/g, " ");
}
