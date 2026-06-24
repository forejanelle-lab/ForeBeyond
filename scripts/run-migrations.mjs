import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createPgClient } from "./pg-connect.mjs";

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

const migrations = [
  "001_initial_schema.sql",
  "002_rls_policies.sql",
  "003_fix_signup_trigger.sql",
  "004_phase2_trust_privacy.sql",
  "006_phase3_host_listings.sql",
  "007_phase3_listings_rls.sql",
  "008_fix_trust_trigger.sql",
  "009_phase4_search_favorites.sql",
  "010_phase4_search_rls.sql",
  "011_remove_both_role.sql",
  "012_phase5_experiences_marketplace.sql",
  "013_phase5_experiences_rls.sql",
  "014_phase6_stay_request_flow.sql",
  "015_phase6_stay_request_rls.sql",
  "016_phase7_messaging_system.sql",
  "017_phase7_messaging_rls.sql",
  "018_phase8_review_system.sql",
  "019_phase8_review_rls.sql",
  "020_phase9_admin_dashboard.sql",
  "021_phase9_admin_rls.sql",
];

async function run() {
  const client = await createPgClient();
  console.log("Connected to Supabase PostgreSQL");

  for (const file of migrations) {
    const sql = readFileSync(join(__dirname, "..", "supabase", "migrations", file), "utf8");
    console.log(`Running ${file}...`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${file} complete`);
    } catch (err) {
      if (err.message?.includes("already exists")) {
        console.log(`  ⚠ ${file} skipped (already applied): ${err.message.split("\n")[0]}`);
      } else {
        throw err;
      }
    }
  }

  const { rows } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name = 'trust_score'
  `);
  console.log("\nPhase 2 trust_score column:", rows.length ? "present" : "missing");

  await client.end();
  console.log("\nMigrations finished successfully.");
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
