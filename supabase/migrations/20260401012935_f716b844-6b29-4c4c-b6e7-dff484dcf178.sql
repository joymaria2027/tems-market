
-- Add vendor verification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vendor_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_documents text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verification_note text,
  ADD COLUMN IF NOT EXISTS fulfillment_rate numeric NOT NULL DEFAULT 100;

-- Update products RLS: approved products only visible if vendor is verified
DROP POLICY "Anyone can view approved products" ON public.products;
CREATE POLICY "Anyone can view approved products" ON public.products
  FOR SELECT TO public
  USING (
    (
      status = 'approved' AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = products.vendor_id
        AND profiles.vendor_status = 'verified'
      )
    )
    OR vendor_id = auth.uid()
  );

-- Admin can manage all profiles (for verification updates)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
