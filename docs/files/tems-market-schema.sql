-- ============================================================
-- TEMS MARKET — Complete Supabase Schema
-- Run order: 001 → 002 → 003 → 004
-- Reset: bunx supabase db reset (re-runs all migrations)
-- Regenerate types: bunx supabase gen types typescript --local > types/supabase.ts
-- ============================================================


-- ============================================================
-- MIGRATION 001 — ENUMS + TABLES
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'superadmin',
  'admin',
  'vendor',
  'affiliate',
  'customer'
);

CREATE TYPE user_status AS ENUM (
  'active',
  'pending',     -- vendor waiting for approval / invite not yet accepted
  'rejected',    -- vendor rejected by admin
  'suspended'    -- banned by superadmin
);

CREATE TYPE product_status AS ENUM (
  'draft',
  'pending_review',  -- vendor-submitted, waiting for admin approval
  'active',
  'inactive'
);

CREATE TYPE inventory_type AS ENUM (
  'tems_owned',       -- product sourced and owned by superadmin
  'vendor_submitted'  -- product submitted by vendor, admin-vetted
);

CREATE TYPE order_status AS ENUM (
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'pending_cod',   -- cash on delivery, awaiting physical collection
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'qmoney',
  'afrimoney',
  'wave',
  'cash',
  'credits',    -- paid from Tems Market credit wallet (primary checkout method)
  'gift_card',
  'mixed'       -- partial gift card + credits or credits + mobile money top-up
);

CREATE TYPE credit_transaction_type AS ENUM (
  'top_up',                   -- instant top-up via ModemPay (mobile money/card)
  'top_up_screenshot',        -- Wave screenshot top-up, credits added after MoMo Reconcile verification
  'top_up_screenshot_rejected', -- screenshot rejected by manager — no credits added, for audit trail
  'purchase',                 -- credits spent on an order (negative amount)
  'refund',                   -- order refunded as credits (positive amount)
  'bonus',                    -- promotional free credits issued by superadmin
  'commission_credit',        -- vendor/affiliate/admin commission paid as credits
  'gift_card_purchase',       -- gift card bought with credits (negative amount)
  'gift_card_redeem'          -- gift card redeemed into credit wallet (positive amount)
  -- No transfer types — credits are non-transferable by design
  -- No withdrawal type — credits are non-withdrawable by design
);

CREATE TYPE screenshot_verification_status AS ENUM (
  'pending',    -- uploaded, awaiting MoMo Reconcile manager
  'verified',   -- manager confirmed — credits added
  'rejected'    -- manager rejected — credits not added, reason recorded
);

CREATE TYPE commission_status AS ENUM (
  'pending',    -- order paid, awaiting MoMo Reconcile manager verification
  'available',  -- MoMo Reconcile verified (+ order delivered), ready to withdraw
  'paid',       -- payout sent (ModemPay or credited to wallet)
  'failed'      -- payout failed
);

CREATE TYPE momo_reconcile_status AS ENUM (
  'syncing',    -- job being created in MoMo Reconcile
  'pending',    -- job created, awaiting manager sign-off (24h SLA)
  'verified',   -- manager signed off — triggers commission 'available'
  'disputed',   -- dispute raised in MoMo Reconcile — commission frozen
  'timed_out'  -- 48h SLA breached — fallback trust tier, commission still released
);

CREATE TYPE commission_recipient AS ENUM (
  'vendor',
  'affiliate',
  'admin',
  'platform'
);

CREATE TYPE settlement_code AS ENUM (
  'wave',
  'afrimoney'
);

CREATE TYPE commission_payout_preference AS ENUM (
  'mobile_money',  -- default: paid to Wave or AfriMoney wallet via ModemPay
  'credits'        -- paid to Tems credit wallet instantly on order delivery
);

CREATE TYPE featured_plan AS ENUM (
  '7_days',
  '30_days'
);

CREATE TYPE featured_status AS ENUM (
  'pending_payment',
  'active',
  'expired'
);

CREATE TYPE gift_card_status AS ENUM (
  'active',
  'partially_used',
  'fully_used',
  'expired'
);

CREATE TYPE coupon_discount_type AS ENUM (
  'percentage',
  'fixed_gmd'
);

CREATE TYPE coupon_status AS ENUM (
  'active',
  'paused',
  'expired'
);

CREATE TYPE notification_channel AS ENUM (
  'sms',
  'whatsapp'
);

-- ── Utility: updated_at trigger ────────────────────────────

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Table: users ───────────────────────────────────────────
-- Note: Supabase Auth creates the auth.users record.
-- This public.users table stores app-specific profile data.
-- The id matches auth.users.id.

CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  email         TEXT,
  date_of_birth DATE,                    -- required at signup, used for age gate
  age_verified  BOOLEAN NOT NULL DEFAULT FALSE, -- true once DOB confirmed >= 18
  role          user_role NOT NULL,
  status        user_status NOT NULL DEFAULT 'pending',
  commission_payout_preference commission_payout_preference NOT NULL DEFAULT 'mobile_money',
  invited_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create public.users record when auth.users is created
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Phone and role will be set by the Edge Function after OTP verification
  -- This trigger just ensures the record exists
  INSERT INTO public.users (id, phone, full_name, role, status)
  VALUES (NEW.id, COALESCE(NEW.phone, ''), '', 'customer', 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ── Table: vendor_applications ────────────────────────────
-- Vendor fills out this form before being invited.
-- No user account exists yet at this stage.
-- Admin reviews → generates invite link → vendor sets password → becomes a user.

CREATE TYPE application_status AS ENUM (
  'pending',    -- submitted, awaiting admin review
  'approved',   -- admin approved, invite link generated
  'rejected',   -- admin rejected
  'expired',    -- invite link generated but vendor didn't use it (7-day expiry)
  'completed'   -- vendor accepted invite, account created
);

CREATE TABLE public.vendor_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name    TEXT NOT NULL,
  category         TEXT NOT NULL,         -- fashion, electronics, other
  phone            TEXT NOT NULL,
  description      TEXT,                  -- what they sell
  location         TEXT,                  -- area in Gambia
  status           application_status NOT NULL DEFAULT 'pending',
  invite_token     TEXT UNIQUE,           -- set when admin generates invite link
  invite_expires_at TIMESTAMPTZ,          -- 7 days from generation
  invite_generated_by UUID REFERENCES public.users(id), -- admin who generated
  invite_generated_at TIMESTAMPTZ,
  user_id          UUID REFERENCES public.users(id),     -- set when account created
  reviewed_by      UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER vendor_applications_updated_at
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- Admins/superadmin can read and update all applications
CREATE POLICY "vendor_applications: admin full" ON public.vendor_applications
  FOR ALL USING (is_admin_or_above());

-- Public insert (vendor submits form without being logged in)
CREATE POLICY "vendor_applications: public insert" ON public.vendor_applications
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX idx_vendor_applications_phone  ON public.vendor_applications(phone);
CREATE INDEX idx_vendor_applications_token  ON public.vendor_applications(invite_token)
  WHERE invite_token IS NOT NULL;

-- ── Table: vendor_profiles ─────────────────────────────────

CREATE TABLE public.vendor_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  business_name             TEXT NOT NULL,
  category                  TEXT NOT NULL,
  id_document_url           TEXT,           -- Supabase Storage: private bucket
  id_ocr_text               TEXT,           -- raw OCR Space output
  id_structured             JSONB,          -- Groq-structured: {full_name, id_number, dob, doc_type}
  settlement_code           settlement_code,
  account_number            TEXT,           -- mobile money number for payouts
  modempay_subaccount_id    TEXT,           -- set on admin approval
  approved_at               TIMESTAMPTZ,
  approved_by               UUID REFERENCES public.users(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER vendor_profiles_updated_at
  BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Table: platform_settings ───────────────────────────────

CREATE TABLE public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Table: products ────────────────────────────────────────

CREATE TABLE public.products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  description          TEXT,
  category             TEXT NOT NULL,
  images               TEXT[] NOT NULL DEFAULT '{}',  -- Supabase Storage public URLs
  base_price           NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  inventory_type       inventory_type NOT NULL DEFAULT 'tems_owned',
  status               product_status NOT NULL DEFAULT 'draft',
  created_by           UUID NOT NULL REFERENCES public.users(id),
  submitted_by_vendor  UUID REFERENCES public.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Table: price_layers ────────────────────────────────────
-- One record per product, set by an admin.
-- admin_price is what vendors see as their floor.

CREATE TABLE public.price_layers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  admin_id      UUID NOT NULL REFERENCES public.users(id),
  admin_price   NUMERIC(10,2) NOT NULL,
  admin_margin  NUMERIC(10,2) GENERATED ALWAYS AS (admin_price - 0) STORED, -- updated by trigger
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_price_above_base CHECK (true)  -- enforced by Edge Function, not DB (needs join)
);

-- Recompute admin_margin as admin_price - products.base_price via view
-- (DB constraint can't reference another table; Edge Function enforces this)
CREATE TRIGGER price_layers_updated_at
  BEFORE UPDATE ON public.price_layers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Drop the generated column, use a plain column instead (margin calculated in app/Edge Function)
ALTER TABLE public.price_layers DROP COLUMN admin_margin;
ALTER TABLE public.price_layers ADD COLUMN admin_margin NUMERIC(10,2);

-- ── Table: vendor_listings ─────────────────────────────────

CREATE TABLE public.vendor_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_price    NUMERIC(10,2) NOT NULL,
  vendor_margin   NUMERIC(10,2),             -- vendor_price - admin_price, set on save
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, vendor_id)              -- one listing per product per vendor
);

CREATE TRIGGER vendor_listings_updated_at
  BEFORE UPDATE ON public.vendor_listings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Table: affiliate_links ─────────────────────────────────

CREATE TABLE public.affiliate_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id    UUID NOT NULL REFERENCES public.vendor_listings(id) ON DELETE CASCADE,
  short_code    TEXT NOT NULL UNIQUE,        -- nanoid(10), URL-safe
  clicks        INTEGER NOT NULL DEFAULT 0,
  conversions   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(affiliate_id, listing_id)           -- one link per affiliate per listing
);

-- ── Table: gift_cards ──────────────────────────────────────

CREATE TABLE public.gift_cards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,              -- 16-char uppercase alphanumeric
  value_gmd           NUMERIC(10,2) NOT NULL CHECK (value_gmd > 0),
  remaining_balance   NUMERIC(10,2) NOT NULL,
  purchased_by        UUID REFERENCES public.users(id),  -- null = admin promo issuance
  recipient_email     TEXT,
  recipient_name      TEXT,
  personal_message    TEXT,
  modempay_payment_id TEXT,
  status              gift_card_status NOT NULL DEFAULT 'active',
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT balance_lte_value CHECK (remaining_balance <= value_gmd),
  CONSTRAINT balance_gte_zero CHECK (remaining_balance >= 0)
);

-- ── Table: coupons ─────────────────────────────────────────

CREATE TABLE public.coupons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,              -- uppercase, e.g. TEMS20
  discount_type       coupon_discount_type NOT NULL,
  discount_value      NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  minimum_order_gmd   NUMERIC(10,2),
  max_uses            INTEGER,                           -- null = unlimited
  uses_so_far         INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user   INTEGER DEFAULT 1,
  valid_from          TIMESTAMPTZ NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL,
  status              coupon_status NOT NULL DEFAULT 'active',
  created_by          UUID NOT NULL REFERENCES public.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Table: orders ──────────────────────────────────────────

CREATE TABLE public.orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID NOT NULL REFERENCES public.users(id),
  listing_id            UUID NOT NULL REFERENCES public.vendor_listings(id),
  affiliate_link_id     UUID REFERENCES public.affiliate_links(id),
  quantity              INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price            NUMERIC(10,2) NOT NULL,          -- vendor_price at time of order
  total_amount          NUMERIC(10,2) NOT NULL,          -- quantity × unit_price
  discounted_total      NUMERIC(10,2) NOT NULL,          -- after gift card + coupon
  status                order_status NOT NULL DEFAULT 'placed',
  payment_method        payment_method NOT NULL,
  payment_status        payment_status NOT NULL DEFAULT 'pending',
  modempay_payment_id   TEXT,
  gift_card_id          UUID REFERENCES public.gift_cards(id),
  gift_card_amount      NUMERIC(10,2),                   -- GMD covered by gift card
  coupon_id             UUID REFERENCES public.coupons(id),
  coupon_discount       NUMERIC(10,2),                   -- GMD discounted by coupon
  delivery_address      TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Table: featured_listings ───────────────────────────────

CREATE TABLE public.featured_listings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id            UUID NOT NULL REFERENCES public.vendor_listings(id) ON DELETE CASCADE,
  vendor_id             UUID NOT NULL REFERENCES public.users(id),
  plan                  featured_plan NOT NULL,
  amount_paid           NUMERIC(10,2) NOT NULL,
  modempay_payment_id   TEXT,
  starts_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  status                featured_status NOT NULL DEFAULT 'pending_payment',
  position              INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table: gift_card_redemptions ───────────────────────────

CREATE TABLE public.gift_card_redemptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id  UUID NOT NULL REFERENCES public.gift_cards(id),
  order_id      UUID NOT NULL REFERENCES public.orders(id),
  amount_used   NUMERIC(10,2) NOT NULL CHECK (amount_used > 0),
  redeemed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table: coupon_uses ─────────────────────────────────────

CREATE TABLE public.coupon_uses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id         UUID NOT NULL REFERENCES public.coupons(id),
  order_id          UUID NOT NULL REFERENCES public.orders(id) UNIQUE, -- one coupon per order
  user_id           UUID NOT NULL REFERENCES public.users(id),
  discount_applied  NUMERIC(10,2) NOT NULL,
  used_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table: commission_ledger ───────────────────────────────

CREATE TABLE public.commission_ledger (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID NOT NULL REFERENCES public.orders(id),
  recipient_id                UUID NOT NULL REFERENCES public.users(id),
  recipient_role              commission_recipient NOT NULL,
  amount                      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  momo_reconcile_fee          NUMERIC(10,2),        -- 1% of amount, paid by platform to MoMo Reconcile
  status                      commission_status NOT NULL DEFAULT 'pending',
  momo_reconcile_job_id       TEXT,                 -- MoMo Reconcile job ID for this commission
  momo_reconcile_status       momo_reconcile_status NOT NULL DEFAULT 'syncing',
  momo_reconcile_trust_tier   INTEGER,              -- 110/120/130/140 from MoMo Reconcile
  momo_reconcile_verified_at  TIMESTAMPTZ,          -- when manager signed off
  settlement_date             DATE,                 -- which daily batch this belongs to (set when status → available)
  settlement_batch_id         UUID,                 -- FK set when batch processes
  modempay_payout_id          TEXT,
  paid_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, recipient_role)
);

-- ── Table: settlement_batches ──────────────────────────────
-- One record per user per day — tracks the daily payout run

CREATE TABLE public.settlement_batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_date   DATE NOT NULL,
  recipient_id      UUID NOT NULL REFERENCES public.users(id),
  total_amount      NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  entry_count       INTEGER NOT NULL,              -- how many commission_ledger entries in this batch
  payout_method     TEXT NOT NULL,                 -- 'mobile_money' or 'credits'
  modempay_payout_id TEXT,                         -- if mobile_money
  status            TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  processed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(settlement_date, recipient_id)            -- one batch per user per day
);

ALTER TABLE public.settlement_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlement_batches: recipient read own" ON public.settlement_batches
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "settlement_batches: admin read all" ON public.settlement_batches
  FOR SELECT USING (is_admin_or_above());

CREATE INDEX idx_settlement_batches_date       ON public.settlement_batches(settlement_date);
CREATE INDEX idx_settlement_batches_recipient  ON public.settlement_batches(recipient_id);
CREATE INDEX idx_settlement_batches_status     ON public.settlement_batches(status);
CREATE INDEX idx_commission_settlement_date    ON public.commission_ledger(settlement_date)
  WHERE settlement_date IS NOT NULL;
CREATE INDEX idx_commission_settlement_batch   ON public.commission_ledger(settlement_batch_id)
  WHERE settlement_batch_id IS NOT NULL;

-- ── Table: credit_wallets ─────────────────────────────────
-- One wallet per user. Balance is the single source of truth.
-- All mutations happen via Edge Functions using service role.
-- Client never writes to this table directly.

CREATE TABLE public.credit_wallets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  balance_gmd       NUMERIC(10,2) NOT NULL DEFAULT 0
                    CHECK (balance_gmd >= 0),  -- never negative
  total_topped_up   NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_spent       NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- No transfer or withdrawal columns — credits are non-transferable and non-withdrawable
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER credit_wallets_updated_at
  BEFORE UPDATE ON public.credit_wallets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create a credit wallet for every new user
CREATE OR REPLACE FUNCTION create_credit_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credit_wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_create_wallet
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_credit_wallet_for_user();

-- ── Table: credit_transactions ─────────────────────────────
-- Immutable ledger of every credit movement.
-- INSERT-only via Edge Functions. Never updated or deleted.
-- amount_gmd is signed: positive = credits added, negative = credits deducted.

CREATE TABLE public.credit_transactions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES public.users(id),
  type                        credit_transaction_type NOT NULL,
  amount_gmd                  NUMERIC(10,2) NOT NULL,     -- signed: + in, − out
  balance_after               NUMERIC(10,2) NOT NULL,     -- snapshot after transaction
  order_id                    UUID REFERENCES public.orders(id),
  modempay_payment_id         TEXT,                       -- for top_up (ModemPay path)
  note                        TEXT,                       -- for bonus credits or admin notes

  -- Wave screenshot top-up fields (null for non-screenshot transactions)
  screenshot_url              TEXT,                       -- Supabase Storage URL of uploaded proof
  wave_tx_id                  TEXT UNIQUE,                -- extracted transaction ID (uniqueness prevents reuse)
  wave_amount_extracted       NUMERIC(10,2),              -- OCR-extracted amount for audit
  wave_timestamp_extracted    TIMESTAMPTZ,                -- OCR-extracted transaction time
  wave_sender_extracted       TEXT,                       -- OCR-extracted sender name/number
  ocr_raw_text                TEXT,                       -- full OCR Space raw output (audit)
  screenshot_status           screenshot_verification_status, -- only set for top_up_screenshot type
  momo_reconcile_job_id       TEXT,                       -- MoMo Reconcile job for this screenshot
  rejection_reason            TEXT,                       -- set if screenshot_status = 'rejected'
  verified_at                 TIMESTAMPTZ,                -- when manager verified

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at — this table is INSERT-only for confirmed transactions
  -- EXCEPTION: screenshot_status, verified_at, rejection_reason may be updated
  -- by Edge Function when MoMo Reconcile webhook fires
);

-- RLS for credit_wallets
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_wallets: user read own" ON public.credit_wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "credit_wallets: admin read all" ON public.credit_wallets
  FOR SELECT USING (is_admin_or_above());
-- Writes: service role only via Edge Functions

-- RLS for credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions: user read own" ON public.credit_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "credit_transactions: counterparty read" ON public.credit_transactions
  FOR SELECT USING (counterparty_id = auth.uid());

CREATE POLICY "credit_transactions: admin read all" ON public.credit_transactions
  FOR SELECT USING (is_admin_or_above());
-- Writes: service role only via Edge Functions

-- Indexes for credit tables
CREATE INDEX idx_credit_wallets_user       ON public.credit_wallets(user_id);
CREATE INDEX idx_credit_transactions_user  ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type  ON public.credit_transactions(type);
CREATE INDEX idx_credit_transactions_order ON public.credit_transactions(order_id)
  WHERE order_id IS NOT NULL;
CREATE INDEX idx_credit_transactions_time  ON public.credit_transactions(created_at DESC);
-- Wave screenshot fraud protection
CREATE UNIQUE INDEX idx_credit_transactions_wave_tx ON public.credit_transactions(wave_tx_id)
  WHERE wave_tx_id IS NOT NULL;  -- prevents same Wave tx ID being used twice
CREATE INDEX idx_credit_transactions_screenshot_status ON public.credit_transactions(screenshot_status)
  WHERE screenshot_status IS NOT NULL;

-- ── Table: customer_requests ──────────────────────────────
-- Pre-order requests: customer demand captured in-app
-- Powers admin sourcing decisions and inventory intelligence

CREATE TYPE request_status AS ENUM (
  'open',       -- awaiting admin action
  'sourcing',   -- admin is looking for the product
  'fulfilled',  -- matching product now listed, customer notified
  'declined'    -- cannot be fulfilled
);

CREATE TABLE public.customer_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  category     TEXT,
  budget_gmd   NUMERIC(10,2),
  status       request_status NOT NULL DEFAULT 'open',
  fulfilled_by UUID REFERENCES public.products(id),   -- product that fulfilled this request
  notes        TEXT,                                   -- admin internal notes
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER customer_requests_updated_at
  BEFORE UPDATE ON public.customer_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;

-- Customer reads/creates own requests
CREATE POLICY "customer_requests: customer own" ON public.customer_requests
  FOR ALL USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Admin/superadmin read all and update status
CREATE POLICY "customer_requests: admin full" ON public.customer_requests
  FOR ALL USING (is_admin_or_above());

-- Index for admin dashboard (most recent open requests)
CREATE INDEX idx_customer_requests_status     ON public.customer_requests(status);
CREATE INDEX idx_customer_requests_category   ON public.customer_requests(category);
CREATE INDEX idx_customer_requests_created    ON public.customer_requests(created_at DESC);

-- ── Table: notifications_log ───────────────────────────────

CREATE TABLE public.notifications_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id),
  type            TEXT NOT NULL,        -- otp, order_update, commission, invite, approval, gift_card
  channel         notification_channel NOT NULL,
  message         TEXT NOT NULL,
  meta_message_id TEXT,                 -- Meta WhatsApp Cloud API message ID (wamid)
  at_message_id   TEXT,                 -- Africa's Talking SMS message ID (fallback)
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table: invite_tokens ───────────────────────────────────

CREATE TABLE public.invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- MIGRATION 002 — ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_layers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_listings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_redemptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens          ENABLE ROW LEVEL SECURITY;

-- ── Helper functions ───────────────────────────────────────

-- Get current user's role (cached per request)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'superadmin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin or superadmin
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('superadmin', 'admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── users ──────────────────────────────────────────────────

-- Any authenticated user can read their own record
CREATE POLICY "users: read own" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Superadmin and admin can read all users
CREATE POLICY "users: admin read all" ON public.users
  FOR SELECT USING (is_admin_or_above());

-- Users can update their own profile (name, email)
CREATE POLICY "users: update own" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only superadmin can update role or status
CREATE POLICY "users: superadmin full" ON public.users
  FOR ALL USING (is_superadmin());

-- Edge Functions use service role key — bypasses RLS

-- ── vendor_profiles ────────────────────────────────────────

-- Vendor reads own profile
CREATE POLICY "vendor_profiles: vendor read own" ON public.vendor_profiles
  FOR SELECT USING (user_id = auth.uid());

-- Admin/superadmin read all
CREATE POLICY "vendor_profiles: admin read all" ON public.vendor_profiles
  FOR SELECT USING (is_admin_or_above());

-- Vendor inserts/updates own profile
CREATE POLICY "vendor_profiles: vendor write own" ON public.vendor_profiles
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin/superadmin can update (for approval fields)
CREATE POLICY "vendor_profiles: admin update" ON public.vendor_profiles
  FOR UPDATE USING (is_admin_or_above());

-- ── platform_settings ──────────────────────────────────────

-- All authenticated users can read settings (commission rates needed on client)
CREATE POLICY "platform_settings: authenticated read" ON public.platform_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only superadmin can write
CREATE POLICY "platform_settings: superadmin write" ON public.platform_settings
  FOR ALL USING (is_superadmin());

-- ── products ───────────────────────────────────────────────

-- All authenticated users can read active products
CREATE POLICY "products: read active" ON public.products
  FOR SELECT USING (status = 'active' AND auth.uid() IS NOT NULL);

-- Admin/superadmin can read all (including drafts and pending_review)
CREATE POLICY "products: admin read all" ON public.products
  FOR SELECT USING (is_admin_or_above());

-- Vendor can read own submitted products
CREATE POLICY "products: vendor read own submissions" ON public.products
  FOR SELECT USING (submitted_by_vendor = auth.uid());

-- Superadmin can write all
CREATE POLICY "products: superadmin write" ON public.products
  FOR ALL USING (is_superadmin());

-- Vendor can insert pending_review products
CREATE POLICY "products: vendor submit" ON public.products
  FOR INSERT WITH CHECK (
    get_user_role() = 'vendor'
    AND inventory_type = 'vendor_submitted'
    AND status = 'pending_review'
    AND submitted_by_vendor = auth.uid()
  );

-- Admin can update product status (approve/reject vendor submissions)
CREATE POLICY "products: admin update status" ON public.products
  FOR UPDATE USING (is_admin_or_above());

-- ── price_layers ───────────────────────────────────────────

-- Admin/superadmin full access
CREATE POLICY "price_layers: admin full" ON public.price_layers
  FOR ALL USING (is_admin_or_above());

-- Vendors can read price layers (they need admin_price as their floor)
CREATE POLICY "price_layers: vendor read" ON public.price_layers
  FOR SELECT USING (get_user_role() = 'vendor');

-- ── vendor_listings ────────────────────────────────────────

-- All authenticated users can read active listings
CREATE POLICY "vendor_listings: read active" ON public.vendor_listings
  FOR SELECT USING (is_active = TRUE AND auth.uid() IS NOT NULL);

-- Admin/superadmin can read all
CREATE POLICY "vendor_listings: admin read all" ON public.vendor_listings
  FOR SELECT USING (is_admin_or_above());

-- Vendor can read/write own listings
CREATE POLICY "vendor_listings: vendor own" ON public.vendor_listings
  FOR ALL USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- ── affiliate_links ────────────────────────────────────────

-- Affiliate can read/write own links
CREATE POLICY "affiliate_links: affiliate own" ON public.affiliate_links
  FOR ALL USING (affiliate_id = auth.uid())
  WITH CHECK (affiliate_id = auth.uid());

-- Admin/superadmin can read all
CREATE POLICY "affiliate_links: admin read all" ON public.affiliate_links
  FOR SELECT USING (is_admin_or_above());

-- Public read by short_code (needed for link resolution without auth)
-- This is done via service role in Edge Function, not client-side

-- ── gift_cards ─────────────────────────────────────────────

-- Customer who purchased can read own gift cards
CREATE POLICY "gift_cards: purchaser read" ON public.gift_cards
  FOR SELECT USING (purchased_by = auth.uid());

-- Admin/superadmin can read/write all
CREATE POLICY "gift_cards: admin full" ON public.gift_cards
  FOR ALL USING (is_admin_or_above());

-- Validation (read by code) is done via service role in Edge Function

-- ── gift_card_redemptions ──────────────────────────────────

-- Admin/superadmin can read all
CREATE POLICY "gift_card_redemptions: admin read" ON public.gift_card_redemptions
  FOR SELECT USING (is_admin_or_above());

-- ── coupons ────────────────────────────────────────────────

-- Admin/superadmin full access
CREATE POLICY "coupons: admin full" ON public.coupons
  FOR ALL USING (is_admin_or_above());

-- All authenticated users can read active coupons (for validation UX)
CREATE POLICY "coupons: authenticated read active" ON public.coupons
  FOR SELECT USING (status = 'active' AND auth.uid() IS NOT NULL);

-- ── coupon_uses ────────────────────────────────────────────

-- Customer reads own uses (to see history)
CREATE POLICY "coupon_uses: customer read own" ON public.coupon_uses
  FOR SELECT USING (user_id = auth.uid());

-- Admin/superadmin read all
CREATE POLICY "coupon_uses: admin read all" ON public.coupon_uses
  FOR SELECT USING (is_admin_or_above());

-- ── orders ─────────────────────────────────────────────────

-- Customer reads own orders
CREATE POLICY "orders: customer read own" ON public.orders
  FOR SELECT USING (customer_id = auth.uid());

-- Vendor reads orders for their listings
CREATE POLICY "orders: vendor read own listings" ON public.orders
  FOR SELECT USING (
    listing_id IN (
      SELECT id FROM public.vendor_listings WHERE vendor_id = auth.uid()
    )
  );

-- Admin/superadmin read all
CREATE POLICY "orders: admin read all" ON public.orders
  FOR SELECT USING (is_admin_or_above());

-- Customer can insert own orders (via Edge Function using service role is better)
CREATE POLICY "orders: customer insert" ON public.orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Status updates done via Edge Function (service role)

-- ── featured_listings ──────────────────────────────────────

-- All authenticated users can read active featured listings (for feed)
CREATE POLICY "featured_listings: read active" ON public.featured_listings
  FOR SELECT USING (status = 'active' AND auth.uid() IS NOT NULL);

-- Vendor reads own featured listings
CREATE POLICY "featured_listings: vendor read own" ON public.featured_listings
  FOR SELECT USING (vendor_id = auth.uid());

-- Admin/superadmin full access
CREATE POLICY "featured_listings: admin full" ON public.featured_listings
  FOR ALL USING (is_admin_or_above());

-- ── commission_ledger ──────────────────────────────────────

-- Each recipient reads their own ledger entries
CREATE POLICY "commission_ledger: recipient read own" ON public.commission_ledger
  FOR SELECT USING (recipient_id = auth.uid());

-- Admin/superadmin read all
CREATE POLICY "commission_ledger: admin read all" ON public.commission_ledger
  FOR SELECT USING (is_admin_or_above());

-- Writes are done via Edge Function (service role key)

-- ── notifications_log ──────────────────────────────────────

-- Admin/superadmin read all (for debugging)
CREATE POLICY "notifications_log: admin read" ON public.notifications_log
  FOR SELECT USING (is_admin_or_above());

-- ── invite_tokens ──────────────────────────────────────────

-- Only service role (Edge Functions) interacts with this table


-- ============================================================
-- MIGRATION 003 — INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_phone          ON public.users(phone);
CREATE INDEX idx_users_role           ON public.users(role);
CREATE INDEX idx_users_status         ON public.users(status);
CREATE INDEX idx_users_role_status    ON public.users(role, status);

-- vendor_profiles
CREATE INDEX idx_vendor_profiles_user  ON public.vendor_profiles(user_id);

-- products
CREATE INDEX idx_products_status       ON public.products(status);
CREATE INDEX idx_products_category     ON public.products(category);
CREATE INDEX idx_products_submitted_by ON public.products(submitted_by_vendor)
  WHERE submitted_by_vendor IS NOT NULL;

-- price_layers
CREATE INDEX idx_price_layers_product  ON public.price_layers(product_id);

-- vendor_listings
CREATE INDEX idx_vendor_listings_vendor    ON public.vendor_listings(vendor_id);
CREATE INDEX idx_vendor_listings_product   ON public.vendor_listings(product_id);
CREATE INDEX idx_vendor_listings_active    ON public.vendor_listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_vendor_listings_vendor_active ON public.vendor_listings(vendor_id, is_active);

-- affiliate_links
CREATE INDEX idx_affiliate_links_short_code  ON public.affiliate_links(short_code); -- hot path: link resolution
CREATE INDEX idx_affiliate_links_affiliate   ON public.affiliate_links(affiliate_id);
CREATE INDEX idx_affiliate_links_listing     ON public.affiliate_links(listing_id);

-- gift_cards
CREATE INDEX idx_gift_cards_code    ON public.gift_cards(code);           -- hot path: redemption lookup
CREATE INDEX idx_gift_cards_status  ON public.gift_cards(status);
CREATE INDEX idx_gift_cards_buyer   ON public.gift_cards(purchased_by) WHERE purchased_by IS NOT NULL;

-- coupons
CREATE INDEX idx_coupons_code       ON public.coupons(code);              -- hot path: checkout validation
CREATE INDEX idx_coupons_status     ON public.coupons(status);

-- orders
CREATE INDEX idx_orders_customer    ON public.orders(customer_id);
CREATE INDEX idx_orders_listing     ON public.orders(listing_id);
CREATE INDEX idx_orders_status      ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_affiliate   ON public.orders(affiliate_link_id) WHERE affiliate_link_id IS NOT NULL;
CREATE INDEX idx_orders_created_at  ON public.orders(created_at DESC);

-- featured_listings
CREATE INDEX idx_featured_status_ends  ON public.featured_listings(status, ends_at); -- cron query
CREATE INDEX idx_featured_vendor       ON public.featured_listings(vendor_id);
CREATE INDEX idx_featured_listing      ON public.featured_listings(listing_id);

-- commission_ledger
CREATE INDEX idx_commission_recipient        ON public.commission_ledger(recipient_id);
CREATE INDEX idx_commission_recipient_status ON public.commission_ledger(recipient_id, status);
CREATE INDEX idx_commission_order            ON public.commission_ledger(order_id);

-- notifications_log
CREATE INDEX idx_notifications_user   ON public.notifications_log(user_id);
CREATE INDEX idx_notifications_sent   ON public.notifications_log(sent_at DESC);

-- invite_tokens
CREATE INDEX idx_invite_tokens_token ON public.invite_tokens(token);
CREATE INDEX idx_invite_tokens_user  ON public.invite_tokens(user_id);


-- ============================================================
-- MIGRATION 004 — SEED DATA (platform_settings defaults)
-- Update these values before going to production.
-- Rates are stored as plain numeric strings (e.g. "0.025" = 2.5%)
-- Prices are stored as GMD amounts (e.g. "150" = GMD 150)
-- ============================================================

INSERT INTO public.platform_settings (key, value, description) VALUES
  ('platform_fee_rate',         '0.01',   'Platform fee: 1% taken from admin margin, vendor margin, and affiliate commission separately. Each party pays 1% of what they earn.'),
  ('affiliate_commission_rate',      '0.20',  'Default affiliate rate: 20% of vendor_margin. Overridden by category-specific settings below.'),
  ('affiliate_commission_fashion',   '0.25',  'Fashion category affiliate rate: 25% of vendor_margin.'),
  ('affiliate_commission_electronics','0.15', 'Electronics category affiliate rate: 15% of vendor_margin.'),
  ('sponsored_7day_price_gmd',  '150',    'Price in GMD for a 7-day sponsored listing.'),
  ('sponsored_30day_price_gmd', '500',    'Price in GMD for a 30-day sponsored listing.'),
  ('min_payout_gmd',            '10',     'Minimum wallet balance required to request a payout (ModemPay minimum).'),
  ('gift_card_expiry_months',   '12',     'Number of months a gift card is valid after purchase.'),
  ('credit_min_topup_gmd',      '100',    'Minimum credit top-up per transaction. Low barrier to entry, above ModemPay flat fee threshold.'),
  ('wave_business_number',      '',       'Tems Market Wave Business account number. Displayed on top-up screen for screenshot payments. Set before launch.'),
  ('screenshot_max_age_hours',  '24',     'Maximum age of a Wave screenshot transaction timestamp. Prevents reuse of old screenshots.'),
  ('momo_reconcile_fee_rate',   '0.01',   'MoMo Reconcile fee: 1% of combined platform collection per order. e.g. admin GMD 1 + vendor GMD 1 + affiliate GMD 0.20 = GMD 2.20 total → MoMo gets GMD 0.022. Paid by Tems from its own earnings.'),
  ('momo_reconcile_sla_hours',  '24',     'Hours before MoMo Reconcile auto-releases commission if manager times out.'),
  ('settlement_time_utc',       '22:00',  'Daily settlement run time in UTC (10 PM UTC = 11 PM Gambia time).'),
  ('settlement_min_gmd',        '10',     'Minimum available balance to trigger daily settlement payout. Below this: carry forward to next day.')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- USEFUL VIEWS (not migrations — create after schema is stable)
-- ============================================================

-- Full price stack per product (superadmin dashboard)
CREATE OR REPLACE VIEW public.price_stack_view AS
SELECT
  p.id                        AS product_id,
  p.title,
  p.category,
  p.base_price,
  pl.admin_price,
  pl.admin_margin,
  pl.admin_id,
  u.full_name                 AS admin_name,
  p.status,
  p.inventory_type
FROM public.products p
LEFT JOIN public.price_layers pl ON pl.product_id = p.id
LEFT JOIN public.users u         ON u.id = pl.admin_id;

-- Active sponsored listings with product info (customer feed)
CREATE OR REPLACE VIEW public.active_sponsored_view AS
SELECT
  fl.id                       AS featured_id,
  fl.listing_id,
  fl.ends_at,
  fl.position,
  vl.vendor_price,
  vl.vendor_id,
  p.title,
  p.images,
  p.category
FROM public.featured_listings fl
JOIN public.vendor_listings vl  ON vl.id = fl.listing_id AND vl.is_active = TRUE
JOIN public.products p          ON p.id = vl.product_id  AND p.status = 'active'
WHERE fl.status = 'active'
  AND fl.ends_at > NOW()
ORDER BY fl.position ASC NULLS LAST, fl.starts_at DESC;

-- Affiliate/vendor/admin wallet balance summary
CREATE OR REPLACE VIEW public.wallet_balances AS
SELECT
  recipient_id,
  recipient_role,
  SUM(amount) FILTER (WHERE status = 'pending')   AS pending_balance,    -- waiting for delivery
  SUM(amount) FILTER (WHERE status = 'available') AS available_balance,  -- ready to withdraw
  SUM(amount) FILTER (WHERE status = 'paid')      AS total_paid_out
FROM public.commission_ledger
GROUP BY recipient_id, recipient_role;


-- ============================================================
-- NOTES FOR EDGE FUNCTIONS
-- ============================================================
-- All Edge Functions must use SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
-- The service role key is never exposed to the client app.
-- Client app only uses SUPABASE_ANON_KEY.
--
-- Functions that WRITE to commission_ledger, gift_cards, coupon_uses,
-- orders (status updates), featured_listings: ALL use service role.
--
-- The modempay-webhook Edge Function is the most critical write path.
-- It must implement idempotency: check order payment_status = 'paid'
-- before processing any webhook event.
