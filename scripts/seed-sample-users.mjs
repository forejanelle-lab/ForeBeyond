import { createPgClient } from "./pg-connect.mjs";

const PASSWORD = "ForeBeyond123!";
const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";

const DEMO_USER = {
  id: "a1000000-0000-4000-8000-000000000010",
  email: "demo@forebeyond.demo",
  firstName: "Maria",
  lastName: "Tanaka",
  role: "host",
  bio: "Kyoto native welcoming travelers into our home to share cooking, traditions, and neighborhood life.",
  location: "Kyoto, Japan",
  phone: "+81 75 555 0102",
  languages: ["Japanese", "English"],
  hostProfile: {
    city: "Kyoto",
    country: "Japan",
    neighborhood: "Gion",
    maxGuests: 2,
    householdDescription:
      "Our multigenerational home is warm and quiet, with a small garden and a shared kitchen where we cook together most evenings.",
    experienceDescription:
      "Travelers join our morning market walks, help prepare dinner, and learn simple Japanese phrases over tea.",
    culturalOfferings: ["Home-cooked meals", "Local traditions", "Neighborhood tours", "Language exchange"],
    languagesSpoken: ["Japanese", "English"],
  },
  listing: {
    title: "Maria Tanaka's Family in Kyoto, Japan",
    familyStory:
      "We are the Tanaka family — grandparents, parents, and two children — living in a traditional machiya near Gion. We love welcoming travelers who want to experience daily life in Kyoto, not just the tourist highlights.",
    city: "Kyoto",
    country: "Japan",
    languages: ["Japanese", "English"],
    meals: ["Breakfast included", "Shared home cooking", "Family dinner nightly"],
    amenities: ["Private room", "Shared bathroom", "WiFi", "Garden access"],
    familyActivities: ["Cooking together", "Neighborhood walks", "Local market visits", "Language lessons"],
    houseRules: ["Shoes off indoors", "Quiet hours after 10pm", "Respect local customs"],
    photoUrl:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
  },
  experiences: [
    {
      id: "b1000000-0000-4000-8000-000000000001",
      category: "cooking_class",
      title: "Cooking Classes in Kyoto, Japan",
      description:
        "Learn to prepare traditional Kyoto home cooking — miso soup, seasonal vegetables, and rice — in our family kitchen with grandmother's recipes.",
      city: "Kyoto",
      country: "Japan",
      meetingPoint: "Tanaka home, Gion district",
      durationMinutes: 150,
      maxGuests: 4,
      pricePerPerson: 55,
      languages: ["Japanese", "English"],
      includes: ["Ingredients included", "Meal included", "Take-home recipe"],
      requirements: ["Dietary restrictions noted in advance"],
      photoUrl:
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&auto=format&fit=crop",
    },
    {
      id: "b1000000-0000-4000-8000-000000000002",
      category: "tea_ceremony",
      title: "Tea Ceremonies in Kyoto, Japan",
      description:
        "Experience a traditional Japanese tea ceremony in our tatami room. Learn the history, etiquette, and quiet mindfulness of chanoyu.",
      city: "Kyoto",
      country: "Japan",
      meetingPoint: "Tanaka home, Gion district",
      durationMinutes: 90,
      maxGuests: 6,
      pricePerPerson: 40,
      languages: ["Japanese", "English"],
      includes: ["English interpretation", "Photo opportunities"],
      requirements: ["Modest dress appreciated", "Arrive 10 minutes early"],
      photoUrl:
        "https://images.unsplash.com/photo-1544787210-63a5f8a2a2a2?w=1200&auto=format&fit=crop",
    },
    {
      id: "b1000000-0000-4000-8000-000000000003",
      category: "market_tour",
      title: "Market Tours in Kyoto, Japan",
      description:
        "Walk Nishiki Market with us to discover seasonal ingredients, sample local snacks, and learn how Kyoto families shop and cook.",
      city: "Kyoto",
      country: "Japan",
      meetingPoint: "Nishiki Market west entrance",
      durationMinutes: 120,
      maxGuests: 6,
      pricePerPerson: 35,
      languages: ["Japanese", "English"],
      includes: ["English interpretation", "Small group (max 6)"],
      requirements: ["Comfortable walking shoes"],
      photoUrl:
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&auto=format&fit=crop",
    },
    {
      id: "b1000000-0000-4000-8000-000000000004",
      category: "family_dinner",
      title: "Family Dinners in Kyoto, Japan",
      description:
        "Join our family for a home-cooked dinner. Share stories over seasonal dishes, learn table customs, and feel at home in Kyoto.",
      city: "Kyoto",
      country: "Japan",
      meetingPoint: "Tanaka home, Gion district",
      durationMinutes: 180,
      maxGuests: 4,
      pricePerPerson: 65,
      languages: ["Japanese", "English"],
      includes: ["Meal included", "English interpretation"],
      requirements: ["Dietary restrictions noted in advance", "Arrive 10 minutes early"],
      photoUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&auto=format&fit=crop",
    },
    {
      id: "b1000000-0000-4000-8000-000000000005",
      category: "cultural_workshop",
      title: "Cultural Workshops in Kyoto, Japan",
      description:
        "Try your hand at traditional crafts — origami, calligraphy, or furoshiki wrapping — guided by our family with stories behind each art.",
      city: "Kyoto",
      country: "Japan",
      meetingPoint: "Tanaka home, Gion district",
      durationMinutes: 120,
      maxGuests: 6,
      pricePerPerson: 45,
      languages: ["Japanese", "English"],
      includes: ["English interpretation", "Take-home recipe"],
      requirements: ["Children welcome with adult"],
      photoUrl:
        "https://images.unsplash.com/photo-1528360983277-a13db990da69?w=1200&auto=format&fit=crop",
    },
    {
      id: "b1000000-0000-4000-8000-000000000006",
      category: "hiking",
      title: "Hiking Experiences in Kyoto, Japan",
      description:
        "Hike the Philosopher's Path and nearby hills with us. Discover hidden shrines, seasonal blooms, and local history along the way.",
      city: "Kyoto",
      country: "Japan",
      meetingPoint: "Ginkaku-ji temple entrance",
      durationMinutes: 180,
      maxGuests: 8,
      pricePerPerson: 30,
      languages: ["Japanese", "English"],
      includes: ["English interpretation", "Photo opportunities"],
      requirements: ["Moderate fitness level", "Comfortable walking shoes"],
      photoUrl:
        "https://images.unsplash.com/photo-1493976040364-85c8e8f0f0f0?w=1200&auto=format&fit=crop",
    },
  ],
};

const DEMO_TRAVELER = {
  id: "a1000000-0000-4000-8000-000000000020",
  email: "traveler@forebeyond.demo",
  firstName: "Alex",
  lastName: "Rivera",
  role: "traveler",
  bio: "Curious traveler from California seeking authentic cultural immersion in Japan.",
  location: "San Francisco, USA",
  phone: "+1 415 555 0201",
  languages: ["English", "Spanish"],
  stayRequest: {
    id: "c1000000-0000-4000-8000-000000000001",
    message:
      "Hi Maria! I'm Alex, a teacher from San Francisco planning a two-week trip to Japan. I'd love to experience daily life in Kyoto through your family's traditions, cooking, and neighborhood walks. I'm respectful, curious, and excited to learn.",
    startDate: "2026-09-10",
    endDate: "2026-09-17",
    guestCount: 1,
  },
};

async function ensureAuthUser(client, user) {
  const fullName = `${user.firstName} ${user.lastName}`;
  const meta = {
    first_name: user.firstName,
    last_name: user.lastName,
    full_name: fullName,
  };

  const existing = await client.query("SELECT id FROM auth.users WHERE email = $1", [user.email]);

  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    await client.query(
      `UPDATE auth.users
       SET encrypted_password = crypt($1, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
           raw_user_meta_data = $2::jsonb,
           updated_at = NOW()
       WHERE id = $3`,
      [PASSWORD, JSON.stringify(meta), userId]
    );
    return userId;
  }

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
    ) VALUES (
      $1, $2, $3, 'email',
      $4::jsonb, NOW(), NOW(), NOW()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING`,
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

async function seedProfile(client, userId, user) {
  await client.query(
    `UPDATE profiles SET
      full_name = $2,
      bio = $3,
      location = $4,
      phone = $5,
      languages = $6,
      role = $7::user_role,
      onboarding_step = 'complete',
      onboarding_complete = TRUE,
      verification_status = 'verified',
      email_verified_at = COALESCE(email_verified_at, NOW()),
      phone_verified_at = COALESCE(phone_verified_at, NOW()),
      updated_at = NOW()
     WHERE id = $1`,
    [userId, `${user.firstName} ${user.lastName}`, user.bio, user.location, user.phone, user.languages, user.role]
  );
}

async function seedTravelerProfile(client, userId) {
  await client.query(
    `INSERT INTO traveler_profiles (user_id, interests, travel_style, preferred_destinations, dietary_preferences)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       interests = EXCLUDED.interests,
       travel_style = EXCLUDED.travel_style,
       preferred_destinations = EXCLUDED.preferred_destinations,
       dietary_preferences = EXCLUDED.dietary_preferences,
       updated_at = NOW()`,
    [
      userId,
      ["Cooking & Cuisine", "Language Learning", "History & Heritage"],
      "immersive",
      ["Japan", "Mexico", "Morocco"],
      ["Vegetarian options"],
    ]
  );
}

async function seedHostProfile(client, userId, hostProfile) {
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

async function consolidateDemoHostListing(client, demoHostId, listingTitle) {
  // Move published Maria listings from stale demo host accounts onto demo@forebeyond.demo
  await client.query(
    `UPDATE host_listings hl
     SET host_id = $1, updated_at = NOW()
     FROM auth.users u
     WHERE hl.host_id = u.id
       AND u.email LIKE '%@forebeyond.demo'
       AND u.id <> $1
       AND hl.title = $2
       AND hl.status = 'published'`,
    [demoHostId, listingTitle]
  );

  const { rows: canonicalRows } = await client.query(
    `SELECT id FROM host_listings
     WHERE host_id = $1 AND title = $2 AND status = 'published'
     ORDER BY published_at DESC NULLS LAST, updated_at DESC
     LIMIT 1`,
    [demoHostId, listingTitle]
  );
  const canonicalId = canonicalRows[0]?.id;
  if (!canonicalId) return null;

  // Archive duplicate draft/extra listings for the demo host
  await client.query(
    `UPDATE host_listings
     SET status = 'archived', updated_at = NOW()
     WHERE host_id = $1 AND title = $2 AND id <> $3 AND status <> 'archived'`,
    [demoHostId, listingTitle, canonicalId]
  );

  // Point stay data at the canonical listing + demo host
  await client.query(
    `UPDATE stay_requests
     SET host_id = $1, listing_id = $2, updated_at = NOW()
     WHERE traveler_id <> $1
       AND (
         listing_id IN (SELECT id FROM host_listings WHERE host_id = $1 AND title = $3)
         OR host_id IN (
           SELECT u.id FROM auth.users u
           WHERE u.email LIKE '%@forebeyond.demo' AND u.id <> $1
         )
       )`,
    [demoHostId, canonicalId, listingTitle]
  );

  await client.query(
    `UPDATE trips
     SET host_id = $1, listing_id = $2
     WHERE listing_id IN (SELECT id FROM host_listings WHERE host_id = $1 AND title = $3)
        OR host_id IN (
          SELECT u.id FROM auth.users u
          WHERE u.email LIKE '%@forebeyond.demo' AND u.id <> $1
        )`,
    [demoHostId, canonicalId, listingTitle]
  );

  await client.query(
    `UPDATE stay_bookings
     SET host_id = $1, listing_id = $2, updated_at = NOW()
     WHERE listing_id IN (SELECT id FROM host_listings WHERE host_id = $1 AND title = $3)
        OR host_id IN (
          SELECT u.id FROM auth.users u
          WHERE u.email LIKE '%@forebeyond.demo' AND u.id <> $1
        )`,
    [demoHostId, canonicalId, listingTitle]
  );

  await client.query(
    `UPDATE conversations
     SET host_id = $1, updated_at = NOW()
     WHERE host_id IN (
       SELECT u.id FROM auth.users u
       WHERE u.email LIKE '%@forebeyond.demo' AND u.id <> $1
     )`,
    [demoHostId]
  );

  return canonicalId;
}

async function seedListing(client, userId, listing) {
  const existing = await client.query(
    `SELECT id, status FROM host_listings
     WHERE host_id = $1 AND title = $2
     ORDER BY CASE WHEN status = 'published' THEN 0 ELSE 1 END, created_at
     LIMIT 1`,
    [userId, listing.title]
  );

  let listingId = existing.rows[0]?.id;

  if (listingId) {
    await client.query(
      `UPDATE host_listings SET
        title = $2, family_story = $3, languages = $4, country = $5, city = $6,
        meals = $7, amenities = $8, family_activities = $9, house_rules = $10,
        budget_per_night = 85,
        status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW()
       WHERE id = $1`,
      [
        listingId,
        listing.title,
        listing.familyStory,
        listing.languages,
        listing.country,
        listing.city,
        listing.meals,
        listing.amenities,
        listing.familyActivities,
        listing.houseRules,
      ]
    );
  } else {
    const { rows } = await client.query(
      `INSERT INTO host_listings (
        host_id, title, family_story, languages, country, city,
        meals, amenities, family_activities, house_rules, budget_per_night,
        status, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 85, 'published', NOW())
      RETURNING id`,
      [
        userId,
        listing.title,
        listing.familyStory,
        listing.languages,
        listing.country,
        listing.city,
        listing.meals,
        listing.amenities,
        listing.familyActivities,
        listing.houseRules,
      ]
    );
    listingId = rows[0].id;
  }

  await client.query("DELETE FROM listing_photos WHERE listing_id = $1", [listingId]);
  await client.query(
    `INSERT INTO listing_photos (listing_id, file_url, caption, sort_order, is_cover)
     VALUES ($1, $2, 'Family home in Kyoto', 0, TRUE)`,
    [listingId, listing.photoUrl]
  );

  const canonicalId = await consolidateDemoHostListing(client, userId, listing.title);
  return canonicalId ?? listingId;
}

async function seedExperiences(client, userId, experiences) {
  const seededIds = [];

  for (const exp of experiences) {
    const existing = await client.query(
      "SELECT id FROM host_experiences WHERE id = $1",
      [exp.id]
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE host_experiences SET
          host_id = $2, title = $3, description = $4, category = $5::experience_category,
          languages = $6, country = $7, city = $8, meeting_point = $9,
          duration_minutes = $10, max_guests = $11, price_per_person = $12,
          includes = $13, requirements = $14,
          status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW()
         WHERE id = $1`,
        [
          exp.id,
          userId,
          exp.title,
          exp.description,
          exp.category,
          exp.languages,
          exp.country,
          exp.city,
          exp.meetingPoint,
          exp.durationMinutes,
          exp.maxGuests,
          exp.pricePerPerson,
          exp.includes,
          exp.requirements,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO host_experiences (
          id, host_id, title, description, category, languages, country, city,
          meeting_point, duration_minutes, max_guests, price_per_person,
          includes, requirements, status, published_at
        ) VALUES (
          $1, $2, $3, $4, $5::experience_category, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          'published', NOW()
        )`,
        [
          exp.id,
          userId,
          exp.title,
          exp.description,
          exp.category,
          exp.languages,
          exp.country,
          exp.city,
          exp.meetingPoint,
          exp.durationMinutes,
          exp.maxGuests,
          exp.pricePerPerson,
          exp.includes,
          exp.requirements,
        ]
      );
    }

    await client.query("DELETE FROM experience_photos WHERE experience_id = $1", [exp.id]);
    await client.query(
      `INSERT INTO experience_photos (experience_id, file_url, caption, sort_order, is_cover)
       VALUES ($1, $2, $3, 0, TRUE)`,
      [exp.id, exp.photoUrl, exp.title]
    );

    seededIds.push(exp.id);
  }

  return seededIds;
}

async function seedStayRequest(client, travelerId, hostId, listingId, request) {
  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
    ON CONFLICT (id) DO UPDATE SET
      message = EXCLUDED.message,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      guest_count = EXCLUDED.guest_count,
      status = 'pending',
      updated_at = NOW()`,
    [
      request.id,
      travelerId,
      hostId,
      listingId,
      request.message,
      request.startDate,
      request.endDate,
      request.guestCount,
    ]
  );
  return request.id;
}

async function seedApprovedStayWithMessages(client, travelerId, hostId, listingId) {
  const requestId = "c1000000-0000-4000-8000-000000000002";
  const conversationId = "d1000000-0000-4000-8000-000000000001";

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count,
      status, host_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'approved', $8)
    ON CONFLICT (id) DO UPDATE SET
      status = 'approved',
      host_response = EXCLUDED.host_response,
      updated_at = NOW()`,
    [
      requestId,
      travelerId,
      hostId,
      listingId,
      "Excited to visit Kyoto and learn about your family's traditions!",
      "2026-10-05",
      "2026-10-12",
      "Welcome Alex! We would love to host you. See you in October.",
    ]
  );

  let tripId;
  const existingTrip = await client.query(
    "SELECT id FROM trips WHERE stay_request_id = $1 LIMIT 1",
    [requestId]
  );
  if (existingTrip.rows.length > 0) {
    tripId = existingTrip.rows[0].id;
  } else {
    const { rows: tripRows } = await client.query(
      `INSERT INTO trips (
        stay_request_id, traveler_id, host_id, listing_id, start_date, end_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'upcoming')
      RETURNING id`,
      [requestId, travelerId, hostId, listingId, "2026-10-05", "2026-10-12"]
    );
    tripId = tripRows[0].id;
  }

  await client.query(
    `INSERT INTO stay_bookings (
      stay_request_id, trip_id, listing_id, traveler_id, host_id,
      start_date, end_date, guest_count, nightly_rate, total_amount, payment_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 85, 595, 'pending')
    ON CONFLICT (stay_request_id) DO UPDATE SET trip_id = EXCLUDED.trip_id`,
    [requestId, tripId, listingId, travelerId, hostId, "2026-10-05", "2026-10-12"]
  );

  await client.query(
    `INSERT INTO conversations (id, stay_request_id, traveler_id, host_id, last_message_at, last_message_preview)
     VALUES ($1, $2, $3, $4, NOW(), 'Looking forward to meeting you!')
     ON CONFLICT (stay_request_id) DO UPDATE SET
       last_message_at = NOW(),
       last_message_preview = EXCLUDED.last_message_preview`,
    [conversationId, requestId, travelerId, hostId]
  );

  await client.query("DELETE FROM stay_messages WHERE conversation_id = $1", [conversationId]);

  const messages = [
    {
      id: "e1000000-0000-4000-8000-000000000001",
      senderId: hostId,
      body: "Welcome Alex! We are so happy you chose our family. Do you have any dietary preferences?",
    },
    {
      id: "e1000000-0000-4000-8000-000000000002",
      senderId: travelerId,
      body: "Thank you Maria! I eat mostly vegetarian but I'm flexible. Can't wait to try home cooking.",
    },
    {
      id: "e1000000-0000-4000-8000-000000000003",
      senderId: hostId,
      body: "Perfect — we cook many vegetable dishes. Looking forward to meeting you!",
    },
  ];

  for (const msg of messages) {
    await client.query(
      `INSERT INTO stay_messages (
        id, stay_request_id, conversation_id, sender_id, body, message_type
      ) VALUES ($1, $2, $3, $4, $5, 'text')`,
      [msg.id, requestId, conversationId, msg.senderId, msg.body]
    );
  }

  return { requestId, conversationId, tripId };
}

async function seedCompletedTripWithReviews(client, travelerId, hostId, listingId) {
  const requestId = "c1000000-0000-4000-8000-000000000003";
  const tripId = "f1000000-0000-4000-8000-000000000001";
  const moderationRequestId = "c1000000-0000-4000-8000-000000000004";
  const moderationTripId = "f1000000-0000-4000-8000-000000000002";

  await client.query(
    `UPDATE profiles SET is_trust_moderator = FALSE, is_admin = FALSE WHERE id = $1`,
    [hostId]
  );

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count,
      status, host_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'completed', $8)
    ON CONFLICT (id) DO UPDATE SET status = 'completed', updated_at = NOW()`,
    [
      requestId,
      travelerId,
      hostId,
      listingId,
      "Thank you for a wonderful stay in Kyoto!",
      "2026-06-01",
      "2026-06-08",
      "It was our pleasure hosting you, Alex!",
    ]
  );

  await client.query(
    `INSERT INTO trips (
      id, stay_request_id, traveler_id, host_id, listing_id, start_date, end_date, status, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'completed', completed_at = NOW()`,
    [tripId, requestId, travelerId, hostId, listingId, "2026-06-01", "2026-06-08"]
  );

  await client.query(
    `INSERT INTO stay_bookings (
      stay_request_id, trip_id, listing_id, traveler_id, host_id,
      start_date, end_date, guest_count, nightly_rate, total_amount, payment_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 85, 595, 'paid')
    ON CONFLICT (stay_request_id) DO UPDATE SET payment_status = 'paid', trip_id = EXCLUDED.trip_id`,
    [requestId, tripId, listingId, travelerId, hostId, "2026-06-01", "2026-06-08"]
  );

  await client.query(
    `DELETE FROM reviews WHERE trip_id IN ($1, $2)`,
    [tripId, moderationTripId]
  );

  await client.query(
    `INSERT INTO reviews (
      id, trip_id, reviewer_id, reviewee_id, rating, comment, reviewer_role, moderation_status, moderated_at
    ) VALUES
      ('a1000000-0000-4000-8000-000000000001', $1, $2, $3, 5,
       'Maria and her family were incredibly welcoming. The home cooking was unforgettable!',
       'traveler', 'approved', NOW()),
      ('a1000000-0000-4000-8000-000000000002', $1, $3, $2, 5,
       'Alex was respectful, curious, and a joy to host. Highly recommend!',
       'host', 'approved', NOW())`,
    [tripId, travelerId, hostId]
  );

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count,
      status, host_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'completed', $8)
    ON CONFLICT (id) DO UPDATE SET status = 'completed', updated_at = NOW()`,
    [
      moderationRequestId,
      travelerId,
      hostId,
      listingId,
      "Second visit to Kyoto.",
      "2026-05-10",
      "2026-05-15",
      "Welcome back!",
    ]
  );

  await client.query(
    `INSERT INTO trips (
      id, stay_request_id, traveler_id, host_id, listing_id, start_date, end_date, status, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'completed', completed_at = NOW()`,
    [moderationTripId, moderationRequestId, travelerId, hostId, listingId, "2026-05-10", "2026-05-15"]
  );

  await client.query(
    `INSERT INTO stay_bookings (
      stay_request_id, trip_id, listing_id, traveler_id, host_id,
      start_date, end_date, guest_count, nightly_rate, total_amount, payment_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 85, 425, 'paid')
    ON CONFLICT (stay_request_id) DO UPDATE SET payment_status = 'paid', trip_id = EXCLUDED.trip_id`,
    [moderationRequestId, moderationTripId, listingId, travelerId, hostId, "2026-05-10", "2026-05-15"]
  );

  await client.query(
    `INSERT INTO reviews (
      id, trip_id, reviewer_id, reviewee_id, rating, comment, reviewer_role, moderation_status
    ) VALUES (
      'a1000000-0000-4000-8000-000000000003', $1, $2, $3, 2,
      'The stay did not meet my expectations regarding cleanliness.',
      'traveler', 'pending'
    )`,
    [moderationTripId, travelerId, hostId]
  );

  await client.query("SELECT calculate_trust_score($1)", [hostId]);
  await client.query("SELECT calculate_trust_score($1)", [travelerId]);

  return { tripId, moderationTripId };
}

async function seedSampleReport(client, travelerId, hostId, listingId) {
  await client.query(
    `INSERT INTO content_reports (
      id, reporter_id, reported_user_id, reported_listing_id, category, description, status
    ) VALUES (
      'a1000000-0000-4000-8000-000000000010',
      $1, $2, $3, 'other', 'Demo report for admin moderation testing.', 'pending'
    )
    ON CONFLICT (id) DO UPDATE SET status = 'pending', description = EXCLUDED.description`,
    [travelerId, hostId, listingId]
  );
}

async function seedTrustExtras(client, userId) {
  const badges = ["identity_verified", "phone_verified", "address_verified", "trusted_member"];
  for (const badge of badges) {
    await client.query(
      `INSERT INTO trust_badges (user_id, badge_type)
       VALUES ($1, $2::badge_type)
       ON CONFLICT (user_id, badge_type) DO NOTHING`,
      [userId, badge]
    );
  }

  await client.query("SELECT calculate_trust_score($1)", [userId]);
}

async function main() {
  const client = await createPgClient();
  console.log("Seeding Fore Beyond demo user...\n");

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    await client.query("BEGIN");

    const userId = await ensureAuthUser(client, DEMO_USER);
    await seedProfile(client, userId, DEMO_USER);
    await seedHostProfile(client, userId, DEMO_USER.hostProfile);
    const listingId = await seedListing(client, userId, DEMO_USER.listing);
    const experienceIds = await seedExperiences(client, userId, DEMO_USER.experiences);
    await seedTrustExtras(client, userId);

    const travelerId = await ensureAuthUser(client, DEMO_TRAVELER);
    await seedProfile(client, travelerId, DEMO_TRAVELER);
    await seedTravelerProfile(client, travelerId);
    const stayRequestId = await seedStayRequest(
      client,
      travelerId,
      userId,
      listingId,
      DEMO_TRAVELER.stayRequest
    );
    const approvedDemo = await seedApprovedStayWithMessages(
      client,
      travelerId,
      userId,
      listingId
    );
    const completedDemo = await seedCompletedTripWithReviews(
      client,
      travelerId,
      userId,
      listingId
    );
    await seedSampleReport(client, travelerId, userId, listingId);

    await client.query("COMMIT");

    console.log("Demo login (password: %s)\n", PASSWORD);
    console.log("  Host: %s — %s %s", DEMO_USER.email, DEMO_USER.firstName, DEMO_USER.lastName);
    console.log("  Traveler: %s — %s %s", DEMO_TRAVELER.email, DEMO_TRAVELER.firstName, DEMO_TRAVELER.lastName);
    if (listingId) {
      console.log("\n  Published sample listing: /families/%s", listingId);
    }
    if (experienceIds.length > 0) {
      console.log("\n  Published sample experiences:");
      for (const exp of DEMO_USER.experiences) {
        console.log("    /experiences/%s — %s", exp.id, exp.title);
      }
    }
    if (stayRequestId) {
      console.log("\n  Pending stay request:");
      console.log("    Traveler view: /dashboard/requests/%s", stayRequestId);
      console.log("    Host review:   /host/requests/%s", stayRequestId);
    }
    if (approvedDemo?.conversationId) {
      console.log("\n  Approved stay with messaging:");
      console.log("    Messages: /messages/%s", approvedDemo.conversationId);
      if (approvedDemo.tripId) {
        console.log("    Trip:     /trips/%s", approvedDemo.tripId);
      }
    }
    if (completedDemo?.tripId) {
      console.log("\n  Completed stay with reviews:");
      console.log("    Trip:       /trips/%s", completedDemo.tripId);
      console.log("    Moderation: /trust-center/reviews");
    }
    console.log("\n  Admin dashboard (demo host only): /admin");
    console.log("\nDone.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
