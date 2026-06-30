-- One family listing per host account.

DELETE FROM host_listings hl
WHERE hl.id NOT IN (
  SELECT DISTINCT ON (host_id) id
  FROM host_listings
  ORDER BY host_id, updated_at DESC NULLS LAST, created_at DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_host_listings_one_per_host ON host_listings (host_id);
