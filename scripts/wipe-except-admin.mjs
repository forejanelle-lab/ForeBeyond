import { createPgClient } from "./pg-connect.mjs";

const DEFAULT_ADMIN_EMAIL = "forejanelle@gmail.com";
const ADMIN_PASSWORD = "ForeBeyond123!";
const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";

const ADMIN = {
  id: "a2200001-0000-4000-8000-000000000001",
  email: DEFAULT_ADMIN_EMAIL,
  firstName: "Janelle",
  lastName: "Fore",
  bio: "Fore Beyond platform administrator.",
  location: "USA",
  languages: ["English"],
};

function getAdminEmail() {
  return (process.env.PLATFORM_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

async function safeDelete(client, sql, params = []) {
  try {
    await client.query(sql, params);
  } catch (err) {
    console.log("  (Skipped: %s)", err.message.split("\n")[0]);
  }
}

async function clearSharedData(client) {
  console.log("Clearing storage, sessions, and reports...\n");

  await safeDelete(client, "DELETE FROM storage.objects");

  for (const table of ["auth.sessions", "auth.refresh_tokens", "auth.mfa_factors"]) {
    await safeDelete(client, `DELETE FROM ${table}`);
  }

  await client.query("DELETE FROM content_reports");
}

async function cleanAdminAppData(client, adminId) {
  const tables = [
    "notifications",
    "user_login_events",
    "verification_documents",
    "trust_badges",
    "traveler_profiles",
    "host_profiles",
    "saved_listings",
    "saved_experiences",
    "privacy_settings",
    "cookie_consents",
    "data_export_requests",
    "account_deletion_requests",
    "support_requests",
  ];

  for (const table of tables) {
    await safeDelete(client, `DELETE FROM ${table} WHERE user_id = $1`, [adminId]);
  }

  await client.query(
    `UPDATE profiles SET
      full_name = $2,
      bio = $3,
      location = $4,
      phone = NULL,
      languages = $5,
      role = NULL,
      is_admin = TRUE,
      onboarding_step = 'complete',
      onboarding_complete = TRUE,
      verification_status = 'verified',
      email_verified_at = COALESCE(email_verified_at, NOW()),
      trust_score = 0,
      updated_at = NOW()
     WHERE id = $1`,
    [adminId, `${ADMIN.firstName} ${ADMIN.lastName}`, ADMIN.bio, ADMIN.location, ADMIN.languages]
  );
}

async function ensureAuthUser(client, user) {
  const fullName = `${user.firstName} ${user.lastName}`;
  const meta = {
    first_name: user.firstName,
    last_name: user.lastName,
    full_name: fullName,
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
    )`,
    [INSTANCE_ID, user.id, user.email, ADMIN_PASSWORD, JSON.stringify(meta)]
  );

  await client.query(
    `INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      $1, $2, $3, 'email',
      $4::jsonb, NOW(), NOW(), NOW()
    )`,
    [
      user.id,
      user.id,
      user.id,
      JSON.stringify({
        sub: user.id,
        email: user.email,
        email_verified: true,
        phone_verified: false,
        ...meta,
      }),
    ]
  );

  return user.id;
}

async function wipeExceptAdmin(client) {
  const adminEmail = getAdminEmail();
  console.log("Fore Beyond clean slate — keeping admin only\n");
  console.log("Admin email: %s\n", adminEmail);

  const { rows: adminRows } = await client.query(
    "SELECT id, email FROM auth.users WHERE lower(email) = $1 LIMIT 1",
    [adminEmail]
  );

  await clearSharedData(client);

  if (adminRows[0]) {
    const adminId = adminRows[0].id;
    console.log("Preserving existing admin account: %s\n", adminRows[0].email);

    await client.query("DELETE FROM auth.identities WHERE user_id <> $1", [adminId]);
    await client.query("DELETE FROM auth.users WHERE id <> $1", [adminId]);

    await cleanAdminAppData(client, adminId);

    console.log("All other users and platform data removed.");
    console.log("Admin password unchanged (existing credentials kept).\n");
    return { adminEmail: adminRows[0].email, passwordKept: true };
  }

  console.log("No admin account found — recreating admin user...\n");

  await client.query("DELETE FROM auth.identities");
  await client.query("DELETE FROM auth.users");

  const admin = { ...ADMIN, email: adminEmail };
  const adminId = await ensureAuthUser(client, admin);

  await client.query(
    `UPDATE profiles SET
      full_name = $2,
      bio = $3,
      location = $4,
      languages = $5,
      is_admin = TRUE,
      onboarding_step = 'complete',
      onboarding_complete = TRUE,
      verification_status = 'verified',
      email_verified_at = NOW(),
      updated_at = NOW()
     WHERE id = $1`,
    [adminId, `${admin.firstName} ${admin.lastName}`, admin.bio, admin.location, admin.languages]
  );

  console.log("Admin account created.");
  console.log("Password: %s\n", ADMIN_PASSWORD);
  return { adminEmail, passwordKept: false, password: ADMIN_PASSWORD };
}

async function main() {
  const client = await createPgClient();

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    const result = await wipeExceptAdmin(client);

    console.log("Clean slate complete.");
    console.log("  Admin:  %s", result.adminEmail);
    console.log("  Login:  /auth/sign-in");
    console.log("  Admin:  /admin");
    if (!result.passwordKept) {
      console.log("  Password: %s", result.password);
    }
    console.log("\nPlatform is empty — no demo hosts, guests, listings, or trips.");
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Clean slate failed:", err.message);
  process.exit(1);
});
