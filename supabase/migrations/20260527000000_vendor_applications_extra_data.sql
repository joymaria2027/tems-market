-- ============================================================
-- TEMS MARKET — Add extra_data to vendor_applications
-- ============================================================

-- Guard: table may not exist yet on fresh db (created in 20260605000000)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'vendor_applications'
  ) THEN
    ALTER TABLE public.vendor_applications
      ADD COLUMN IF NOT EXISTS extra_data JSONB;

    CREATE INDEX IF NOT EXISTS idx_vendor_applications_extra
      ON public.vendor_applications USING GIN (extra_data)
      WHERE extra_data IS NOT NULL;
  END IF;
END;
$$;
