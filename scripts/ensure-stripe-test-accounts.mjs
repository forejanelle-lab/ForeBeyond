#!/usr/bin/env node
/**
 * Create demo login accounts + a host-approved stay for Stripe testing.
 * Idempotent — safe to re-run.
 *
 * Usage: npm run db:stripe-test-setup
 */
import { createPgClient } from "./pg-connect.mjs";

const PASSWORD = "ForeBeyond123!";
const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";

const HOST = {
  id: "a2000001-0000-4000-8000-000000000001",
  email: "maria@forebeyond.demo",
  firstName: "Maria",
  lastName: "Tanaka",
  bio: "Kyoto native sharing home cooking and neighborhood walks.",
  location: "Kyoto, Japan",
  languages: ["Japanese", "English"],
};

const TRAVELER = {
  id: "a2100001-0000-4000-8000-000000000001",
  email: "alex@forebeyond.demo",
  firstName: "Alex",
  lastName: "Rivera",
  bio: "Curious traveler from San Francisco.",
  location: "San Francisco, USA",
  languages: ["English"],
};

const LISTING = {
  id: "c2000001-0000-4000-8000-000000000001",
  title: "Tanaka Family Home in Kyoto",
  familyStory: "Traditional home near Gion — we love hosting curious travelers.",
  city: "Kyoto",
  country: "Japan",
  languages: ["Japanese", "English"],
  meals: ["Breakfast included"],
  amenities: ["Private room", "WiFi"],
  familyActivities: ["Cooking together"],
  houseRules: ["Shoes off indoors"],
  photoUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
  budgetPerNight: 85,
  maxCapacity: 3,
};

const STAY_REQUEST_ID = "c3990001-0000-4000-8000-000000000001";

async function ensureAuthUser(client, user) {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [user.email]);
  if (rows[0]?.id) return rows[0].id;

  const meta = {
    first_name: user.firstName,
    last_name: user.lastName,
    full_name: `${user.firstName} ${user.lastName}`,
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
    [INSTANCE_ID, user.id, user.email, PASSWORD, JSON.stringify(meta)]
  );

  await client.query(
    `INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES ($1, $2, $3, 'email', $4::jsonb, NOW(), NOW(), NOW())
    ON CONFLICT DO NOTHING`,
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

async function ensureProfile(client, userId, user, role) {
  await client.query(
    `INSERT INTO profiles (id, email, full_name, bio, location, languages, role, onboarding_step, onboarding_complete, verification_status, email_verified_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::user_role, 'complete', TRUE, 'verified', NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = EXCLUDED.full_name,
       bio = EXCLUDED.bio,
       location = EXCLUDED.location,
       languages = EXCLUDED.languages,
       role = EXCLUDED.role,
       onboarding_step = 'complete',
       onboarding_complete = TRUE,
       verification_status = 'verified',
       email_verified_at = COALESCE(profiles.email_verified_at, NOW()),
       updated_at = NOW()`,
    [
      userId,
      user.email,
      `${user.firstName} ${user.lastName}`,
      user.bio,
      user.location,
      user.languages,
      role,
    ]
  );
}

async function ensureHostData(client, hostId) {
  await client.query(
    `INSERT INTO host_profiles (
      user_id, cultural_offerings, household_description, experience_description,
      city, country, neighborhood, max_guests, languages_spoken
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (user_id) DO NOTHING`,
    [
      hostId,
      ["Home-cooked meals", "Neighborhood tours"],
      "Multigenerational home with a shared kitchen.",
      "Market walks and seasonal cooking together.",
      "Kyoto",
      "Japan",
      "Gion",
      3,
      ["Japanese", "English"],
    ]
  );

  const { rows } = await client.query(
    `SELECT id FROM host_listings WHERE host_id = $1 AND status = 'published' LIMIT 1`,
    [hostId]
  );

  if (rows[0]?.id) return rows[0].id;

  await client.query(
    `INSERT INTO host_listings (
      id, host_id, title, family_story, languages, country, city,
      meals, amenities, family_activities, house_rules,
      budget_per_night, max_capacity, status, published_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'published', NOW())
    ON CONFLICT (id) DO NOTHING`,
    [
      LISTING.id,
      hostId,
      LISTING.title,
      LISTING.familyStory,
      LISTING.languages,
      LISTING.country,
      LISTING.city,
      LISTING.meals,
      LISTING.amenities,
      LISTING.familyActivities,
      LISTING.houseRules,
      LISTING.budgetPerNight,
      LISTING.maxCapacity,
    ]
  );

  await client.query(
    `INSERT INTO listing_photos (listing_id, file_url, caption, sort_order, is_cover)
     VALUES ($1, $2, $3, 0, TRUE)
     ON CONFLICT DO NOTHING`,
    [LISTING.id, LISTING.photoUrl, LISTING.title]
  );

  return LISTING.id;
}

async function ensureHostApprovedStay(client, travelerId, hostId, listingId) {
  const { rows } = await client.query(
    `SELECT id FROM stay_requests
     WHERE traveler_id = $1 AND status = 'host_approved'
     LIMIT 1`,
    [travelerId]
  );

  if (rows[0]?.id) return rows[0].id;

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count, status, host_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'host_approved', $8)
    ON CONFLICT (id) DO UPDATE SET status = 'host_approved', updated_at = NOW()`,
    [
      STAY_REQUEST_ID,
      travelerId,
      hostId,
      listingId,
      "Excited to experience Kyoto with your family!",
      "2026-08-10",
      "2026-08-15",
      "We would love to host you — confirm when ready!",
    ]
  );

  return STAY_REQUEST_ID;
}

async function main() {
  const client = await createPgClient();

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    await client.query("BEGIN");

    const hostId = await ensureAuthUser(client, HOST);
    const travelerId = await ensureAuthUser(client, TRAVELER);

    await ensureProfile(client, hostId, HOST, "host");
    await ensureProfile(client, travelerId, TRAVELER, "traveler");

    await client.query(
      `INSERT INTO traveler_profiles (user_id, interests, travel_style, preferred_destinations)
       VALUES ($1, $2, 'immersive', $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [travelerId, ["Cooking & Cuisine", "History & Heritage"], ["Japan", "Italy"]]
    );

    const listingId = await ensureHostData(client, hostId);
    const stayRequestId = await ensureHostApprovedStay(client, travelerId, hostId, listingId);

    await client.query("COMMIT");

    console.log("Stripe test accounts ready:\n");
    console.log("  Traveler (pay service fee to confirm):");
    console.log(`    Email:    ${TRAVELER.email}`);
    console.log(`    Password: ${PASSWORD}`);
    console.log(`    Stay:     /dashboard/requests/${stayRequestId}`);
    console.log("\n  Host (optional):");
    console.log(`    Email:    ${HOST.email}`);
    console.log(`    Password: ${PASSWORD}`);
    console.log("\n  Local app: http://localhost:3000/auth/sign-in");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
