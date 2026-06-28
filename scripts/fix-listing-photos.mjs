import { createPgClient } from "./pg-connect.mjs";
import { resolveCatalogListingGallery } from "./listing-photo-catalog.mjs";

async function main() {
  const client = await createPgClient();

  try {
    const { rows: listings } = await client.query(
      `SELECT hl.id, hl.city, hl.country, hl.title
       FROM host_listings hl
       WHERE hl.status = 'published'
       ORDER BY hl.country, hl.city, hl.title`
    );

    let listingsUpdated = 0;
    let photosInserted = 0;

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const gallery = resolveCatalogListingGallery(
        listing.city,
        listing.country,
        listing.title,
        i
      );

      await client.query("DELETE FROM listing_photos WHERE listing_id = $1", [listing.id]);

      for (let sortOrder = 0; sortOrder < gallery.length; sortOrder++) {
        const entry = gallery[sortOrder];
        await client.query(
          `INSERT INTO listing_photos (listing_id, file_url, caption, sort_order, is_cover)
           VALUES ($1, $2, $3, $4, $5)`,
          [listing.id, entry.url, entry.caption, sortOrder, entry.isCover]
        );
        photosInserted += 1;
      }

      listingsUpdated += 1;
    }

    console.log("Listings updated: %d", listingsUpdated);
    console.log("Photos inserted: %d", photosInserted);
    console.log("Photos per listing: ~%d", Math.round(photosInserted / Math.max(listingsUpdated, 1)));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fix listing photos failed:", err.message);
  process.exit(1);
});
