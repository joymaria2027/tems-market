-- ============================================================
-- Migration: Add can_create_tickets to vendor_profiles
-- Superadmin must enable this per vendor before they can create
-- ticket products or access the ticketing management dashboard.
-- ============================================================

ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS can_create_tickets BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.vendor_profiles.can_create_tickets IS
  'Superadmin-granted permission to create ticket-type products and access the ticket management dashboard.';
