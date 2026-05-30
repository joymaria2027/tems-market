-- ============================================================
-- TEMS MARKET — Seed product categories
-- ============================================================
-- The target schema migration (20260523000000) dropped the
-- categories table. This migration recreates it if missing
-- and seeds both regular and ticket categories.
-- ============================================================

-- Create the categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (idempotent)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Add SELECT policy if not exists (for anon & authenticated users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'categories' AND policyname = 'Anyone can view categories'
  ) THEN
    CREATE POLICY "Anyone can view categories" ON public.categories
      FOR SELECT USING (true);
  END IF;
END $$;

-- Seed regular product categories (ignore duplicates)
INSERT INTO public.categories (name, slug) VALUES
  ('Electronics',     'electronics'),
  ('Fashion',         'fashion'),
  ('Home & Garden',   'home-garden'),
  ('Beauty',          'beauty'),
  ('Sports',          'sports'),
  ('Books',           'books'),
  ('Toys',            'toys'),
  ('Food & Drinks',   'food-drinks'),
  ('Health',          'health'),
  ('Services',        'services')
ON CONFLICT (slug) DO NOTHING;

-- Ensure ticket categories are also present (from earlier migration)
INSERT INTO public.categories (name, slug) VALUES
  ('Food Ticket',         'food-ticket'),
  ('Drinks Ticket',       'drinks-ticket'),
  ('Games Ticket',        'games-ticket'),
  ('Gate / Entry Ticket', 'gate-entry-ticket'),
  ('Parking Ticket',      'parking-ticket')
ON CONFLICT (slug) DO NOTHING;
