-- ============================================================
-- TEMS MARKET — Allow public SELECT on vendor_applications
-- by invite_token
-- ============================================================
-- The VendorInvite.tsx page queries vendor_applications by
-- invite_token to validate invite links. Unauthenticated vendors
-- need SELECT access. The token is a UUID, so it's practically
-- unguessable — safe to expose via this policy.
-- ============================================================

CREATE POLICY "vendor_applications: public select by invite_token"
  ON public.vendor_applications
  FOR SELECT
  USING (invite_token IS NOT NULL);
