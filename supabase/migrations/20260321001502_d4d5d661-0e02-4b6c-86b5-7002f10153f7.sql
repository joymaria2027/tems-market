
-- Security definer function to check user role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- Admin can update any product (approve/reject)
CREATE POLICY "Admins can update any product"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert gift cards
CREATE POLICY "Admins can insert gift cards"
ON public.gift_cards FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can view all gift cards
CREATE POLICY "Admins can view all gift cards"
ON public.gift_cards FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert coupons
CREATE POLICY "Admins can insert coupons"
ON public.coupons FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can view all products (including non-approved)
CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
