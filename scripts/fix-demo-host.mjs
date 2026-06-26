import { createPgClient } from "./pg-connect.mjs";

const DEMO_HOST_EMAIL = "demo@forebeyond.demo";
const MARIA_LISTING_TITLE = "Maria Tanaka's Family in Kyoto, Japan";

async function consolidateDemoHostListing(client, demoHostId, listingTitle) {
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
  if (!canonicalId) {
    throw new Error("No published Maria listing found for demo host after consolidation.");
  }

  await client.query(
    `UPDATE host_listings
     SET status = 'archived', updated_at = NOW()
     WHERE host_id = $1 AND title = $2 AND id <> $3 AND status <> 'archived'`,
    [demoHostId, listingTitle, canonicalId]
  );

  const { rowCount: requestsUpdated } = await client.query(
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

  return { canonicalId, requestsUpdated };
}

async function main() {
  const client = await createPgClient();
  try {
    const { rows } = await client.query("SELECT id FROM auth.users WHERE email = $1", [
      DEMO_HOST_EMAIL,
    ]);
    if (!rows[0]) {
      throw new Error(`Demo host not found: ${DEMO_HOST_EMAIL}. Run npm run db:seed first.`);
    }

    await client.query("BEGIN");
    const result = await consolidateDemoHostListing(client, rows[0].id, MARIA_LISTING_TITLE);
    await client.query("COMMIT");

    console.log(`Demo host listing consolidated: ${result.canonicalId}`);
    console.log(`Stay requests reassigned: ${result.requestsUpdated}`);
    console.log(`Sign in as ${DEMO_HOST_EMAIL} and open /host/requests`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
