import { createPgClient } from "./pg-connect.mjs";

const PASSWORD = "ForeBeyond123!";
const INSTANCE_ID = "00000000-0000-0000-0000-000000000000";
const ADMIN_EMAIL = "forebeyond@gmail.com";

const ADMIN = {
  id: "a2200001-0000-4000-8000-000000000001",
  email: ADMIN_EMAIL,
  firstName: "Janelle",
  lastName: "Fore",
  bio: "Fore Beyond platform administrator.",
  location: "USA",
  languages: ["English"],
};

const HOSTS = [
  {
    id: "a2000001-0000-4000-8000-000000000001",
    email: "maria@forebeyond.demo",
    firstName: "Maria",
    lastName: "Tanaka",
    bio: "Kyoto native sharing home cooking, tea culture, and neighborhood walks with curious travelers.",
    location: "Kyoto, Japan",
    phone: "+81 75 555 0101",
    languages: ["Japanese", "English"],
    hostProfile: {
      city: "Kyoto",
      country: "Japan",
      neighborhood: "Gion",
      maxGuests: 3,
      householdDescription:
        "A multigenerational machiya with a small garden and shared kitchen where we cook together most evenings.",
      experienceDescription:
        "Morning market walks, seasonal home cooking, and quiet tea ceremonies in our tatami room.",
      culturalOfferings: ["Home-cooked meals", "Tea ceremony", "Neighborhood tours", "Language exchange"],
      languagesSpoken: ["Japanese", "English"],
    },
    listing: {
      id: "c2000001-0000-4000-8000-000000000001",
      title: "Tanaka Family Home in Kyoto",
      familyStory:
        "We are the Tanaka family — grandparents, parents, and two children — living in a traditional home near Gion.",
      city: "Kyoto",
      country: "Japan",
      languages: ["Japanese", "English"],
      meals: ["Breakfast included", "Shared home cooking"],
      amenities: ["Private room", "Shared bathroom", "WiFi", "Garden access"],
      familyActivities: ["Cooking together", "Neighborhood walks", "Local market visits"],
      houseRules: ["Shoes off indoors", "Quiet hours after 10pm"],
      photoUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
      budgetPerNight: 85,
      maxCapacity: 3,
    },
    experiences: [
      {
        id: "b2000001-0000-4000-8000-000000000001",
        category: "cooking_class",
        title: "Kyoto Home Cooking Class",
        visibility: "all_members",
        description: "Prepare miso soup, seasonal vegetables, and rice using grandmother's recipes in our family kitchen.",
        city: "Kyoto",
        country: "Japan",
        meetingPoint: "Tanaka home, Gion district",
        durationMinutes: 150,
        maxGuests: 4,
        pricePerPerson: 55,
        languages: ["Japanese", "English"],
        includes: ["Ingredients included", "Meal included", "Take-home recipe"],
        requirements: ["Dietary restrictions noted in advance"],
        photoUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80",
      },
      {
        id: "b2000002-0000-4000-8000-000000000002",
        category: "tea_ceremony",
        title: "Private Tea Ceremony for Guests",
        visibility: "approved_guests_only",
        description: "An intimate chanoyu session reserved for travelers staying with our family.",
        city: "Kyoto",
        country: "Japan",
        meetingPoint: "Tanaka home, Gion district",
        durationMinutes: 90,
        maxGuests: 4,
        pricePerPerson: 40,
        languages: ["Japanese", "English"],
        includes: ["English interpretation", "Photo opportunities"],
        requirements: ["Modest dress appreciated"],
        photoUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1200&q=80",
      },
    ],
  },
  {
    id: "a2000002-0000-4000-8000-000000000002",
    email: "lucia@forebeyond.demo",
    firstName: "Lucia",
    lastName: "Rossi",
    bio: "Florentine host who loves introducing guests to Tuscan markets, pasta traditions, and slow Sunday lunches.",
    location: "Florence, Italy",
    phone: "+39 055 555 0202",
    languages: ["Italian", "English"],
    hostProfile: {
      city: "Florence",
      country: "Italy",
      neighborhood: "Oltrarno",
      maxGuests: 4,
      householdDescription:
        "Our apartment overlooks a quiet piazza. We cook together and share long meals with friends and guests.",
      experienceDescription:
        "Market mornings, handmade pasta, and stories about Florentine craft traditions.",
      culturalOfferings: ["Pasta making", "Market tours", "Family dinners", "Art walks"],
      languagesSpoken: ["Italian", "English"],
    },
    listing: {
      id: "c2000002-0000-4000-8000-000000000002",
      title: "Rossi Family in Florence",
      familyStory:
        "Lucia, Marco, and their teenage daughter welcome travelers who want real Florentine daily life beyond the museums.",
      city: "Florence",
      country: "Italy",
      languages: ["Italian", "English"],
      meals: ["Shared home cooking", "Family dinner nightly"],
      amenities: ["Private room", "WiFi", "Balcony", "Shared bathroom"],
      familyActivities: ["Pasta making", "Market visits", "Evening walks"],
      houseRules: ["No smoking indoors", "Help clear the table after meals"],
      photoUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&q=80",
      budgetPerNight: 95,
      maxCapacity: 4,
    },
    experiences: [
      {
        id: "b2000003-0000-4000-8000-000000000003",
        category: "market_tour",
        title: "Sant'Ambrogio Market Tour",
        visibility: "all_members",
        description: "Shop the morning market with us, taste local cheeses, and learn how Florentine families cook seasonally.",
        city: "Florence",
        country: "Italy",
        meetingPoint: "Sant'Ambrogio Market entrance",
        durationMinutes: 120,
        maxGuests: 6,
        pricePerPerson: 38,
        languages: ["Italian", "English"],
        includes: ["Market tastings", "Small group (max 6)"],
        requirements: ["Comfortable walking shoes"],
        photoUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80",
      },
      {
        id: "b2000004-0000-4000-8000-000000000004",
        category: "cooking_class",
        title: "Guest-Only Pasta Workshop",
        visibility: "approved_guests_only",
        description: "Roll tagliatelle and ragù with our family — exclusive to travelers staying in our home.",
        city: "Florence",
        country: "Italy",
        meetingPoint: "Rossi apartment, Oltrarno",
        durationMinutes: 180,
        maxGuests: 4,
        pricePerPerson: 60,
        languages: ["Italian", "English"],
        includes: ["Meal included", "Take-home recipe"],
        requirements: ["Arrive 10 minutes early"],
        photoUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80",
      },
    ],
  },
  {
    id: "a2000003-0000-4000-8000-000000000003",
    email: "amina@forebeyond.demo",
    firstName: "Amina",
    lastName: "El Fassi",
    bio: "Marrakech host offering warm hospitality, mint tea rituals, and hands-on craft workshops in the medina.",
    location: "Marrakech, Morocco",
    phone: "+212 524 555 0303",
    languages: ["Arabic", "French", "English"],
    hostProfile: {
      city: "Marrakech",
      country: "Morocco",
      neighborhood: "Medina",
      maxGuests: 3,
      householdDescription:
        "Our riad courtyard is filled with citrus trees. We host travelers who appreciate unhurried conversation.",
      experienceDescription:
        "Spice markets, bread baking, and zellige tile stories passed down through our family.",
      culturalOfferings: ["Mint tea hospitality", "Craft workshops", "Medina walks", "Home cooking"],
      languagesSpoken: ["Arabic", "French", "English"],
    },
    listing: {
      id: "c2000003-0000-4000-8000-000000000003",
      title: "El Fassi Riad in Marrakech",
      familyStory:
        "Three generations live in our restored riad. Guests join us for tea on the rooftop and meals in the courtyard.",
      city: "Marrakech",
      country: "Morocco",
      languages: ["Arabic", "French", "English"],
      meals: ["Breakfast included", "Shared home cooking"],
      amenities: ["Private room", "Rooftop terrace", "WiFi", "Courtyard"],
      familyActivities: ["Tea rituals", "Medina walks", "Bread baking"],
      houseRules: ["Remove shoes in riad", "Modest dress in medina"],
      photoUrl: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&q=80",
      budgetPerNight: 70,
      maxCapacity: 3,
    },
    experiences: [
      {
        id: "b2000005-0000-4000-8000-000000000005",
        category: "cultural_workshop",
        title: "Zellige Tile Workshop for Guests",
        visibility: "approved_guests_only",
        description: "Learn traditional zellige patterns with Amina's uncle — available only to approved homestay guests.",
        city: "Marrakech",
        country: "Morocco",
        meetingPoint: "El Fassi riad courtyard",
        durationMinutes: 120,
        maxGuests: 4,
        pricePerPerson: 42,
        languages: ["Arabic", "French", "English"],
        includes: ["Materials included", "English interpretation"],
        requirements: ["Children welcome with adult"],
        photoUrl: "https://images.unsplash.com/photo-1515378791034-0648a3ef77b2?w=1200&q=80",
      },
    ],
  },
  {
    id: "a2000004-0000-4000-8000-000000000004",
    email: "carlos@forebeyond.demo",
    firstName: "Carlos",
    lastName: "Mendoza",
    bio: "Mexico City host sharing family recipes, mercado culture, and lively Sunday comidas with travelers.",
    location: "Mexico City, Mexico",
    phone: "+52 55 5555 0404",
    languages: ["Spanish", "English"],
    hostProfile: {
      city: "Mexico City",
      country: "Mexico",
      neighborhood: "Coyoacán",
      maxGuests: 4,
      householdDescription:
        "Colorful home near Frida Kahlo's neighborhood. Our kitchen is the heart of every gathering.",
      experienceDescription:
        "Tortilla making, salsa workshops, and mercado tours with stories from Carlos's abuela.",
      culturalOfferings: ["Home cooking", "Mercado tours", "Family dinners", "Music nights"],
      languagesSpoken: ["Spanish", "English"],
    },
    listing: {
      id: "c2000004-0000-4000-8000-000000000004",
      title: "Mendoza Family in Coyoacán",
      familyStory:
        "Carlos, Elena, and their extended family love hosting curious travelers over long tables and loud laughter.",
      city: "Mexico City",
      country: "Mexico",
      languages: ["Spanish", "English"],
      meals: ["Breakfast included", "Family dinner nightly"],
      amenities: ["Private room", "WiFi", "Garden patio", "Shared bathroom"],
      familyActivities: ["Tortilla making", "Mercado visits", "Evening music"],
      houseRules: ["Respect quiet hours after 11pm", "Shoes off indoors"],
      photoUrl: "https://images.unsplash.com/photo-1518105779142-d97588322f30?w=1200&q=80",
      budgetPerNight: 65,
      maxCapacity: 4,
    },
    experiences: [
      {
        id: "b2000006-0000-4000-8000-000000000006",
        category: "family_dinner",
        title: "Sunday Comida with the Mendozas",
        visibility: "approved_guests_only",
        description: "Join our extended family for a slow Sunday meal — mole, tortillas, and stories reserved for homestay guests.",
        city: "Mexico City",
        country: "Mexico",
        meetingPoint: "Mendoza home, Coyoacán",
        durationMinutes: 180,
        maxGuests: 6,
        pricePerPerson: 48,
        languages: ["Spanish", "English"],
        includes: ["Meal included", "English interpretation"],
        requirements: ["Dietary restrictions noted in advance"],
        photoUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
      },
    ],
  },
  {
    id: "a2000005-0000-4000-8000-000000000005",
    email: "ines@forebeyond.demo",
    firstName: "Inês",
    lastName: "Silva",
    bio: "Lisbon host who guides coastal walks, fado evenings, and pastel de nata baking with her mother.",
    location: "Lisbon, Portugal",
    phone: "+351 21 555 0505",
    languages: ["Portuguese", "English"],
    hostProfile: {
      city: "Lisbon",
      country: "Portugal",
      neighborhood: "Alfama",
      maxGuests: 2,
      householdDescription:
        "Small apartment with river views. We keep gatherings intimate and unhurried.",
      experienceDescription:
        "Alfama alley walks, tile history, and baking pastel de nata in our kitchen.",
      culturalOfferings: ["Coastal walks", "Pastry baking", "Fado culture", "Language exchange"],
      languagesSpoken: ["Portuguese", "English"],
    },
    listing: {
      id: "c2000005-0000-4000-8000-000000000005",
      title: "Silva Family in Alfama",
      familyStory:
        "Inês lives with her mother in Alfama. They welcome travelers who want Lisbon beyond the tram lines.",
      city: "Lisbon",
      country: "Portugal",
      languages: ["Portuguese", "English"],
      meals: ["Breakfast included", "Shared home cooking"],
      amenities: ["Private room", "River views", "WiFi", "Shared bathroom"],
      familyActivities: ["Alfama walks", "Pastry baking", "Sunset viewpoints"],
      houseRules: ["Quiet building — respect neighbors", "No smoking"],
      photoUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80",
      budgetPerNight: 78,
      maxCapacity: 2,
    },
    experiences: [
      {
        id: "b2000007-0000-4000-8000-000000000007",
        category: "hiking",
        title: "Coastal Walk for Homestay Guests",
        visibility: "approved_guests_only",
        description: "Walk cliffside trails near Cascais with Inês — offered only to travelers staying in our Alfama home.",
        city: "Lisbon",
        country: "Portugal",
        meetingPoint: "Silva home, Alfama (transport included to trailhead)",
        durationMinutes: 240,
        maxGuests: 4,
        pricePerPerson: 35,
        languages: ["Portuguese", "English"],
        includes: ["Transportation provided", "Photo opportunities"],
        requirements: ["Moderate fitness level", "Comfortable walking shoes"],
        photoUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
      },
    ],
  },
];

const GUESTS = [
  { id: "a2100001-0000-4000-8000-000000000001", email: "alex@forebeyond.demo", firstName: "Alex", lastName: "Rivera", location: "San Francisco, USA" },
  { id: "a2100002-0000-4000-8000-000000000002", email: "sam@forebeyond.demo", firstName: "Sam", lastName: "Chen", location: "Toronto, Canada" },
  { id: "a2100003-0000-4000-8000-000000000003", email: "jordan@forebeyond.demo", firstName: "Jordan", lastName: "Okonkwo", location: "London, UK" },
  { id: "a2100004-0000-4000-8000-000000000004", email: "morgan@forebeyond.demo", firstName: "Morgan", lastName: "Lee", location: "Seattle, USA" },
  { id: "a2100005-0000-4000-8000-000000000005", email: "riley@forebeyond.demo", firstName: "Riley", lastName: "Patel", location: "Chicago, USA" },
  { id: "a2100006-0000-4000-8000-000000000006", email: "casey@forebeyond.demo", firstName: "Casey", lastName: "Brooks", location: "Melbourne, Australia" },
  { id: "a2100007-0000-4000-8000-000000000007", email: "taylor@forebeyond.demo", firstName: "Taylor", lastName: "Nguyen", location: "Austin, USA" },
  { id: "a2100008-0000-4000-8000-000000000008", email: "quinn@forebeyond.demo", firstName: "Quinn", lastName: "Schmidt", location: "Berlin, Germany" },
  { id: "a2100009-0000-4000-8000-000000000009", email: "drew@forebeyond.demo", firstName: "Drew", lastName: "Martinez", location: "Denver, USA" },
  { id: "a2100010-0000-4000-8000-000000000010", email: "jamie@forebeyond.demo", firstName: "Jamie", lastName: "Wright", location: "Portland, USA" },
];

const PENDING_VERIFY_USER = {
  id: "a2300001-0000-4000-8000-000000000001",
  email: "verify.pending@forebeyond.demo",
  firstName: "Priya",
  lastName: "Sharma",
  bio: "New member submitting identity verification for admin review.",
  location: "Boston, USA",
  languages: ["English", "Hindi"],
};

async function seedModerationDemoData(client, ids) {
  const { adminId, firstHost, firstGuest, secondHost } = ids;

  await ensureAuthUser(client, PENDING_VERIFY_USER);
  await seedProfile(client, PENDING_VERIFY_USER.id, PENDING_VERIFY_USER, "traveler", {
    isAdmin: false,
  });
  await client.query(
    `UPDATE profiles SET verification_status = 'pending', onboarding_complete = TRUE WHERE id = $1`,
    [PENDING_VERIFY_USER.id]
  );
  await seedTravelerProfile(client, PENDING_VERIFY_USER.id, 3);

  await client.query(
    `INSERT INTO verification_documents (id, user_id, document_type, file_url, status)
     VALUES
       ('d3000001-0000-4000-8000-000000000001', $1, 'government_id',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80', 'pending'),
       ('d3000001-0000-4000-8000-000000000002', $1, 'selfie',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80', 'in_review')`,
    [PENDING_VERIFY_USER.id]
  );

  const requestId = "c3000001-0000-4000-8000-000000000001";
  const tripId = "f3000001-0000-4000-8000-000000000001";
  const requestId2 = "c3000001-0000-4000-8000-000000000002";
  const tripId2 = "f3000001-0000-4000-8000-000000000002";

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count,
      status, host_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'completed', $8)`,
    [
      requestId,
      firstGuest,
      firstHost.id,
      firstHost.listingId,
      "Wonderful stay — sharing an honest review for moderation testing.",
      "2026-04-10",
      "2026-04-17",
      "Thank you for staying with our family!",
    ]
  );

  await client.query(
    `INSERT INTO trips (
      id, stay_request_id, traveler_id, host_id, listing_id, start_date, end_date, status, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW())`,
    [tripId, requestId, firstGuest, firstHost.id, firstHost.listingId, "2026-04-10", "2026-04-17"]
  );

  await client.query(
    `INSERT INTO stay_bookings (
      stay_request_id, trip_id, listing_id, traveler_id, host_id,
      start_date, end_date, guest_count, nightly_rate, total_amount, payment_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 85, 595, 'paid')`,
    [requestId, tripId, firstHost.listingId, firstGuest, firstHost.id, "2026-04-10", "2026-04-17"]
  );

  await client.query(
    `INSERT INTO reviews (
      id, trip_id, reviewer_id, reviewee_id, rating, comment, reviewer_role, moderation_status
    ) VALUES
      ('a3000001-0000-4000-8000-000000000001', $1, $2, $3, 2,
       'The room was smaller than expected and communication was slow.',
       'traveler', 'pending'),
      ('a3000001-0000-4000-8000-000000000002', $1, $3, $2, 3,
       'Guest left early without notice — hoping for a fair resolution.',
       'host', 'pending')`,
    [tripId, firstGuest, firstHost.id]
  );

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count,
      status, host_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'completed', $8)`,
    [
      requestId2,
      secondHost.guestTravelerId,
      secondHost.id,
      secondHost.listingId,
      "Completed stay in Mexico City.",
      "2026-03-01",
      "2026-03-06",
      "Gracias!",
    ]
  );

  await client.query(
    `INSERT INTO trips (
      id, stay_request_id, traveler_id, host_id, listing_id, start_date, end_date, status, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW())`,
    [
      tripId2,
      requestId2,
      secondHost.guestTravelerId,
      secondHost.id,
      secondHost.listingId,
      "2026-03-01",
      "2026-03-06",
    ]
  );

  await client.query(
    `INSERT INTO stay_bookings (
      stay_request_id, trip_id, listing_id, traveler_id, host_id,
      start_date, end_date, guest_count, nightly_rate, total_amount, payment_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 65, 325, 'paid')`,
    [
      requestId2,
      tripId2,
      secondHost.listingId,
      secondHost.guestTravelerId,
      secondHost.id,
      "2026-03-01",
      "2026-03-06",
    ]
  );

  await client.query(
    `INSERT INTO reviews (
      id, trip_id, reviewer_id, reviewee_id, rating, comment, reviewer_role, moderation_status
    ) VALUES (
      'a3000001-0000-4000-8000-000000000003', $1, $2, $3, 1,
      'Listing amenities did not match the description.',
      'traveler', 'pending'
    )`,
    [tripId2, secondHost.guestTravelerId, secondHost.id]
  );

  await client.query(
    `INSERT INTO content_reports (
      id, reporter_id, reported_user_id, reported_listing_id, category, description, status
    ) VALUES
      ('e3000001-0000-4000-8000-000000000001', $1, $2, NULL, 'inappropriate',
       'Guest sent inappropriate photos in a stay request message.', 'pending'),
      ('e3000001-0000-4000-8000-000000000002', $3, $4, $5, 'fraud',
       'Listing photos appear misleading compared to the actual home.', 'reviewing'),
      ('e3000001-0000-4000-8000-000000000003', $6, $4, NULL, 'harassment',
       'Host was rude during pre-approval messaging.', 'pending')`,
    [
      firstHost.id,
      firstGuest,
      GUESTS[1].id,
      HOSTS[3].id,
      HOSTS[3].listing.id,
      GUESTS[2].id,
    ]
  );

  const verifyRequestId = "c3000001-0000-4000-8000-000000000003";

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date, guest_count,
      status, host_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'approved', $8)`,
    [
      verifyRequestId,
      PENDING_VERIFY_USER.id,
      firstHost.id,
      firstHost.listingId,
      "Planning a cultural immersion trip while my verification is reviewed.",
      "2026-08-01",
      "2026-08-08",
      "Welcome — happy to host once verification clears.",
    ]
  );

  await client.query(
    `INSERT INTO conversations (stay_request_id, traveler_id, host_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (stay_request_id) DO NOTHING`,
    [verifyRequestId, PENDING_VERIFY_USER.id, firstHost.id]
  );

  const { rows: convRows } = await client.query(
    `SELECT id FROM conversations WHERE stay_request_id = $1 LIMIT 1`,
    [verifyRequestId]
  );
  const verifyConversationId = convRows[0]?.id;

  if (verifyConversationId) {
    await client.query(
      `UPDATE conversations
       SET last_message_at = NOW(), last_message_preview = 'Could you upload a clearer ID photo?'
       WHERE id = $1`,
      [verifyConversationId]
    );

    await client.query(
      `INSERT INTO stay_messages (
        id, stay_request_id, conversation_id, sender_id, body, message_type
      ) VALUES (
        'f3000004-0000-4000-8000-000000000001', $1, $2, $3,
        'Hi Priya — your selfie was blurry. Can you re-upload a clearer photo?', 'text'
      )`,
      [verifyRequestId, verifyConversationId, firstHost.id]
    );
  }

  await client.query(
    `INSERT INTO support_requests (
      id, user_id, user_full_name, user_email, message, status, admin_response, resolved_at
    ) VALUES
      ('a3000002-0000-4000-8000-000000000001', $1, $2, $3,
       'I cannot see my approved stay on the Trips page after the host confirmed. Can you help?',
       'open', NULL, NULL),
      ('a3000002-0000-4000-8000-000000000002', $4, $5, $6,
       'How do I update pricing tiers for different guest counts on my listing?',
       'open', NULL, NULL),
      ('a3000002-0000-4000-8000-000000000003', $7, $8, $9,
       'My verification was rejected but I uploaded the correct documents.',
       'resolved', 'We reviewed your documents and re-opened your verification queue.', NOW()),
      ('a3000002-0000-4000-8000-000000000004', $1, $2, $3,
       'Old question about password reset — no longer needed.',
       'archived', 'Archived per member request.', NOW())`,
    [
      firstGuest,
      GUESTS[0].firstName + " " + GUESTS[0].lastName,
      GUESTS[0].email,
      firstHost.id,
      HOSTS[0].firstName + " " + HOSTS[0].lastName,
      HOSTS[0].email,
      PENDING_VERIFY_USER.id,
      PENDING_VERIFY_USER.firstName + " " + PENDING_VERIFY_USER.lastName,
      PENDING_VERIFY_USER.email,
    ]
  );
}

async function resetDatabase(client) {
  console.log("Wiping all application data...\n");

  try {
    await client.query("DELETE FROM storage.objects");
  } catch {
    console.log("  (Skipped storage.objects — use Supabase dashboard to clear uploads if needed)\n");
  }

  for (const table of ["auth.sessions", "auth.refresh_tokens", "auth.mfa_factors"]) {
    try {
      await client.query(`DELETE FROM ${table}`);
    } catch {
      // Table may not exist on all Supabase versions
    }
  }

  // Must clear before user delete — SET NULL cascades can violate content_reports_check
  await client.query("DELETE FROM content_reports");

  await client.query("DELETE FROM auth.identities");
  await client.query("DELETE FROM auth.users");

  console.log("Database cleared.\n");
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

async function seedProfile(client, userId, user, role, { isAdmin = false } = {}) {
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
      email_verified_at = COALESCE(email_verified_at, NOW()),
      phone_verified_at = COALESCE(phone_verified_at, NOW()),
      updated_at = NOW()
     WHERE id = $1`,
    [
      userId,
      `${user.firstName} ${user.lastName}`,
      user.bio ?? `Curious traveler from ${user.location}.`,
      user.location,
      user.phone ?? null,
      user.languages ?? ["English"],
      role,
      isAdmin,
    ]
  );
}

async function seedTravelerProfile(client, userId, index) {
  const interests = [
    ["Cooking & Cuisine", "History & Heritage"],
    ["Language Learning", "Arts & Crafts"],
    ["Outdoor Adventures", "Local Markets"],
    ["Music & Dance", "Family Life"],
    ["Photography", "Food Tours"],
    ["Architecture", "Cooking & Cuisine"],
    ["Hiking", "Cultural Workshops"],
    ["Language Learning", "History & Heritage"],
    ["Local Markets", "Family Life"],
    ["Arts & Crafts", "Food Tours"],
  ];

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
      interests[index % interests.length],
      index % 2 === 0 ? "immersive" : "balanced",
      ["Japan", "Italy", "Morocco", "Mexico", "Portugal"],
      index % 3 === 0 ? ["Vegetarian options"] : [],
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

async function seedListing(client, userId, listing) {
  await client.query(
    `INSERT INTO host_listings (
      id, host_id, title, family_story, languages, country, city,
      meals, amenities, family_activities, house_rules,
      budget_per_night, max_capacity, status, published_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'published', NOW()
    )`,
    [
      listing.id,
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
      listing.budgetPerNight,
      listing.maxCapacity,
    ]
  );

  await client.query(
    `INSERT INTO listing_photos (listing_id, file_url, caption, sort_order, is_cover)
     VALUES ($1, $2, $3, 0, TRUE)`,
    [listing.id, listing.photoUrl, listing.title]
  );

  return listing.id;
}

async function seedExperiences(client, userId, experiences) {
  for (const exp of experiences) {
    await client.query(
      `INSERT INTO host_experiences (
        id, host_id, title, description, category, languages, country, city,
        meeting_point, duration_minutes, max_guests, price_per_person,
        includes, requirements, visibility, status, published_at
      ) VALUES (
        $1, $2, $3, $4, $5::experience_category, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15::experience_visibility, 'published', NOW()
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
        exp.visibility,
      ]
    );

    await client.query(
      `INSERT INTO experience_photos (experience_id, file_url, caption, sort_order, is_cover)
       VALUES ($1, $2, $3, 0, TRUE)`,
      [exp.id, exp.photoUrl, exp.title]
    );
  }
}

async function seedTrustExtras(client, userId) {
  const badges = ["identity_verified", "phone_verified", "address_verified"];
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

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    await resetDatabase(client);

    await client.query("BEGIN");
    console.log("Seeding mock data...\n");

    for (const host of HOSTS) {
      const hostId = await ensureAuthUser(client, host);
      await seedProfile(client, hostId, host, "host");
      await seedHostProfile(client, hostId, host.hostProfile);
      await seedListing(client, hostId, host.listing);
      await seedExperiences(client, hostId, host.experiences);
      await seedTrustExtras(client, hostId);
    }

    for (let i = 0; i < GUESTS.length; i++) {
      const guest = GUESTS[i];
      const guestId = await ensureAuthUser(client, guest);
      await seedProfile(client, guestId, guest, "traveler");
      await seedTravelerProfile(client, guestId, i);
    }

    const adminId = await ensureAuthUser(client, ADMIN);
    await seedProfile(client, adminId, ADMIN, "traveler", { isAdmin: true });
    await seedTravelerProfile(client, adminId, 0);
    await seedTrustExtras(client, adminId);

    const firstHostId = HOSTS[0].id;
    const firstListingId = HOSTS[0].listing.id;
    const firstGuestId = GUESTS[0].id;

    await seedModerationDemoData(client, {
      adminId,
      firstHost: { id: firstHostId, listingId: firstListingId },
      firstGuest: firstGuestId,
      secondHost: {
        id: HOSTS[3].id,
        listingId: HOSTS[3].listing.id,
        guestTravelerId: GUESTS[1].id,
      },
    });

    await client.query("COMMIT");

    const publicCount = HOSTS.flatMap((h) => h.experiences).filter(
      (e) => e.visibility === "all_members"
    ).length;
    const privateCount = HOSTS.flatMap((h) => h.experiences).filter(
      (e) => e.visibility === "approved_guests_only"
    ).length;

    console.log("Mock data ready. Password for all accounts: %s\n", PASSWORD);
    console.log("Hosts (%d):", HOSTS.length);
    for (const host of HOSTS) {
      console.log("  %s — %s %s (%s)", host.email, host.firstName, host.lastName, host.listing.city);
    }
    console.log("\nGuests (%d):", GUESTS.length);
    for (const guest of GUESTS) {
      console.log("  %s — %s %s", guest.email, guest.firstName, guest.lastName);
    }
    console.log(
      "\nExperiences: %d public (marketplace) + %d guests-only = %d total",
      publicCount,
      privateCount,
      publicCount + privateCount
    );
    console.log("\n  Public marketplace: /experiences");
    console.log("  Search families:      /search");
    console.log("\nPlatform admin:");
    console.log("  %s — %s %s (is_admin=true)", ADMIN.email, ADMIN.firstName, ADMIN.lastName);
    console.log("  Set PLATFORM_ADMIN_EMAIL=%s in .env.local / Vercel", ADMIN_EMAIL);
    console.log("  Admin dashboard:      /admin");
    console.log("\nModeration demo data:");
    console.log("  Pending verification: verify.pending@forebeyond.demo");
    console.log("  Pending reviews:      /admin/reviews");
    console.log("  Sample reports:       /admin/reports");
    console.log("  Support requests:     /admin/support");
    console.log("\nDone.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Reset/seed failed:", err.message);
  process.exit(1);
});
