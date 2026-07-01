import type { DocumentType, VerificationStatus } from "@/types/database";

export const STAY_REQUEST_REQUIRED_DOCUMENTS = [
  "government_id",
  "selfie",
] as const satisfies readonly DocumentType[];

export type StayRequestRequiredDocument = (typeof STAY_REQUEST_REQUIRED_DOCUMENTS)[number];

export const STAY_REQUEST_VERIFICATION_MESSAGE =
  "Submit government ID and selfie verification in the Verification Center to request a stay.";

export function isVerificationDocumentSubmitted(
  status: VerificationStatus | undefined
): boolean {
  return Boolean(status && status !== "unverified" && status !== "rejected");
}

export function canRequestStay(
  documents: Partial<Record<DocumentType, VerificationStatus>>
): boolean {
  return STAY_REQUEST_REQUIRED_DOCUMENTS.every((type) =>
    isVerificationDocumentSubmitted(documents[type])
  );
}

export function documentsMapFromRows(
  rows: { document_type: DocumentType; status: VerificationStatus }[] | null | undefined
): Partial<Record<DocumentType, VerificationStatus>> {
  const map: Partial<Record<DocumentType, VerificationStatus>> = {};
  rows?.forEach((row) => {
    map[row.document_type] = row.status;
  });
  return map;
}
