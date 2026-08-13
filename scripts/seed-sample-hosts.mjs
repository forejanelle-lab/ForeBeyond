/**
 * Seed 10 sample host profiles with published listings across different countries.
 * No listing photos — cards fall back to /logo-fore-beyond.png in the app.
 *
 * Usage: npm run db:seed-sample-hosts
 * Password for all accounts: ForeBeyond123!
 */
import { createClient } from "@supabase/supabase-js";
import { createPgClient } from "./pg-connect.mjs";
import { loadEnvLocal } from "./load-env-local.mjs";
import {
  getTrustProfile,
  profileFieldsForTrustProfile,
  verificationDocumentsForTier,
} from "./sample-host-trust.mjs";
import { getSampleHostStory } from "./sample-host-stories.mjs";

loadEnvLocal(process.cwd(), { force: true });

const PASSWORD = "ForeBeyond123!";
const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";
const EMAIL_DOMAIN = "@forebeyond.demo";
const EMAIL_PREFIX = "sample.host.";

const SAMPLE_HOSTS = [
  {
    code: "jp",
    firstName: "Yuki",
    lastName: "Tanaka",
    country: "Japan",
    city: "Kyoto",
    languages: ["Japanese", "English"],
  },
  {
    code: "it",
    firstName: "Giulia",
    lastName: "Rossi",
    country: "Italy",
    city: "Florence",
    languages: ["Italian", "English"],
  },
  {
    code: "es",
    firstName: "Lucia",
    lastName: "Garcia",
    country: "Spain",
    city: "Seville",
    languages: ["Spanish", "English"],
  },
  {
    code: "gt",
    firstName: "Elena",
    lastName: "Morales",
    country: "Guatemala",
    city: "Antigua",
    languages: ["Spanish", "English"],
  },
  {
    code: "mx",
    firstName: "Sofia",
    lastName: "Herrera",
    country: "Mexico",
    city: "Oaxaca",
    languages: ["Spanish", "English"],
  },
  {
    code: "fr",
    firstName: "Camille",
    lastName: "Dupont",
    country: "France",
    city: "Lyon",
    languages: ["French", "English"],
  },
  {
    code: "pt",
    firstName: "Ines",
    lastName: "Silva",
    country: "Portugal",
    city: "Porto",
    languages: ["Portuguese", "English"],
  },
  {
    code: "ma",
    firstName: "Fatima",
    lastName: "Benali",
    country: "Morocco",
    city: "Marrakech",
    languages: ["Arabic", "French", "English"],
  },
  {
    code: "th",
    firstName: "Niran",
    lastName: "Sukhon",
    country: "Thailand",
    city: "Chiang Mai",
    languages: ["Thai", "English"],
  },
  {
    code: "ca",
    firstName: "Emma",
    lastName: "Thompson",
    country: "Canada",
    city: "Vancouver",
    languages: ["English", "French"],
  },
];

let idCounter = 0;

function nextUuid(prefix) {
  idCounter += 1;
  return `${prefix}-0000-4000-8000-${String(idCounter).padStart(12, "0")}`;
}

function buildHost(entry, index) {
  const story = getSampleHostStory(entry.code);
  const budget = 65 + (index % 5) * 10;
  return {
    ...entry,
    ...story,
    id: nextUuid("a7000001"),
    listingId: nextUuid("c7000001"),
    email: `${EMAIL_PREFIX}${entry.code}${EMAIL_DOMAIN}`,
    phone: `+1 555 ${String(3000 + index).slice(-4)} ${String(4000 + index).slice(-4)}`,
    maxGuests: 2 + (index % 3),
    budgetPerNight: budget,
    publishedDaysAgo: 7 + index * 3,
    streetAddress: `${120 + index} Sample Street`,
    title: `${entry.lastName} Family Home in ${entry.city}`,
  };
}

function listingPayload(hostId, host) {
  const budget = host.budgetPerNight;
  const publishedAt = new Date();
  publishedAt.setUTCDate(publishedAt.getUTCDate() - host.publishedDaysAgo);

  return {
    id: host.listingId,
    host_id: hostId,
    title: host.title,
    family_story: host.familyStory,
    stay_details: host.stayDetails,
    languages: host.languages,
    country: host.country,
    city: host.city,
    meals: host.meals,
    amenities: ["Private room", "Shared bathroom", "WiFi", "Laundry access"],
    family_activities: host.familyActivities,
    house_rules: host.houseRules,
    budget_per_night: budget,
    budget_per_night_3_guests: Math.round(budget * 1.15),
    budget_per_night_4_guests: Math.round(budget * 1.3),
    budget_per_night_5_guests: Math.round(budget * 1.45),
    budget_per_night_6_plus_guests: Math.round(budget * 1.6),
    max_capacity: host.maxGuests,
    status: "published",
    published_at: publishedAt.toISOString(),
  };
}

async function removePreviousSampleHostsPg(client) {
  const { rowCount } = await client.query(
    `DELETE FROM auth.users WHERE email LIKE $1`,
    [`${EMAIL_PREFIX}%${EMAIL_DOMAIN}`]
  );
  if (rowCount > 0) {
    console.log("Removed %d previous sample host accounts.\n", rowCount);
  }
}

async function ensureAuthUserPg(client, host) {
  const fullName = `${host.firstName} ${host.lastName}`;
  const meta = {
    first_name: host.firstName,
    last_name: host.lastName,
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
    [INSTANCE_ID, host.id, host.email, PASSWORD, JSON.stringify(meta)]
  );

  await client.query(
    `INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES ($1, $2, $3, 'email', $4::jsonb, NOW(), NOW(), NOW())`,
    [
      host.id,
      host.id,
      host.id,
      JSON.stringify({
        sub: host.id,
        email: host.email,
        email_verified: true,
        phone_verified: false,
        ...meta,
      }),
    ]
  );

  return host.id;
}

async function seedHostProfilePg(client, userId, host, index) {
  const trustFields = profileFieldsForTrustProfile(getTrustProfile(index));
  await client.query(
    `UPDATE profiles SET
      full_name = $2,
      bio = $3,
      location = $4,
      phone = $5,
      languages = $6,
      role = 'host'::user_role,
      onboarding_step = 'complete',
      onboarding_complete = TRUE,
      verification_status = $7,
      email_verified_at = $8::timestamptz,
      phone_verified_at = $9::timestamptz,
      address_verified_at = $10::timestamptz,
      video_verified_at = $11::timestamptz,
      updated_at = NOW()
     WHERE id = $1`,
    [
      userId,
      `${host.firstName} ${host.lastName}`,
      host.bio,
      `${host.city}, ${host.country}`,
      host.phone,
      host.languages,
      trustFields.verification_status,
      trustFields.email_verified_at,
      trustFields.phone_verified_at,
      trustFields.address_verified_at,
      trustFields.video_verified_at,
    ]
  );
}

async function seedVerificationPg(client, userId, index) {
  const { tier } = getTrustProfile(index);
  for (const [documentType, fileUrl] of verificationDocumentsForTier(tier)) {
    await client.query(
      `INSERT INTO verification_documents (user_id, document_type, file_url, status, reviewed_at)
       VALUES ($1, $2::document_type, $3, 'verified', NOW())`,
      [userId, documentType, fileUrl]
    );
  }
}

async function seedHostDetailsPg(client, userId, host) {
  await client.query(
    `INSERT INTO host_profiles (
      user_id, cultural_offerings, household_description, experience_description,
      city, country, neighborhood, max_guests, languages_spoken, host_motivation
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (user_id) DO UPDATE SET
      cultural_offerings = EXCLUDED.cultural_offerings,
      household_description = EXCLUDED.household_description,
      experience_description = EXCLUDED.experience_description,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      neighborhood = EXCLUDED.neighborhood,
      max_guests = EXCLUDED.max_guests,
      languages_spoken = EXCLUDED.languages_spoken,
      host_motivation = EXCLUDED.host_motivation,
      updated_at = NOW()`,
    [
      userId,
      host.familyActivities,
      host.householdDescription,
      host.experienceDescription,
      host.city,
      host.country,
      host.neighborhood,
      host.maxGuests,
      host.languages,
      host.hostMotivation,
    ]
  );
}

async function seedListingPg(client, hostId, host) {
  const payload = listingPayload(hostId, host);

  await client.query(
    `INSERT INTO host_listings (
      id, host_id, title, family_story, stay_details, languages, country, city,
      meals, amenities, family_activities, house_rules,
      budget_per_night, budget_per_night_3_guests, budget_per_night_4_guests,
      budget_per_night_5_guests, budget_per_night_6_plus_guests,
      max_capacity, status, published_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, 'published', $19::timestamptz
    )`,
    [
      payload.id,
      payload.host_id,
      payload.title,
      payload.family_story,
      payload.stay_details,
      payload.languages,
      payload.country,
      payload.city,
      payload.meals,
      payload.amenities,
      payload.family_activities,
      payload.house_rules,
      payload.budget_per_night,
      payload.budget_per_night_3_guests,
      payload.budget_per_night_4_guests,
      payload.budget_per_night_5_guests,
      payload.budget_per_night_6_plus_guests,
      payload.max_capacity,
      payload.published_at,
    ]
  );

  await client.query(
    `INSERT INTO listing_contact_details (listing_id, contact_email, contact_address)
     VALUES ($1, $2, $3)
     ON CONFLICT (listing_id) DO UPDATE SET
       contact_email = EXCLUDED.contact_email,
       contact_address = EXCLUDED.contact_address,
       updated_at = NOW()`,
    [host.listingId, host.email, `${host.streetAddress}, ${host.city}, ${host.country}`]
  );
}

async function seedWithPg() {
  const client = await createPgClient();

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    await removePreviousSampleHostsPg(client);
    await client.query("BEGIN");

    console.log("Seeding 10 sample hosts via PostgreSQL...\n");

    for (let index = 0; index < SAMPLE_HOSTS.length; index++) {
      const host = buildHost(SAMPLE_HOSTS[index], index);
      const userId = await ensureAuthUserPg(client, host);
      await seedHostProfilePg(client, userId, host, index);
      await seedVerificationPg(client, userId, index);
      await seedHostDetailsPg(client, userId, host);
      await seedListingPg(client, userId, host);
      await client.query("SELECT calculate_trust_score($1)", [userId]);
      console.log("  ✓ %s — %s, %s", host.email, host.city, host.country);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

function createSupabaseAdmin() {
  loadEnvLocal();
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

async function removePreviousSampleHostsApi(supabase) {
  for (const entry of SAMPLE_HOSTS) {
    const email = `${EMAIL_PREFIX}${entry.code}${EMAIL_DOMAIN}`;
    const userId = await findUserIdByEmail(supabase, email);
    if (userId) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  }
}

async function ensureAuthUserApi(supabase, host) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: host.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: host.firstName,
      last_name: host.lastName,
      full_name: `${host.firstName} ${host.lastName}`,
    },
  });

  if (error) throw error;
  return data.user.id;
}

async function seedHostProfileApi(supabase, userId, host, index) {
  const trustFields = profileFieldsForTrustProfile(getTrustProfile(index));
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: `${host.firstName} ${host.lastName}`,
      bio: host.bio,
      location: `${host.city}, ${host.country}`,
      phone: host.phone,
      languages: host.languages,
      role: "host",
      onboarding_step: "complete",
      onboarding_complete: true,
      ...trustFields,
    })
    .eq("id", userId);

  if (error) throw error;
}

async function seedVerificationApi(supabase, userId, index) {
  const { tier } = getTrustProfile(index);
  const docs = verificationDocumentsForTier(tier).map(([document_type, file_url]) => ({
    user_id: userId,
    document_type,
    file_url,
    status: "verified",
    reviewed_at: new Date().toISOString(),
  }));

  if (docs.length === 0) return;

  const { error } = await supabase.from("verification_documents").insert(docs);
  if (error) throw error;
}

async function seedHostDetailsApi(supabase, userId, host) {
  const { error } = await supabase.from("host_profiles").upsert(
    {
      user_id: userId,
      cultural_offerings: host.familyActivities,
      household_description: host.householdDescription,
      experience_description: host.experienceDescription,
      city: host.city,
      country: host.country,
      neighborhood: host.neighborhood,
      max_guests: host.maxGuests,
      languages_spoken: host.languages,
      host_motivation: host.hostMotivation,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

async function seedListingApi(supabase, userId, host) {
  const payload = listingPayload(userId, host);
  const { error: listingError } = await supabase.from("host_listings").upsert(payload, {
    onConflict: "id",
  });
  if (listingError) throw listingError;

  const { error: contactError } = await supabase.from("listing_contact_details").upsert(
    {
      listing_id: host.listingId,
      contact_email: host.email,
      contact_address: `${host.streetAddress}, ${host.city}, ${host.country}`,
    },
    { onConflict: "listing_id" }
  );
  if (contactError) throw contactError;
}

async function seedWithSupabaseApi() {
  const supabase = createSupabaseAdmin();
  await removePreviousSampleHostsApi(supabase);

  console.log("Seeding 10 sample hosts via Supabase Admin API...\n");

  for (let index = 0; index < SAMPLE_HOSTS.length; index++) {
    const host = buildHost(SAMPLE_HOSTS[index], index);
    const userId = await ensureAuthUserApi(supabase, host);
    await seedHostProfileApi(supabase, userId, host, index);
    await seedVerificationApi(supabase, userId, index);
    await seedHostDetailsApi(supabase, userId, host);
    await seedListingApi(supabase, userId, host);
    await supabase.rpc("calculate_trust_score", { p_user_id: userId });
    console.log("  ✓ %s — %s, %s", host.email, host.city, host.country);
  }
}

async function main() {
  const hasDatabaseUrl =
    Boolean(process.env.DATABASE_URL?.trim()) ||
    Boolean(process.env.DATABASE_HOST?.trim());

  if (hasDatabaseUrl) {
    await seedWithPg();
  } else {
    await seedWithSupabaseApi();
  }

  console.log("\nSample hosts ready (10 listings, logo fallback for images).");
  console.log("Password for all accounts: %s", PASSWORD);
  console.log("Browse: /search\n");
}

main().catch((err) => {
  console.error("Sample host seed failed:", err.message);
  process.exit(1);
});
