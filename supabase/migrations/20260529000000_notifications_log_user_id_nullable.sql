-- Make user_id nullable so we can log notifications for
-- users who haven't created accounts yet (e.g. invite links
-- sent to phone numbers before account creation).
ALTER TABLE public.notifications_log
  ALTER COLUMN user_id DROP NOT NULL;
