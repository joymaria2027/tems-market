-- ============================================================
-- Migration: Add stock column to products
-- ============================================================

-- Add stock column (default 1 so existing products are valid)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 1
    CHECK (stock >= 0);

COMMENT ON COLUMN public.products.stock IS 'Available inventory count for this product. Decremented on purchase.';
