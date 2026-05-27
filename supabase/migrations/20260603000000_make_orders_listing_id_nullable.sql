-- ── Make orders.listing_id nullable ──────────────────────────
-- The target schema has listing_id NOT NULL, but multi-item orders
-- may contain products from different vendor_listings.
-- For now we assign the first product's listing, but being nullable
-- prevents a hard failure if a listing is soft-deleted or changes.

ALTER TABLE public.orders
  ALTER COLUMN listing_id DROP NOT NULL;

COMMENT ON COLUMN public.orders.listing_id IS
  'References vendor_listings (nullable for multi-item orders where products span multiple listings).';
