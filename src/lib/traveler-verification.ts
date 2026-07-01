import type { DocumentType, UserRole, VerificationStatus } from "@/types/database";

export const STAY_REQUEST_REQUIRED_DOCUMENTS = [
  "government_id",
  "selfie",
] as const satisfies readonly DocumentType[];

export type StayRequestRequiredDocument = (typeof STAY_REQUEST_REQUIRED_DOCUMENTS)[number];

export const STAY_REQUEST_VERIFICATION_MESSAGE =
  "Submit government ID and selfie verification in the Verification Center to request a stay.";

export const TRAVELER_ACCOUNT_REQUIRED_MESSAGE =
  "Please create a traveler account to request a stay.";

export const TRAVELER_ACCOUNT_SEARCH_MESSAGE =
  "Please create a traveler account to search families.";

export interface RequestStayEligibility {
  canRequest: boolean;
  disabledReason: string;
}

export const HOST_LISTING_VERIFICATION_MESSAGE =
  "Submit government ID and selfie verification in the Verification Center to create a listing.";

export interface HostListingEligibility {
  canCreate: boolean;
  disabledReason: string;
}

export function canCreateHostListing(
  documents: Partial<Record<DocumentType, VerificationStatus>>
): boolean {
  return canRequestStay(documents);
}

export function getHostListingEligibility(
  documents: Partial<Record<DocumentType, VerificationStatus>>
): HostListingEligibility {
  if (canCreateHostListing(documents)) {
    return { canCreate: true, disabledReason: "" };
  }

  return {
    canCreate: false,
    disabledReason: HOST_LISTING_VERIFICATION_MESSAGE,
  };
}

export function getRequestStayEligibility(
  role: UserRole | null | undefined,
  documents: Partial<Record<DocumentType, VerificationStatus>>
): RequestStayEligibility {
  if (role === "host") {
    return {
      canRequest: false,
      disabledReason: TRAVELER_ACCOUNT_REQUIRED_MESSAGE,
    };
  }

  if (canRequestStay(documents)) {
    return { canRequest: true, disabledReason: "" };
  }

  return {
    canRequest: false,
    disabledReason: STAY_REQUEST_VERIFICATION_MESSAGE,
  };
}

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
