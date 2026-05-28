-- ============================================================
-- Migration: Add 'email' to notification_channel ENUM
-- ============================================================

ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'email';
