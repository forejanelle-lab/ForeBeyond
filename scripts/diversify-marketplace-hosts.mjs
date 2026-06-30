/**
 * Diversify marketplace hosts: varied review counts, ratings, verification tiers,
 * and recalculated trust scores (bookings always match reviews).
 */
import { createPgClient } from "./pg-connect.mjs";
import { hostVarietyProfile } from "./marketplace-host-variety.mjs";

const HOST_EMAIL_PATTERN = "host.%@forebeyond.demo";
const MIN_TRUST = 80;

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
  "Our stay felt safe, welcoming, and full of local insight.",
  "Great balance of independence and family connection during the visit.",
];

const DOC_URLS = {
  government_id: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
  selfie: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80",
  address_proof: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  video_verification: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
};

let idCounter = 9000;
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

async function upsertVerificationDoc(client, userId, documentType, fileUrl) {
  const { rowCount } = await client.query(
    `UPDATE verification_documents
     SET status = 'verified', reviewed_at = NOW(), file_url = $3
     WHERE user_id = $1 AND document_type = $2::document_type`,
    [userId, documentType, fileUrl]
  );
  if (rowCount === 0) {
    await client.query(
      `INSERT INTO verification_documents (user_id, document_type, file_url, status, reviewed_at)
       VALUES ($1, $2::document_type, $3, 'verified', NOW())`,
      [userId, documentType, fileUrl]
    );
  }
}

async function applyVerificationTier(client, userId, tier) {
  await client.query(
    `UPDATE profiles SET
      phone_verified_at = NULL,
      address_verified_at = NULL,
      video_verified_at = NULL
     WHERE id = $1`,
    [userId]
  );

  await client.query(
    `DELETE FROM verification_documents
     WHERE user_id = $1
       AND document_type IN ('address_proof', 'video_verification')`,
    [userId]
  );

  await upsertVerificationDoc(client, userId, "government_id", DOC_URLS.government_id);
  await upsertVerificationDoc(client, userId, "selfie", DOC_URLS.selfie);
  await upsertVerificationDoc(client, userId, "address_proof", DOC_URLS.address_proof);
  await client.query(
    `UPDATE profiles SET
      address_verified_at = NOW(),
      phone_verified_at = NOW()
     WHERE id = $1`,
    [userId]
  );

  if (tier === "full") {
    await upsertVerificationDoc(client, userId, "video_verification", DOC_URLS.video_verification);
    await client.query(`UPDATE profiles SET video_verified_at = NOW() WHERE id = $1`, [userId]);
  }
}

async function removeTrip(client, tripId, stayRequestId) {
  await client.query("DELETE FROM reviews WHERE trip_id = $1", [tripId]);
  await client.query("DELETE FROM stay_bookings WHERE trip_id = $1", [tripId]);
  await client.query("DELETE FROM trips WHERE id = $1", [tripId]);
  await client.query("DELETE FROM stay_requests WHERE id = $1", [stayRequestId]);
}

async function seedCompletedBooking(client, { requestId, tripId, listingId, hostId, travelerId, start, end, nightlyRate }) {
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
      "Looking forward to experiencing your city with your family.",
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
  // auto_moderate_review sets rating <= 3 to pending; demo data should stay approved.
  if (rating <= 3) {
    await forceApproveReview(client, reviewId);
  }
}

/** Re-approve after rating edits (trigger only fires on rating/comment, not moderation_status). */
async function forceApproveReview(client, reviewId) {
  await client.query(
    `UPDATE reviews
     SET moderation_status = 'approved', moderated_at = NOW()
     WHERE id = $1`,
    [reviewId]
  );
}

async function main() {
  const client = await createPgClient();

  try {
    await client.query("BEGIN");

    const { rows: travelers } = await client.query(
      `SELECT id FROM profiles WHERE email LIKE 'guest.%@forebeyond.demo' ORDER BY email`
    );
    if (travelers.length === 0) {
      throw new Error("No traveler accounts found. Run db:seed-marketplace first.");
    }

    const { rows: hosts } = await client.query(
      `SELECT p.id, p.email, hl.id AS listing_id, hl.budget_per_night
       FROM profiles p
       JOIN host_listings hl ON hl.host_id = p.id AND hl.status = 'published'
       WHERE p.email LIKE $1
       ORDER BY p.email`,
      [HOST_EMAIL_PATTERN]
    );

    const summary = [];

    for (let hostIndex = 0; hostIndex < hosts.length; hostIndex++) {
      const host = hosts[hostIndex];
      const variety = hostVarietyProfile(hostIndex);
      const targetCount = variety.reviewCount;

      await applyVerificationTier(client, host.id, variety.verificationTier);

      const { rows: trips } = await client.query(
        `SELECT
           t.id AS trip_id,
           t.stay_request_id,
           t.start_date,
           t.traveler_id,
           r.id AS review_id
         FROM trips t
         LEFT JOIN reviews r
           ON r.trip_id = t.id AND r.moderation_status = 'approved'
         WHERE t.host_id = $1 AND t.status = 'completed'
         ORDER BY t.start_date ASC`,
        [host.id]
      );

      let tripRows = [...trips];

      while (tripRows.length > targetCount) {
        const remove = tripRows.pop();
        await removeTrip(client, remove.trip_id, remove.stay_request_id);
      }

      for (let i = 0; i < tripRows.length; i++) {
        const row = tripRows[i];
        if (!row.review_id) {
          const reviewId = nextUuid("d5000001");
          await seedListingReview(client, {
            reviewId,
            tripId: row.trip_id,
            travelerId: row.traveler_id,
            hostId: host.id,
            rating: variety.ratings[i],
            comment: REVIEW_COMMENTS[(hostIndex + i) % REVIEW_COMMENTS.length],
            createdAt: `${reviewDate(row.start_date, 2 + i)}T16:00:00Z`,
          });
          row.review_id = reviewId;
        }
        const rating = variety.ratings[i];
        await client.query(`UPDATE reviews SET rating = $2 WHERE id = $1`, [
          row.review_id,
          rating,
        ]);
        if (rating <= 3) {
          await forceApproveReview(client, row.review_id);
        }
      }

      while (tripRows.length < targetCount) {
        const stayIndex = tripRows.length;
        const traveler = travelers[(hostIndex * 5 + stayIndex) % travelers.length];
        const { start, end } = bookingWindow(hostIndex, stayIndex + 20);
        const requestId = nextUuid("e5000001");
        const tripId = nextUuid("f5000001");

        await seedCompletedBooking(client, {
          requestId,
          tripId,
          listingId: host.listing_id,
          hostId: host.id,
          travelerId: traveler.id,
          start,
          end,
          nightlyRate: host.budget_per_night,
        });

        const reviewId = nextUuid("d5000001");
        await seedListingReview(client, {
          reviewId,
          tripId,
          travelerId: traveler.id,
          hostId: host.id,
          rating: variety.ratings[stayIndex],
          comment: REVIEW_COMMENTS[(hostIndex + stayIndex) % REVIEW_COMMENTS.length],
          createdAt: `${reviewDate(start, 2 + stayIndex)}T16:00:00Z`,
        });

        tripRows.push({ trip_id: tripId, review_id: reviewId });
      }

      await client.query("SELECT calculate_trust_score($1)", [host.id]);

      const { rows: stats } = await client.query(
        `SELECT
           (SELECT COUNT(*) FROM trips t WHERE t.host_id = $1 AND t.status = 'completed') AS bookings,
           (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = $1 AND r.moderation_status = 'approved') AS reviews,
           (SELECT trust_score FROM profiles WHERE id = $1) AS trust_score`,
        [host.id]
      );

      const { bookings, reviews, trust_score } = stats[0];
      if (Number(bookings) !== Number(reviews)) {
        throw new Error(`${host.email}: bookings (${bookings}) != reviews (${reviews})`);
      }
      if (Number(trust_score) < MIN_TRUST) {
        throw new Error(`${host.email}: trust score ${trust_score} below ${MIN_TRUST}`);
      }

      summary.push({
        email: host.email,
        reviews: Number(reviews),
        tier: variety.verificationTier,
        trust: Number(trust_score),
      });
    }

    await client.query("COMMIT");

    const trusts = summary.map((row) => row.trust);
    const reviewCounts = summary.map((row) => row.reviews);
    console.log("Marketplace host variety applied.\n");
    console.log("Hosts updated: %d", summary.length);
    console.log(
      "Trust scores: min %d, max %d, unique %d",
      Math.min(...trusts),
      Math.max(...trusts),
      new Set(trusts).size
    );
    console.log(
      "Review counts: min %d, max %d, unique %d",
      Math.min(...reviewCounts),
      Math.max(...reviewCounts),
      new Set(reviewCounts).size
    );
    console.log("\nSample:");
    for (const row of summary.slice(0, 8)) {
      console.log("  %s — %d reviews, %s tier, trust %d", row.email, row.reviews, row.tier, row.trust);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Diversify marketplace hosts failed:", err.message);
  process.exit(1);
});
