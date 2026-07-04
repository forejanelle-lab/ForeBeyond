#!/usr/bin/env node
/**
 * Reset or create host-approved stays for Alex (Stripe confirm-stay testing).
 * Safe to re-run after a successful confirmation.
 *
 * Usage: npm run db:reset-alex-stay
 */
import { createPgClient } from "./pg-connect.mjs";

const TRAVELER_ID = "a2100001-0000-4000-8000-000000000001";
const HOST_ID = "a2000001-0000-4000-8000-000000000001";
const LISTING_ID = "c2000001-0000-4000-8000-000000000001";

const SCENARIOS = [
  {
    id: "c3990001-0000-4000-8000-000000000001",
    label: "Scenario A — solo traveler (5 nights)",
    startDate: "2026-08-10",
    endDate: "2026-08-15",
    guestCount: 1,
    message: "Excited to experience Kyoto with your family!",
    hostResponse: "We would love to host you — confirm when ready!",
  },
  {
    id: "c3990002-0000-4000-8000-000000000002",
    label: "Scenario B — two guests (4 nights)",
    startDate: "2026-09-20",
    endDate: "2026-09-24",
    guestCount: 2,
    message: "My partner and I would love to join for home cooking and neighborhood walks.",
    hostResponse: "Two guests works perfectly — confirm your stay when ready!",
  },
];

async function resetStayForRetest(client, stayRequestId) {
  const { rows: trips } = await client.query(
    `SELECT id FROM trips WHERE stay_request_id = $1`,
    [stayRequestId]
  );

  for (const trip of trips) {
    await client.query(`DELETE FROM reviews WHERE trip_id = $1`, [trip.id]);
  }

  await client.query(`DELETE FROM stay_bookings WHERE stay_request_id = $1`, [stayRequestId]);
  await client.query(`DELETE FROM trips WHERE stay_request_id = $1`, [stayRequestId]);

  // Release listing dates before resetting to host_approved (overlap trigger
  // treats the row as still approved during status transitions).
  await client.query(
    `UPDATE stay_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [stayRequestId]
  );
}

async function upsertHostApprovedStay(client, scenario) {
  await resetStayForRetest(client, scenario.id);

  await client.query(
    `INSERT INTO stay_requests (
      id, traveler_id, host_id, listing_id, message, start_date, end_date,
      guest_count, status, host_response
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'host_approved', $9)
    ON CONFLICT (id) DO UPDATE SET
      traveler_id = EXCLUDED.traveler_id,
      host_id = EXCLUDED.host_id,
      listing_id = EXCLUDED.listing_id,
      message = EXCLUDED.message,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      guest_count = EXCLUDED.guest_count,
      status = 'host_approved',
      host_response = EXCLUDED.host_response,
      updated_at = NOW()`,
    [
      scenario.id,
      TRAVELER_ID,
      HOST_ID,
      LISTING_ID,
      scenario.message,
      scenario.startDate,
      scenario.endDate,
      scenario.guestCount,
      scenario.hostResponse,
    ]
  );
}

async function main() {
  const client = await createPgClient();

  try {
    await client.query("BEGIN");

    const { rows: traveler } = await client.query(
      `SELECT id FROM profiles WHERE email = 'alex@forebeyond.demo' LIMIT 1`
    );
    if (!traveler[0]) {
      throw new Error(
        "Alex demo account not found. Run: npm run db:stripe-test-setup"
      );
    }

    await client.query(
      `UPDATE host_listings
       SET pricing_currency = 'JPY',
           budget_per_night = 12000,
           budget_per_night_3_guests = 15000,
           budget_per_night_4_guests = 18000,
           budget_per_night_5_guests = 20000,
           budget_per_night_6_plus_guests = 24000,
           country = 'Japan',
           city = 'Kyoto',
           updated_at = NOW()
       WHERE id = $1`,
      [LISTING_ID]
    );

    for (const scenario of SCENARIOS) {
      await upsertHostApprovedStay(client, scenario);
    }

    await client.query("COMMIT");

    console.log("Alex confirm-stay test scenarios ready:\n");
    console.log("  Sign in:  alex@forebeyond.demo / ForeBeyond123!");
    console.log("  Local:    http://localhost:3000/auth/sign-in\n");

    for (const scenario of SCENARIOS) {
      console.log(`  ${scenario.label}`);
      console.log(`    ${scenario.startDate} → ${scenario.endDate} · ${scenario.guestCount} guest(s)`);
      console.log(`    http://localhost:3000/dashboard/requests/${scenario.id}\n`);
    }

    console.log("  Confirm stay: pay service fee (12% of stay) via Stripe");
    console.log("  Success card:  4242 4242 4242 4242");
    console.log("  Decline card:  4000 0000 0000 0002");
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
