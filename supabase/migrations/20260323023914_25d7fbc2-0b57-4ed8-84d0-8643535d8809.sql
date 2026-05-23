-- Tighten the referral insert policy: only allow inserting referrals for your own orders
DROP POLICY "Users can insert referrals" ON public.affiliate_referrals;
CREATE POLICY "Users can insert referrals for own orders" ON public.affiliate_referrals
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = affiliate_referrals.order_id AND orders.shopper_id = auth.uid()
  ));