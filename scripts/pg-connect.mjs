import pg from "pg";
import dns from "dns/promises";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

function resolveDatabaseUrl() {
  const existing = process.env.DATABASE_URL?.trim();
  if (existing) return existing;

  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() || process.env.DATABASE_PASSWORD?.trim();
  if (!password) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
  const ref = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) return null;

  const host = process.env.DATABASE_HOST?.trim() || "aws-1-us-east-1.pooler.supabase.com";
  const user = process.env.DATABASE_USER?.trim() || `postgres.${ref}`;
  const port = process.env.DATABASE_PORT?.trim() || "5432";

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
}

function getConfig() {
  const resolvedUrl = resolveDatabaseUrl();
  if (resolvedUrl && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = resolvedUrl;
  }

  if (process.env.DATABASE_HOST) {
    return {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || "5432", 10),
      user: process.env.DATABASE_USER || "postgres",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "postgres",
    };
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Set DATABASE_URL, SUPABASE_DB_PASSWORD, or DATABASE_HOST/USER/PASSWORD in .env.local"
    );
  }

  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: parseInt(url.port || "5432", 10),
    user: decodeURIComponent(url.username),
    password: process.env.DATABASE_PASSWORD || decodeURIComponent(url.password),
    database: url.pathname.slice(1) || "postgres",
  };
}

async function resolveHosts(hostname) {
  const hosts = [hostname];
  try {
    hosts.push(...(await dns.resolve4(hostname)));
  } catch {}
  try {
    hosts.push(...(await dns.resolve6(hostname)));
  } catch {}
  return [...new Set(hosts)];
}

/** Connect to Supabase Postgres (handles IPv6-only direct hosts + pooler). */
export async function createPgClient() {
  const config = getConfig();
  const ssl = { rejectUnauthorized: false };
  const hosts = await resolveHosts(config.host);
  let lastError;

  for (const host of hosts) {
    const client = new pg.Client({ ...config, host, ssl, connectionTimeoutMillis: 20000 });
    try {
      await client.connect();
      return client;
    } catch (err) {
      lastError = err;
      try {
        await client.end();
      } catch {}
    }
  }

  throw lastError ?? new Error(`Could not connect to ${config.host}`);
}
