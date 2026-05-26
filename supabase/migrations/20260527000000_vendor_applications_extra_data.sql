-- ============================================================
-- TEMS MARKET — Add extra_data to vendor_applications
-- ============================================================

ALTER TABLE public.vendor_applications
  ADD COLUMN IF NOT EXISTS extra_data JSONB;

-- Index for querying by extra_data fields
CREATE INDEX IF NOT EXISTS idx_vendor_applications_extra
  ON public.vendor_applications USING GIN (extra_data)
  WHERE extra_data IS NOT NULL;
