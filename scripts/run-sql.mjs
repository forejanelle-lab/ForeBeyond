import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createPgClient } from "./pg-connect.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/run-sql.mjs <path-to-sql-file>");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "..", file), "utf8");

async function run() {
  const client = await createPgClient();
  console.log(`Running ${file}...`);
  await client.query(sql);
  await client.end();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
