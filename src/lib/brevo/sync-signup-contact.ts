/** Brevo contact attribute for host / traveler / admin / pending. */
export const BREVO_USER_TYPE_ATTRIBUTE = "USERTYPE";

interface SyncSignupContactInput {
  email: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  role?: "host" | "traveler" | null;
  isAdmin?: boolean;
}

export function brevoUserTypeLabel(input: Pick<SyncSignupContactInput, "isAdmin" | "role">): string {
  if (input.isAdmin) return "Admin";
  if (input.role === "host") return "Host";
  if (input.role === "traveler") return "Traveler";
  return "Pending";
}

function parseSignupListIds(): number[] {
  const raw = process.env.BREVO_SIGNUP_LIST_ID?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

const DEFAULT_SIGNUP_LIST_NAME = "UsersSignedUp";
let cachedSignupListId: number | null | undefined;

async function resolveSignupListIds(apiKey: string): Promise<number[]> {
  const fromEnv = parseSignupListIds();
  if (fromEnv.length > 0) return fromEnv;

  if (cachedSignupListId !== undefined) {
    return cachedSignupListId ? [cachedSignupListId] : [];
  }

  const listName = process.env.BREVO_SIGNUP_LIST_NAME?.trim() || DEFAULT_SIGNUP_LIST_NAME;
  const response = await fetch("https://api.brevo.com/v3/contacts/lists?limit=50&offset=0", {
    headers: {
      "api-key": apiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    cachedSignupListId = null;
    return [];
  }

  const data = (await response.json()) as { lists?: { id: number; name: string }[] };
  const match = data.lists?.find((list) => list.name === listName);
  cachedSignupListId = match?.id ?? null;
  return cachedSignupListId ? [cachedSignupListId] : [];
}

function splitName(fullName?: string | null, firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";

  if (first || last) {
    return { firstName: first, lastName: last };
  }

  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function syncSignupContactToBrevo(
  input: SyncSignupContactInput
): Promise<{ synced: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    return { synced: false, error: "BREVO_API_KEY is not configured" };
  }

  const email = input.email.trim().toLowerCase();
  const { firstName, lastName } = splitName(input.fullName, input.firstName, input.lastName);
  const listIds = await resolveSignupListIds(apiKey);

  const attributes: Record<string, string> = {
    [BREVO_USER_TYPE_ATTRIBUTE]: brevoUserTypeLabel(input),
  };
  if (firstName) attributes.FIRSTNAME = firstName;
  if (lastName) attributes.LASTNAME = lastName;

  const tags = ["fore_beyond_signup"];
  if (input.isAdmin) tags.push("role_admin");
  else if (input.role === "host") tags.push("role_host");
  else if (input.role === "traveler") tags.push("role_traveler");
  else tags.push("role_pending");

  const payload: Record<string, unknown> = {
    email,
    ext_id: input.userId,
    updateEnabled: true,
    attributes,
    tags,
  };

  if (listIds.length > 0) {
    payload.listIds = listIds;
  } else {
    return {
      synced: false,
      error: `Brevo signup list "${process.env.BREVO_SIGNUP_LIST_NAME?.trim() || DEFAULT_SIGNUP_LIST_NAME}" was not found.`,
    };
  }

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok || response.status === 204) {
    return { synced: true };
  }

  const body = await response.text();
  return { synced: false, error: body || response.statusText };
}
