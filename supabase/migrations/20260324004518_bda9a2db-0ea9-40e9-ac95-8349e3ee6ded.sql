DROP POLICY "Vendors can insert own products" ON public.products;
CREATE POLICY "Vendors can insert own products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (
  vendor_id = auth.uid()
  AND sponsored = false
  AND public.has_role(auth.uid(), 'vendor')
);

DROP POLICY "Vendors can update own products" ON public.products;
CREATE POLICY "Vendors can update own products"
ON public.products FOR UPDATE TO authenticated
USING (vendor_id = auth.uid() AND public.has_role(auth.uid(), 'vendor'))
WITH CHECK (vendor_id = auth.uid() AND sponsored = false AND public.has_role(auth.uid(), 'vendor'));