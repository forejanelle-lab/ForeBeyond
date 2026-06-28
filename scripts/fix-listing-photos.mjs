import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createPgClient } from "./pg-connect.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  readFileSync(join(__dirname, "..", "src", "data", "listing-photo-catalog.json"), "utf8")
);

function photo(id) {
  return `https://images.unsplash.com/${id}?w=1200&q=85&auto=format&fit=crop`;
}

function normalizeLocationKey(value) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function resolveCatalogListingPhoto(city, country, fallbackIndex = 0) {
  const cityKey = normalizeLocationKey(city);
  const normalizedByCity = Object.fromEntries(
    Object.entries(catalog.byCity).map(([key, id]) => [normalizeLocationKey(key), id])
  );
  if (cityKey && normalizedByCity[cityKey]) {
    return photo(normalizedByCity[cityKey]);
  }

  const countryKey = normalizeLocationKey(country);
  const normalizedByCountry = Object.fromEntries(
    Object.entries(catalog.byCountry).map(([key, id]) => [normalizeLocationKey(key), id])
  );
  if (countryKey && normalizedByCountry[countryKey]) {
    return photo(normalizedByCountry[countryKey]);
  }

  const pool = catalog.fallbackPool;
  return photo(pool[fallbackIndex % pool.length]);
}

async function main() {
  const client = await createPgClient();

  try {
    const { rows: listings } = await client.query(
      `SELECT hl.id, hl.city, hl.country, hl.title
       FROM host_listings hl
       WHERE hl.status = 'published'
       ORDER BY hl.country, hl.city, hl.title`
    );

    let updated = 0;
    let inserted = 0;

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const photoUrl = resolveCatalogListingPhoto(listing.city, listing.country, i);

      const { rows: existing } = await client.query(
        `SELECT id FROM listing_photos
         WHERE listing_id = $1 AND is_cover = TRUE
         ORDER BY sort_order
         LIMIT 1`,
        [listing.id]
      );

      if (existing[0]) {
        await client.query(
          `UPDATE listing_photos
           SET file_url = $2, caption = $3
           WHERE id = $1`,
          [existing[0].id, photoUrl, listing.title]
        );
        updated += 1;
      } else {
        await client.query(
          `INSERT INTO listing_photos (listing_id, file_url, caption, sort_order, is_cover)
           VALUES ($1, $2, $3, 0, TRUE)`,
          [listing.id, photoUrl, listing.title]
        );
        inserted += 1;
      }
    }

    console.log("Listing photos updated: %d", updated);
    console.log("Listing photos inserted: %d", inserted);
    console.log("Total listings: %d", listings.length);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fix listing photos failed:", err.message);
  process.exit(1);
});
