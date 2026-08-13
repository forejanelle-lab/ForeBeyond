/**
 * Vary trust scores for existing sample.host.*@forebeyond.demo accounts.
 *
 * Usage: npm run db:mix-sample-host-trust
 */
import { createClient } from "@supabase/supabase-js";
import { createPgClient } from "./pg-connect.mjs";
import { loadEnvLocal } from "./load-env-local.mjs";
import {
  getTrustProfile,
  profileFieldsForTrustProfile,
  verificationDocumentsForTier,
  SAMPLE_TRUST_PROFILES,
} from "./sample-host-trust.mjs";

loadEnvLocal(process.cwd(), { force: true });

const EMAIL_DOMAIN = "@forebeyond.demo";
const EMAIL_PREFIX = "sample.host.";

const SAMPLE_CODES = ["jp", "it", "es", "gt", "mx", "fr", "pt", "ma", "th", "ca"];

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findUserIdByEmail(supabase, email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function applyTrustPg(client, userId, index) {
  const trustProfile = getTrustProfile(index);
  const fields = profileFieldsForTrustProfile(trustProfile);

  await client.query(`DELETE FROM verification_documents WHERE user_id = $1`, [userId]);
  await client.query(
    `UPDATE profiles SET
      verification_status = $2,
      email_verified_at = $3::timestamptz,
      phone_verified_at = $4::timestamptz,
      address_verified_at = $5::timestamptz,
      video_verified_at = $6::timestamptz,
      updated_at = NOW()
     WHERE id = $1`,
    [
      userId,
      fields.verification_status,
      fields.email_verified_at,
      fields.phone_verified_at,
      fields.address_verified_at,
      fields.video_verified_at,
    ]
  );

  for (const [documentType, fileUrl] of verificationDocumentsForTier(trustProfile.tier)) {
    await client.query(
      `INSERT INTO verification_documents (user_id, document_type, file_url, status, reviewed_at)
       VALUES ($1, $2::document_type, $3, 'verified', NOW())`,
      [userId, documentType, fileUrl]
    );
  }

  await client.query(`SELECT calculate_trust_score($1)`, [userId]);
  const { rows } = await client.query(`SELECT trust_score FROM profiles WHERE id = $1`, [userId]);
  return rows[0]?.trust_score ?? 0;
}

async function applyTrustApi(supabase, userId, index) {
  const trustProfile = getTrustProfile(index);
  const fields = profileFieldsForTrustProfile(trustProfile);

  await supabase.from("verification_documents").delete().eq("user_id", userId);

  const { error: profileError } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);
  if (profileError) throw profileError;

  const docs = verificationDocumentsForTier(trustProfile.tier).map(([document_type, file_url]) => ({
    user_id: userId,
    document_type,
    file_url,
    status: "verified",
    reviewed_at: new Date().toISOString(),
  }));

  if (docs.length > 0) {
    const { error: docsError } = await supabase.from("verification_documents").insert(docs);
    if (docsError) throw docsError;
  }

  await supabase.rpc("calculate_trust_score", { p_user_id: userId });

  const { data, error } = await supabase.from("profiles").select("trust_score").eq("id", userId).single();
  if (error) throw error;
  return data.trust_score ?? 0;
}

async function main() {
  const hasDatabaseUrl =
    Boolean(process.env.DATABASE_URL?.trim()) || Boolean(process.env.DATABASE_HOST?.trim());

  console.log("Mixing trust scores for sample hosts...\n");

  if (hasDatabaseUrl) {
    const client = await createPgClient();
    try {
      for (let index = 0; index < SAMPLE_CODES.length; index++) {
        const email = `${EMAIL_PREFIX}${SAMPLE_CODES[index]}${EMAIL_DOMAIN}`;
        const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
        const userId = rows[0]?.id;
        if (!userId) {
          console.log("  — skip %s (not found)", email);
          continue;
        }
        const score = await applyTrustPg(client, userId, index);
        console.log("  ✓ %s — trust score %d (%s)", email, score, SAMPLE_TRUST_PROFILES[index].tier);
      }
    } finally {
      await client.end();
    }
  } else {
    const supabase = createSupabaseAdmin();
    for (let index = 0; index < SAMPLE_CODES.length; index++) {
      const email = `${EMAIL_PREFIX}${SAMPLE_CODES[index]}${EMAIL_DOMAIN}`;
      const userId = await findUserIdByEmail(supabase, email);
      if (!userId) {
        console.log("  — skip %s (not found)", email);
        continue;
      }
      const score = await applyTrustApi(supabase, userId, index);
      console.log("  ✓ %s — trust score %d (%s)", email, score, SAMPLE_TRUST_PROFILES[index].tier);
    }
  }

  console.log("\nDone. Refresh /search to see varied trust scores.\n");
}

main().catch((err) => {
  console.error("Mix sample host trust failed:", err.message);
  process.exit(1);
});
