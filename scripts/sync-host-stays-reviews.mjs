/**
 * Align marketplace host stays: one completed booking per approved review.
 * Removes extra bookings/trips without reviews and recalculates trust scores.
 */
import { createPgClient } from "./pg-connect.mjs";

const STAYS_PER_HOST = 5;
const HOST_EMAIL_PATTERN = "host.%@forebeyond.demo";

async function removeTrip(client, tripId, stayRequestId) {
  await client.query("DELETE FROM reviews WHERE trip_id = $1", [tripId]);
  await client.query("DELETE FROM stay_bookings WHERE trip_id = $1", [tripId]);
  await client.query("DELETE FROM trips WHERE id = $1", [tripId]);
  await client.query("DELETE FROM stay_requests WHERE id = $1", [stayRequestId]);
}

async function main() {
  const client = await createPgClient();

  try {
    await client.query("BEGIN");

    const { rows: hosts } = await client.query(
      `SELECT id, email FROM profiles WHERE email LIKE $1 ORDER BY email`,
      [HOST_EMAIL_PATTERN]
    );

    let removedTrips = 0;
    let hostsUpdated = 0;

    for (const host of hosts) {
      const { rows: trips } = await client.query(
        `SELECT
           t.id AS trip_id,
           t.stay_request_id,
           EXISTS (
             SELECT 1 FROM reviews r
             WHERE r.trip_id = t.id AND r.moderation_status = 'approved'
           ) AS has_review,
           t.start_date
         FROM trips t
         WHERE t.host_id = $1 AND t.status = 'completed'
         ORDER BY has_review DESC, t.start_date ASC`,
        [host.id]
      );

      const keep = trips.slice(0, STAYS_PER_HOST);
      const remove = trips.slice(STAYS_PER_HOST);

      for (const trip of remove) {
        await removeTrip(client, trip.trip_id, trip.stay_request_id);
        removedTrips += 1;
      }

      await client.query("SELECT calculate_trust_score($1)", [host.id]);
      hostsUpdated += 1;

      const { rows: counts } = await client.query(
        `SELECT
           (SELECT COUNT(*) FROM stay_bookings sb
            JOIN host_listings hl ON hl.id = sb.listing_id
            WHERE hl.host_id = $1) AS bookings,
           (SELECT COUNT(*) FROM reviews r
            WHERE r.reviewee_id = $1 AND r.moderation_status = 'approved') AS reviews,
           (SELECT trust_score FROM profiles WHERE id = $1) AS trust_score`,
        [host.id]
      );

      const { bookings, reviews, trust_score } = counts[0];
      if (Number(bookings) !== Number(reviews)) {
        throw new Error(
          `${host.email}: bookings (${bookings}) still != reviews (${reviews}) after sync`
        );
      }

      if (Number(trust_score) < 80) {
        throw new Error(`${host.email}: trust score ${trust_score} below 80 after sync`);
      }

      if (remove.length > 0) {
        console.log(
          "%s — kept %d stays, removed %d, trust %s",
          host.email,
          keep.length,
          remove.length,
          trust_score
        );
      }
    }

    await client.query("COMMIT");

    console.log("\nSync complete.");
    console.log("Hosts updated: %d", hostsUpdated);
    console.log("Extra trips removed: %d", removedTrips);
    console.log("Target stays per host: %d (bookings = reviews)", STAYS_PER_HOST);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Sync host stays failed:", err.message);
  process.exit(1);
});
