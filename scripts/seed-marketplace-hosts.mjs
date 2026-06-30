/**
 * Seed marketplace hosts with full profiles, listings, bookings, and reviews.
 * Preserves platform admin (forejanelle@gmail.com).
 *
 * Totals: 33 hosts — PR 10, Spain 6, Alaska 2, Japan 8, Italy 4, Canada 3
 * Each host: varied completed stays/reviews (3–12) and trust scores >= 80
 */
import { createPgClient } from "./pg-connect.mjs";
import { resolveCatalogListingGallery } from "./listing-photo-catalog.mjs";
import { hostVarietyProfile } from "./marketplace-host-variety.mjs";

const PASSWORD = "ForeBeyond123!";
const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";
const TRAVELER_COUNT = 55;
const MIN_TRUST = 80;

const REGIONS = [
  {
    code: "pr",
    country: "Puerto Rico",
    count: 10,
    cities: [
      "San Juan",
      "Ponce",
      "Rincón",
      "Vieques",
      "Aguadilla",
      "Cabo Rojo",
      "Mayagüez",
      "Fajardo",
      "Luquillo",
      "Culebra",
    ],
    languages: ["Spanish", "English"],
    firstNames: ["Carmen", "Luis", "Rosa", "Javier", "Elena", "Miguel", "Sofia", "Rafael", "Isabel", "Diego"],
    lastNames: ["Rivera", "Morales", "Santiago", "Delgado", "Vega", "Ortiz", "Ruiz", "Mendez", "Torres", "Colon"],
  },
  {
    code: "es",
    country: "Spain",
    count: 6,
    cities: ["Barcelona", "Seville", "Granada", "Valencia", "San Sebastián", "Málaga"],
    languages: ["Spanish", "English"],
    firstNames: ["Lucia", "Pablo", "Maria", "Carlos", "Ana", "Jorge"],
    lastNames: ["Garcia", "Martinez", "Lopez", "Fernandez", "Sanchez", "Romero"],
  },
  {
    code: "ak",
    country: "United States",
    count: 2,
    cities: ["Anchorage", "Fairbanks"],
    locationSuffix: "Alaska",
    languages: ["English"],
    firstNames: ["Sarah", "David"],
    lastNames: ["Kowalski", "Tanaka"],
  },
  {
    code: "jp",
    country: "Japan",
    count: 8,
    cities: ["Kyoto", "Tokyo", "Osaka", "Nara", "Hiroshima", "Sapporo", "Kanazawa", "Okinawa"],
    languages: ["Japanese", "English"],
    firstNames: ["Yuki", "Kenji", "Hana", "Takeshi", "Aiko", "Haruto", "Mei", "Ryo"],
    lastNames: ["Tanaka", "Suzuki", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Saito"],
  },
  {
    code: "it",
    country: "Italy",
    count: 4,
    cities: ["Florence", "Rome", "Bologna", "Palermo"],
    languages: ["Italian", "English"],
    firstNames: ["Giulia", "Marco", "Francesca", "Luca"],
    lastNames: ["Rossi", "Bianchi", "Romano", "Conti"],
  },
  {
    code: "ca",
    country: "Canada",
    count: 3,
    cities: ["Vancouver", "Montreal", "Quebec City"],
    languages: ["English", "French"],
    firstNames: ["Emma", "Jean", "Aisha"],
    lastNames: ["Thompson", "Tremblay", "Patel"],
  },
];

const HOST_AGES = [29, 34, 41, 48, 55, 62, 38, 51, 67, 33, 44, 59, 72, 36, 46, 53, 31, 58, 43, 65];
const TRAVELER_FIRST = [
  "Alex", "Sam", "Jordan", "Morgan", "Riley", "Casey", "Taylor", "Quinn", "Drew", "Jamie",
  "Noah", "Emma", "Liam", "Olivia", "Ethan", "Sophia", "Mason", "Isabella", "Logan", "Mia",
];
const TRAVELER_LAST = [
  "Rivera", "Chen", "Okonkwo", "Lee", "Patel", "Brooks", "Nguyen", "Schmidt", "Martinez", "Wright",
  "Kim", "Brown", "Wilson", "Garcia", "Miller", "Davis", "Anderson", "Thomas", "Jackson", "White",
];
const REVIEW_COMMENTS = [
  "Warm welcome and authentic home cooking — we felt like part of the family.",
  "The listing matched the photos and our room was comfortable and clean.",
  "Host shared incredible local tips we never would have found on our own.",
  "Generous breakfasts and thoughtful conversations every morning.",
  "A genuine cultural exchange — our children loved playing with theirs.",
  "Quiet neighborhood, easy transit, and a host who truly cares about guests.",
  "We learned recipes and traditions that made this trip unforgettable.",
  "Responsive before arrival and respectful of our space during the stay.",
  "Beautiful home, clear house rules, and a peaceful place to rest.",
  "Would stay again — hospitality felt personal, not transactional.",
];

let idCounter = 0;
function nextUuid(prefix) {
  idCounter += 1;
  return `${prefix}-0000-4000-8000-${String(idCounter).padStart(12, "0")}`;
}

function addDays(isoDate, days) {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function bookingWindow(hostIndex, bookingIndex) {
  const startMonth = 1 + ((hostIndex * 2 + bookingIndex) % 12);
  const year = 2024 + Math.floor((hostIndex + bookingIndex * 2) / 12);
  const startDay = 5 + ((hostIndex + bookingIndex) % 20);
  const start = `${year}-${String(startMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
  const end = addDays(start, 5 + (bookingIndex % 4));
  return { start, end };
}

function reviewDate(startDate, daysAfter) {
  return addDays(startDate, daysAfter);
}

async function removePreviousMarketplaceSeed(client) {
  const { rowCount } = await client.query(
    `DELETE FROM auth.users
     WHERE email LIKE 'host.%@forebeyond.demo'
        OR email LIKE 'guest.%@forebeyond.demo'`
  );
  if (rowCount > 0) {
    console.log("Removed %d previous marketplace seed accounts.\n", rowCount);
  }
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
    [INSTANCE_ID, user.id, user.email, PASSWORD, JSON.stringify(meta)]
  );

  await client.query(
    `INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES ($1, $2, $3, 'email', $4::jsonb, NOW(), NOW(), NOW())`,
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
}

async function seedHostProfile(client, userId, user, role, { isAdmin = false, verificationTier = "full" } = {}) {
  const phoneVerified = verificationTier === "full" || verificationTier === "standard";
  const addressVerified = verificationTier === "full" || verificationTier === "standard";
  const videoVerified = verificationTier === "full";

  await client.query(
    `UPDATE profiles SET
      full_name = $2,
      bio = $3,
      location = $4,
      phone = $5,
      languages = $6,
      role = $7::user_role,
      is_admin = $8,
      onboarding_step = 'complete',
      onboarding_complete = TRUE,
      verification_status = 'verified',
      email_verified_at = NOW(),
      phone_verified_at = CASE WHEN $9 THEN NOW() ELSE NULL END,
      address_verified_at = CASE WHEN $10 THEN NOW() ELSE NULL END,
      video_verified_at = CASE WHEN $11 THEN NOW() ELSE NULL END,
      updated_at = NOW()
     WHERE id = $1`,
    [
      userId,
      `${user.firstName} ${user.lastName}`,
      user.bio,
      user.location,
      user.phone ?? null,
      user.languages ?? ["English"],
      role,
      isAdmin,
      phoneVerified,
      addressVerified,
      videoVerified,
    ]
  );
}

async function seedHostVerification(client, userId, tier = "full") {
  const docs = [
    ["government_id", "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80"],
    ["selfie", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80"],
  ];

  if (tier === "full" || tier === "standard") {
    docs.push(["address_proof", "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"]);
  }
  if (tier === "full") {
    docs.push(["video_verification", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"]);
  }

  for (const [type, url] of docs) {
    await client.query(
      `INSERT INTO verification_documents (user_id, document_type, file_url, status, reviewed_at)
       VALUES ($1, $2::document_type, $3, 'verified', NOW())`,
      [userId, type, url]
    );
  }
}

async function seedTravelerProfile(client, userId, index) {
  await client.query(
    `INSERT INTO traveler_profiles (user_id, interests, travel_style, preferred_destinations, dietary_preferences)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       interests = EXCLUDED.interests,
       travel_style = EXCLUDED.travel_style,
       preferred_destinations = EXCLUDED.preferred_destinations,
       updated_at = NOW()`,
    [
      userId,
      ["Cooking & Cuisine", "Local Markets", "Family Life"],
      index % 2 === 0 ? "immersive" : "balanced",
      ["Japan", "Italy", "Puerto Rico", "Spain", "Canada"],
      index % 4 === 0 ? ["Vegetarian options"] : [],
    ]
  );
}

async function seedListing(client, hostId, listing, listingIndex) {
  await client.query(
    `INSERT INTO host_listings (
      id, host_id, title, family_story, stay_details, languages, country, city,
      meals, amenities, family_activities, house_rules,
      budget_per_night, budget_per_night_3_guests, budget_per_night_4_guests,
      budget_per_night_5_guests, budget_per_night_6_plus_guests,
      max_capacity, status, published_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
      'published', NOW() - ($19 || ' days')::interval
    )`,
    [
      listing.id,
      hostId,
      listing.title,
      listing.familyStory,
      listing.stayDetails,
      listing.languages,
      listing.country,
      listing.city,
      listing.meals,
      listing.amenities,
      listing.familyActivities,
      listing.houseRules,
      listing.budgetPerNight,
      Math.round(listing.budgetPerNight * 1.15),
      Math.round(listing.budgetPerNight * 1.3),
      Math.round(listing.budgetPerNight * 1.45),
      Math.round(listing.budgetPerNight * 1.6),
      listing.maxCapacity,
      listing.publishedDaysAgo ?? 30,
    ]
  );

  const gallery = resolveCatalogListingGallery(
    listing.city,
    listing.country,
    listing.title,
    listingIndex
  );

  for (let sortOrder = 0; sortOrder < gallery.length; sortOrder++) {
    const entry = gallery[sortOrder];
    await client.query(
      `INSERT INTO listing_photos (listing_id, file_url, caption, sort_order, is_cover)
       VALUES ($1, $2, $3, $4, $5)`,
      [listing.id, entry.url, entry.caption, sortOrder, entry.isCover]
    );
  }

  await client.query(
    `INSERT INTO listing_contact_details (listing_id, contact_email, contact_address)
     VALUES ($1, $2, $3)
     ON CONFLICT (listing_id) DO UPDATE SET
       contact_email = EXCLUDED.contact_email,
       contact_address = EXCLUDED.contact_address,
       updated_at = NOW()`,
    [listing.id, listing.contactEmail, listing.contactAddress]
  );
}

async function seedHostDetails(client, userId, hostProfile) {
  await client.query(
    `INSERT INTO host_profiles (
      user_id, cultural_offerings, household_description, experience_description,
      city, country, neighborhood, max_guests, languages_spoken
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (user_id) DO UPDATE SET
      cultural_offerings = EXCLUDED.cultural_offerings,
      household_description = EXCLUDED.household_description,
      experience_description = EXCLUDED.experience_description,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      neighborhood = EXCLUDED.neighborhood,
      max_guests = EXCLUDED.max_guests,
      languages_spoken = EXCLUDED.languages_spoken,
      updated_at = NOW()`,
    [
      userId,
      hostProfile.culturalOfferings,
      hostProfile.householdDescription,
      hostProfile.experienceDescription,
      hostProfile.city,
      hostProfile.country,
      hostProfile.neighborhood,
      hostProfile.maxGuests,
      hostProfile.languagesSpoken,
    ]
  );
}

async function seedCompletedBooking(client, { requestId, tripId, listingId, hostId, travelerId, start, end, nightlyRate, message }) {
  const nights = Math.max(
    1,
    Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24))
  );
  const total = nightlyRate * nights;

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count,
      status, host_response, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'completed', $8, $9::timestamptz, $9::timestamptz)`,
    [
      requestId,
      travelerId,
      hostId,
      listingId,
      message,
      start,
      end,
      "Thank you for staying with our family!",
      `${start}T12:00:00Z`,
    ]
  );

  await client.query(
    `INSERT INTO trips (
      id, stay_request_id, traveler_id, host_id, listing_id, start_date, end_date,
      status, completed_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8::timestamptz, $8::timestamptz)`,
    [tripId, requestId, travelerId, hostId, listingId, start, end, `${end}T18:00:00Z`]
  );

  await client.query(
    `INSERT INTO stay_bookings (
      stay_request_id, trip_id, listing_id, traveler_id, host_id,
      start_date, end_date, guest_count, nightly_rate, total_amount, payment_status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9, 'paid', $10::timestamptz)`,
    [requestId, tripId, listingId, travelerId, hostId, start, end, nightlyRate, total, `${start}T10:00:00Z`]
  );
}

async function seedListingReview(client, { reviewId, tripId, travelerId, hostId, rating, comment, createdAt }) {
  await client.query(
    `INSERT INTO reviews (
      id, trip_id, reviewer_id, reviewee_id, rating, comment, reviewer_role, moderation_status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'traveler', 'approved', $7::timestamptz)`,
    [reviewId, tripId, travelerId, hostId, rating, comment, createdAt]
  );
}

function buildHost(region, indexInRegion, globalHostIndex) {
  const age = HOST_AGES[globalHostIndex % HOST_AGES.length];
  const spouseAge = age + 3 + (globalHostIndex % 5);
  const firstName = region.firstNames[indexInRegion % region.firstNames.length];
  const lastName = region.lastNames[indexInRegion % region.lastNames.length];
  const city = region.cities[indexInRegion % region.cities.length];
  const location = region.locationSuffix ? `${city}, ${region.locationSuffix}` : `${city}, ${region.country}`;
  const email = `host.${region.code}${String(indexInRegion + 1).padStart(2, "0")}@forebeyond.demo`;
  const budget = 55 + (globalHostIndex % 8) * 10;

  return {
    id: nextUuid("a5000001"),
    email,
    firstName,
    lastName,
    age,
    location,
    phone: `+1 555 ${String(1000 + globalHostIndex).slice(-4)} ${String(2000 + globalHostIndex).slice(-4)}`,
    languages: region.languages,
    bio: `${firstName} (${age}) opens our ${city} home to travelers seeking real local life — not tourist highlights. We host with patience, shared meals, and stories passed down in our family.`,
    hostProfile: {
      city,
      country: region.country,
      neighborhood: `${city} center`,
      maxGuests: 2 + (globalHostIndex % 3),
      householdDescription: `Our household spans generations — ${firstName} (${age}) and their partner (${spouseAge}) share a welcoming home where guests join daily routines.`,
      experienceDescription: `Market mornings, home-cooked meals, and neighborhood walks that reveal how locals actually live in ${city}.`,
      culturalOfferings: ["Home-cooked meals", "Neighborhood tours", "Language exchange", "Family dinners"],
      languagesSpoken: region.languages,
    },
    listing: {
      id: nextUuid("c5000001"),
      title: `${lastName} Family Home in ${city}`,
      familyStory: `The ${lastName} family has lived in ${city} for decades. ${firstName} (${age}) and their partner (${spouseAge}) welcome curious travelers who want conversation at the table, not just a place to sleep.`,
      stayDetails: `Check-in from 3pm. We provide linens, towels, and a light welcome snack. Share dietary needs in advance. Checkout by 11am. WiFi password shared on arrival. We are happy to recommend local transit and day trips.`,
      city,
      country: region.country,
      languages: region.languages,
      meals: ["Breakfast included", "Shared home cooking"],
      amenities: ["Private room", "Shared bathroom", "WiFi", "Laundry access", "Guidebook"],
      familyActivities: ["Cooking together", "Neighborhood walks", "Local market visits", "Evening conversation"],
      houseRules: ["Shoes off indoors", "Quiet hours after 10pm", "No smoking indoors"],
      budgetPerNight: budget,
      maxCapacity: 2 + (globalHostIndex % 3),
      contactEmail: email,
      contactAddress: `${100 + globalHostIndex} Calle ${lastName}, ${city}`,
      publishedDaysAgo: 14 + (globalHostIndex % 60),
    },
  };
}

async function seedTravelers(client) {
  const travelers = [];
  for (let i = 0; i < TRAVELER_COUNT; i++) {
    const firstName = TRAVELER_FIRST[i % TRAVELER_FIRST.length];
    const lastName = TRAVELER_LAST[(i + 3) % TRAVELER_LAST.length];
    const traveler = {
      id: nextUuid("a6000001"),
      email: `guest.${String(i + 1).padStart(2, "0")}@forebeyond.demo`,
      firstName,
      lastName,
      location: ["Boston, USA", "London, UK", "Sydney, Australia", "Berlin, Germany"][i % 4],
    };
    await ensureAuthUser(client, traveler);
    await seedHostProfile(client, traveler.id, traveler, "traveler");
    await seedTravelerProfile(client, traveler.id, i);
    travelers.push(traveler);
  }
  return travelers;
}

async function main() {
  const client = await createPgClient();
  const hosts = [];
  let globalHostIndex = 0;

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    await removePreviousMarketplaceSeed(client);
    await client.query("BEGIN");

    console.log("Seeding marketplace hosts...\n");

    const travelers = await seedTravelers(client);
    let bookingSeq = 0;

    for (const region of REGIONS) {
      for (let i = 0; i < region.count; i++) {
        const host = buildHost(region, i, globalHostIndex);
        const variety = hostVarietyProfile(globalHostIndex);
        globalHostIndex += 1;

        await ensureAuthUser(client, host);
        await seedHostProfile(client, host.id, host, "host", {
          verificationTier: variety.verificationTier,
        });
        await seedHostDetails(client, host.id, host.hostProfile);
        await seedHostVerification(client, host.id, variety.verificationTier);
        await seedListing(client, host.id, host.listing, globalHostIndex - 1);

        const tripsForReviews = [];

        for (let stayIndex = 0; stayIndex < variety.reviewCount; stayIndex++) {
          bookingSeq += 1;
          const traveler = travelers[(globalHostIndex * 5 + stayIndex) % travelers.length];
          const { start, end } = bookingWindow(globalHostIndex, stayIndex);
          const requestId = nextUuid("e5000001");
          const tripId = nextUuid("f5000001");

          await seedCompletedBooking(client, {
            requestId,
            tripId,
            listingId: host.listing.id,
            hostId: host.id,
            travelerId: traveler.id,
            start,
            end,
            nightlyRate: host.listing.budgetPerNight,
            message: `Looking forward to experiencing ${host.listing.city} with your family.`,
          });

          tripsForReviews.push({ tripId, travelerId: traveler.id, start });
        }

        for (let r = 0; r < variety.reviewCount; r++) {
          const trip = tripsForReviews[r];
          await seedListingReview(client, {
            reviewId: nextUuid("d5000001"),
            tripId: trip.tripId,
            travelerId: trip.travelerId,
            hostId: host.id,
            rating: variety.ratings[r],
            comment: REVIEW_COMMENTS[(globalHostIndex + r) % REVIEW_COMMENTS.length],
            createdAt: `${reviewDate(trip.start, 2 + r)}T16:00:00Z`,
          });
        }

        await client.query("SELECT calculate_trust_score($1)", [host.id]);
        const { rows } = await client.query(
          "SELECT trust_score FROM profiles WHERE id = $1",
          [host.id]
        );
        const score = rows[0]?.trust_score ?? 0;
        if (score < MIN_TRUST) {
          throw new Error(`Host ${host.email} trust score ${score} is below ${MIN_TRUST}`);
        }

        hosts.push({
          ...host,
          trustScore: score,
          reviewCount: variety.reviewCount,
          region: region.code,
        });
      }
    }

    await client.query("COMMIT");

    console.log("Marketplace seed complete.\n");
    console.log("Hosts created: %d", hosts.length);
    console.log("Review counts: %s", [...new Set(hosts.map((h) => h.reviewCount))].sort((a, b) => a - b).join(", "));
    console.log("Trust scores: min %d, max %d", Math.min(...hosts.map((h) => h.trustScore)), Math.max(...hosts.map((h) => h.trustScore)));
    console.log("Traveler pool: %d\n", TRAVELER_COUNT);

    for (const region of REGIONS) {
      const regionHosts = hosts.filter((h) => h.region === region.code);
      console.log("%s (%s): %d hosts", region.country, region.code, regionHosts.length);
    }

    console.log("\nSample logins (password: %s):", PASSWORD);
    console.log("  %s", hosts[0]?.email);
    console.log("  %s", hosts[10]?.email);
    console.log("\nSearch: /search");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Marketplace seed failed:", err.message);
  process.exit(1);
});
