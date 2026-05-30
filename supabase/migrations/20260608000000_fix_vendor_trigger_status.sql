-- ============================================================
-- TEMS MARKET — Fix handle_new_auth_user trigger status
-- ============================================================
-- Vendors, admins, and superadmins can only be created via 
-- pre-approved admin/invite flows, so they should be created 
-- with status 'active' instead of 'pending'.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_status user_status;
  v_phone text;
  v_full_name text;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer');
  
  -- All users (customers, affiliates, vendors, admins, superadmins)
  -- are active immediately upon registration in auth.users.
  v_status := 'active';

  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.users (
    id, 
    phone, 
    full_name, 
    email, 
    date_of_birth, 
    age_verified, 
    role, 
    status
  )
  VALUES (
    NEW.id,
    v_phone,
    v_full_name,
    NEW.email,
    (NEW.raw_user_meta_data->>'date_of_birth')::date,
    COALESCE((NEW.raw_user_meta_data->>'age_verified')::boolean, false),
    v_role,
    v_status
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    date_of_birth = EXCLUDED.date_of_birth,
    age_verified = EXCLUDED.age_verified,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
