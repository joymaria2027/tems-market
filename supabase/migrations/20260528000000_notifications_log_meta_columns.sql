-- ============================================================
-- Migration: Add Meta WhatsApp / Africa's Talking columns
-- ============================================================

-- Add columns for tracking Meta WhatsApp Cloud API and Africa's Talking message IDs
ALTER TABLE public.notifications_log
  ADD COLUMN IF NOT EXISTS meta_message_id TEXT,
  ADD COLUMN IF NOT EXISTS at_message_id TEXT;

COMMENT ON COLUMN public.notifications_log.meta_message_id IS 'Meta WhatsApp Cloud API message ID (wamid)';
COMMENT ON COLUMN public.notifications_log.at_message_id IS 'Africa''s Talking SMS message ID (fallback)';
