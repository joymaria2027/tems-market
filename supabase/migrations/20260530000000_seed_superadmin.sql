-- ============================================================
-- TEMS MARKET — Seed Superadmin Account
-- ============================================================
-- Creates the initial superadmin auth user with email + password.
-- The handle_new_auth_user trigger creates the public.users record.
-- We then update it to set the correct role and status.
--
-- Initial credentials:
--   Email:    admin@temsmarket.gm
--   Password: TemAdmin@2026
--
-- IMPORTANT: Change this password on first login via the
-- update-password Edge Function.
-- ============================================================

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Check if superadmin already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@temsmarket.gm'
  ) INTO v_exists;

  IF NOT v_exists THEN
    -- Insert into auth.users with encrypted password
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@temsmarket.gm',
      crypt('TemAdmin@2026', gen_salt('bf')),
      NOW(),
      NOW(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'role', 'superadmin',
        'phone', '+2209990000',
        'full_name', 'Super Admin'
      ),
      NOW(),
      NOW(),
      '+2209990000',
      NOW()
    )
    RETURNING id INTO v_user_id;

    -- The handle_new_auth_user trigger runs on INSERT to auth.users
    -- and creates a public.users record with role='superadmin' and status='active'
    -- (because role FROM raw_user_meta_data is 'superadmin')
    --
    -- But the trigger sets status = 'active' only for customer/affiliate,
    -- so for superadmin it sets status = 'pending'. Let's fix that.
    UPDATE public.users
    SET status = 'active',
        full_name = 'Super Admin',
        phone = '+2209990000'
    WHERE id = v_user_id;

    -- Log
    RAISE NOTICE 'Superadmin created: admin@temsmarket.gm / TemAdmin@2026 (id: %)', v_user_id;
  ELSE
    RAISE NOTICE 'Superadmin already exists — skipping seed.';
  END IF;
END $$;
