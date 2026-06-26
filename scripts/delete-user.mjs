import { createPgClient } from "./pg-connect.mjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/delete-user.mjs <email>");
  process.exit(1);
}

async function run() {
  const client = await createPgClient();

  const { rows } = await client.query("SELECT id, email FROM auth.users WHERE lower(email) = $1", [
    email,
  ]);

  if (rows.length === 0) {
    console.log(`No account found for ${email}`);
    await client.end();
    return;
  }

  const { id, email: foundEmail } = rows[0];
  await client.query("DELETE FROM auth.users WHERE id = $1", [id]);
  console.log(`Deleted account: ${foundEmail} (${id})`);
  await client.end();
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
