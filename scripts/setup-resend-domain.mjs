#!/usr/bin/env node
/**
 * Add forebeyond.com to Resend (if needed), print DNS records, and trigger verification.
 *
 * Requires RESEND_API_KEY in .env.local or the environment.
 */
import { loadEnvLocal, requireEnv } from "./load-env-local.mjs";

const DOMAIN = "forebeyond.com";

async function resendRequest(apiKey, method, path, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String(data.message)
        : text || res.statusText;
    throw new Error(`Resend API ${method} ${path} failed (${res.status}): ${message}`);
  }

  return data;
}

function printDnsRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    console.log("  (no DNS records returned — check https://resend.com/domains)");
    return;
  }

  console.log("\nAdd these DNS records at your domain registrar:\n");
  console.log("Type     Name                                      Value");
  console.log("------   ----------------------------------------  ----------------------------------------");

  for (const record of records) {
    const type = String(record.type ?? "").padEnd(8);
    const name = String(record.name ?? record.host ?? "").padEnd(42);
    const value = String(record.value ?? record.data ?? "");
    const priority = record.priority != null ? ` (priority ${record.priority})` : "";
    console.log(`${type} ${name} ${value}${priority}`);
    if (record.status) {
      console.log(`         status: ${record.status}`);
    }
  }
}

async function getOrCreateDomain(apiKey) {
  const list = await resendRequest(apiKey, "GET", "/domains");
  const domains = list?.data ?? [];
  const existing = domains.find((entry) => entry.name === DOMAIN);

  if (existing) {
    console.log(`Domain already in Resend: ${DOMAIN} (${existing.status})`);
    const detail = await resendRequest(apiKey, "GET", `/domains/${existing.id}`);
    return detail;
  }

  if (domains.length > 0) {
    console.log("Resend domain limit reached on this account. Current domains:");
    for (const entry of domains) {
      console.log(`  - ${entry.name} (${entry.status})`);
    }
    console.log(
      `\nRemove an unused domain at https://resend.com/domains or upgrade your plan, then add ${DOMAIN}.`
    );
    process.exit(1);
  }

  console.log(`Creating domain in Resend: ${DOMAIN}`);
  return resendRequest(apiKey, "POST", "/domains", { name: DOMAIN });
}

async function main() {
  loadEnvLocal();
  const apiKey = requireEnv("RESEND_API_KEY");

  const domain = await getOrCreateDomain(apiKey);
  printDnsRecords(domain.records);

  console.log("\nTriggering DNS verification check...");
  try {
    await resendRequest(apiKey, "POST", `/domains/${domain.id}/verify`);
  } catch (error) {
    console.warn(
      error instanceof Error ? error.message : "Verification check could not be triggered yet."
    );
  }

  const refreshed = await resendRequest(apiKey, "GET", `/domains/${domain.id}`);
  console.log(`\nDomain status: ${refreshed.status}`);

  if (refreshed.status === "verified") {
    console.log("forebeyond.com is verified. You can send from hello@forebeyond.com.");
    return;
  }

  console.log("\nDNS verification is still pending.");
  console.log("After adding the records above, wait a few minutes and re-run:");
  console.log("  npm run resend:domain");
  console.log("\nResend dashboard: https://resend.com/domains");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
