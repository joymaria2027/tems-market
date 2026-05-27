-- ============================================================
-- Migration: Add product_type + ticket_meta to products
--            Seed ticket categories
-- ============================================================

-- Add product_type column (physical default, ticket for events)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'physical'
    CHECK (product_type IN ('physical', 'ticket'));

-- Add ticket_meta JSONB column for ticket-specific fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ticket_meta JSONB;

COMMENT ON COLUMN public.products.product_type IS 'physical | ticket — determines UI fields, cart display, and checkout behavior';
COMMENT ON COLUMN public.products.ticket_meta IS 'JSON object for ticket products: {event_date, venue, ticket_type, valid_from, valid_to, terms, barcode_required}';

-- Seed ticket categories
INSERT INTO public.categories (name, slug) VALUES
  ('Food Ticket',    'food-ticket'),
  ('Drinks Ticket',  'drinks-ticket'),
  ('Games Ticket',   'games-ticket'),
  ('Gate / Entry Ticket', 'gate-entry-ticket'),
  ('Parking Ticket', 'parking-ticket')
ON CONFLICT (name) DO NOTHING;
