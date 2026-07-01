/**
 * Ensure the platform admin account has is_admin=true and a confirmed auth user.
 * Email: PLATFORM_ADMIN_EMAIL or forebeyond@gmail.com
 */
import { createPgClient } from "./pg-connect.mjs";

const DEFAULT_ADMIN_EMAIL = "forebeyond@gmail.com";
const LEGACY_ADMIN_EMAIL = "forejanelle@gmail.com";
const ADMIN_PASSWORD = "ForeBeyond123!";
const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";
const ADMIN_ID = "a2200001-0000-4000-8000-000000000001";

function getAdminEmail() {
  return (process.env.PLATFORM_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

async function migrateLegacyAdminEmail(client, adminEmail) {
  if (adminEmail === LEGACY_ADMIN_EMAIL) return;

  const { rows: legacyRows } = await client.query(
    "SELECT id FROM auth.users WHERE lower(email) = $1 LIMIT 1",
    [LEGACY_ADMIN_EMAIL]
  );
  if (!legacyRows[0]) return;

  const { rows: currentRows } = await client.query(
    "SELECT id FROM auth.users WHERE lower(email) = $1 LIMIT 1",
    [adminEmail]
  );
  if (currentRows[0]) return;

  const adminId = legacyRows[0].id;
  console.log("Migrating platform admin email %s -> %s", LEGACY_ADMIN_EMAIL, adminEmail);

  await client.query("UPDATE auth.users SET email = $2, updated_at = NOW() WHERE id = $1", [
    adminId,
    adminEmail,
  ]);
  await client.query("UPDATE profiles SET email = $2, updated_at = NOW() WHERE id = $1", [
    adminId,
    adminEmail,
  ]);
  await client.query(
    `UPDATE auth.identities
     SET identity_data = jsonb_set(
       jsonb_set(identity_data, '{email}', to_jsonb($2::text)),
       '{sub}', to_jsonb($1::text)
     ),
     updated_at = NOW()
     WHERE user_id = $1 AND provider = 'email'`,
    [adminId, adminEmail]
  );
}

async function main() {
  const adminEmail = getAdminEmail();
  const client = await createPgClient();

  try {
    await migrateLegacyAdminEmail(client, adminEmail);
    const { rows: authRows } = await client.query(
      "SELECT id, email FROM auth.users WHERE lower(email) = $1 LIMIT 1",
      [adminEmail]
    );

    let adminId = authRows[0]?.id;

    if (!adminId) {
      console.log("No auth user for %s — creating admin account...", adminEmail);
      const meta = {
        first_name: "Janelle",
        last_name: "Fore",
        full_name: "Janelle Fore",
      };

      await client.query(
        `INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at, confirmation_token, email_change,
          email_change_token_new, recovery_token
        ) VALUES (
          $1, $2, 'authenticated', 'authenticated', $3,
          crypt($4, gen_salt('bf')), NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          $5::jsonb, NOW(), NOW(), '', '', '', ''
        ) ON CONFLICT (id) DO NOTHING`,
        [INSTANCE_ID, ADMIN_ID, adminEmail, ADMIN_PASSWORD, JSON.stringify(meta)]
      );

      await client.query(
        `INSERT INTO auth.identities (
          id, user_id, provider_id, provider, identity_data,
          last_sign_in_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'email', $4::jsonb, NOW(), NOW(), NOW()
        ) ON CONFLICT DO NOTHING`,
        [
          ADMIN_ID,
          ADMIN_ID,
          ADMIN_ID,
          JSON.stringify({
            sub: ADMIN_ID,
            email: adminEmail,
            email_verified: true,
            phone_verified: false,
            ...meta,
          }),
        ]
      );

      adminId = ADMIN_ID;
    }

    await client.query(
      `UPDATE profiles SET
        email = $2,
        full_name = COALESCE(full_name, 'Janelle Fore'),
        is_admin = TRUE,
        is_trust_moderator = FALSE,
        onboarding_step = 'complete',
        onboarding_complete = TRUE,
        verification_status = 'verified',
        email_verified_at = COALESCE(email_verified_at, NOW()),
        updated_at = NOW()
       WHERE id = $1`,
      [adminId, adminEmail]
    );

    const { rows: profileRows } = await client.query(
      "SELECT id, email, is_admin FROM profiles WHERE id = $1",
      [adminId]
    );

    if (!profileRows[0]) {
      throw new Error(`Profile missing for admin id ${adminId}. Run db:reset-seed or sign up once.`);
    }

    console.log("Platform admin ready:");
    console.log("  Email:    %s", profileRows[0].email);
    console.log("  is_admin: %s", profileRows[0].is_admin);
    console.log("  User id:  %s", adminId);
    if (!authRows[0]) {
      console.log("  Password: %s (new account)", ADMIN_PASSWORD);
    }
    console.log("\nSet PLATFORM_ADMIN_EMAIL=%s in Vercel (optional — app defaults to this email).", adminEmail);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fix admin failed:", err.message);
  process.exit(1);
});
