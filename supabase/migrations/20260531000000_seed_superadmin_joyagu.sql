-- ============================================================
-- TEMS MARKET — Seed Superadmin Account (joyagu2023@gmail.com)
-- ============================================================
-- Creates the superadmin auth user for joyagu2023@gmail.com.
-- The handle_new_auth_user trigger creates the public.users record.
-- We then update it to set the correct role and status.
--
-- Initial credentials:
--   Email:    joyagu2023@gmail.com
--   Password: JoyaTems@2026!
--
-- IMPORTANT: Change this password on first login via the
-- SuperAdmin Dashboard -> Security -> Change Password.
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
    SELECT 1 FROM auth.users WHERE email = 'joyagu2023@gmail.com'
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
      'joyagu2023@gmail.com',
      crypt('JoyaTems@2026!', gen_salt('bf')),
      NOW(),
      NOW(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'role', 'superadmin',
        'phone', '+2209990000',
        'full_name', 'Joy Agu'
      ),
      NOW(),
      NOW(),
      '+2209990000',
      NOW()
    )
    RETURNING id INTO v_user_id;

    -- Update public.users record created by handle_new_auth_user trigger
    UPDATE public.users
    SET role = 'superadmin',
        status = 'active',
        full_name = 'Joy Agu',
        phone = '+2209990000',
        email = 'joyagu2023@gmail.com'
    WHERE id = v_user_id;

    -- Log
    RAISE NOTICE 'Superadmin created: joyagu2023@gmail.com / JoyaTems@2026! (id: %)', v_user_id;
  ELSE
    RAISE NOTICE 'Superadmin (joyagu2023@gmail.com) already exists — skipping seed.';
  END IF;
END $$;
