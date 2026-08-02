#!/usr/bin/env node
/**
 * Backfill existing Fore Beyond profiles into Brevo (UsersSignedUp list).
 *
 * Usage: npm run brevo:backfill
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, requireEnv } from "./load-env-local.mjs";

const DEFAULT_SIGNUP_LIST_NAME = "UsersSignedUp";
const BREVO_USER_TYPE_ATTRIBUTE = "USERTYPE";

function splitName(fullName) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function userTypeLabel({ is_admin, role }) {
  if (is_admin) return "Admin";
  if (role === "host") return "Host";
  if (role === "traveler") return "Traveler";
  return "Pending";
}

function buildTags({ is_admin, role }) {
  const tags = ["fore_beyond_signup", "backfill"];
  if (is_admin) tags.push("role_admin");
  else if (role === "host") tags.push("role_host");
  else if (role === "traveler") tags.push("role_traveler");
  else tags.push("role_pending");
  return tags;
}

async function resolveSignupListId(apiKey) {
  const configured = process.env.BREVO_SIGNUP_LIST_ID?.trim();
  if (configured) {
    const ids = configured
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (ids.length > 0) return ids[0];
  }

  const listName = process.env.BREVO_SIGNUP_LIST_NAME?.trim() || DEFAULT_SIGNUP_LIST_NAME;
  const response = await fetch("https://api.brevo.com/v3/contacts/lists?limit=50&offset=0", {
    headers: { "api-key": apiKey, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Could not load Brevo lists: ${await response.text()}`);
  }

  const data = await response.json();
  const match = data.lists?.find((list) => list.name === listName);
  if (!match) {
    throw new Error(`Brevo list "${listName}" not found.`);
  }
  return match.id;
}

async function syncContact(apiKey, listId, profile) {
  const email = profile.email.trim().toLowerCase();
  const { firstName, lastName } = splitName(profile.full_name);
  const attributes = { [BREVO_USER_TYPE_ATTRIBUTE]: userTypeLabel(profile) };
  if (firstName) attributes.FIRSTNAME = firstName;
  if (lastName) attributes.LASTNAME = lastName;

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      ext_id: profile.id,
      updateEnabled: true,
      listIds: [listId],
      attributes,
      tags: buildTags(profile),
    }),
  });

  if (response.ok || response.status === 204) {
    return { ok: true };
  }

  return { ok: false, error: await response.text() };
}

async function main() {
  loadEnvLocal();
  const apiKey = requireEnv("BREVO_API_KEY");
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const listId = await resolveSignupListId(apiKey);
  console.log("Brevo list ID:", listId);

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_admin")
    .not("email", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (profiles ?? []).filter((p) => p.email?.trim());
  console.log("Syncing %d profiles to Brevo…\n", rows.length);

  let synced = 0;
  let failed = 0;

  for (const profile of rows) {
    const result = await syncContact(apiKey, listId, profile);
    const label = userTypeLabel(profile);
    if (result.ok) {
      synced += 1;
      console.log("✓ %s — %s", profile.email, label);
    } else {
      failed += 1;
      console.error("✗ %s — %s", profile.email, result.error);
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  console.log("\nDone. Synced: %d, Failed: %d", synced, failed);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
