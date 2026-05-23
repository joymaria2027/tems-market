-- Affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code text UNIQUE NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 5,
  total_earned numeric NOT NULL DEFAULT 0,
  total_clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate" ON public.affiliates
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all affiliates" ON public.affiliates
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own affiliate" ON public.affiliates
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update affiliates" ON public.affiliates
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can look up affiliate by code" ON public.affiliates
  FOR SELECT TO public USING (true);

-- Affiliate referrals table
CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.affiliate_referrals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = affiliate_referrals.affiliate_id AND affiliates.user_id = auth.uid()));

CREATE POLICY "Admins can view all referrals" ON public.affiliate_referrals
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert referrals" ON public.affiliate_referrals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update referrals" ON public.affiliate_referrals
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Function to increment affiliate clicks
CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(affiliate_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.affiliates SET total_clicks = total_clicks + 1 WHERE code = affiliate_code;
END;
$$;