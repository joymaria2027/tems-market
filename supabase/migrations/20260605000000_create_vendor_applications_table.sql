-- ============================================================
-- TEMS MARKET — Create vendor_applications table
-- ============================================================
-- The vendor_applications table was defined in the reference
-- schema (docs/files/tems-market-schema.sql) but was never
-- included in any migration. This migraton creates it.
-- ============================================================

-- ── application_status ENUM ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired',
    'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── vendor_applications table ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name       TEXT NOT NULL,
  category            TEXT NOT NULL,
  phone               TEXT NOT NULL,
  description         TEXT,
  location            TEXT,
  status              application_status NOT NULL DEFAULT 'pending',
  invite_token        TEXT UNIQUE,
  invite_expires_at   TIMESTAMPTZ,
  invite_generated_by UUID REFERENCES public.users(id),
  invite_generated_at TIMESTAMPTZ,
  user_id             UUID REFERENCES public.users(id),
  extra_data          JSONB,
  reviewed_by         UUID REFERENCES public.users(id),
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Trigger: updated_at ────────────────────────────────────
CREATE TRIGGER vendor_applications_updated_at
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- Admins/superadmin can read and update all applications
CREATE POLICY "vendor_applications: admin full" ON public.vendor_applications
  FOR ALL USING (is_admin_or_above());

-- Public insert (vendor submits form without being logged in)
CREATE POLICY "vendor_applications: public insert" ON public.vendor_applications
  FOR INSERT WITH CHECK (true);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_phone  ON public.vendor_applications(phone);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_token  ON public.vendor_applications(invite_token)
  WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_applications_extra
  ON public.vendor_applications USING GIN (extra_data)
  WHERE extra_data IS NOT NULL;
