-- Fix 1: Prevent users from self-promoting to admin
DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role != 'admin'
);

-- Fix 2: Prevent vendors from self-assigning sponsored status
DROP POLICY "Vendors can insert own products" ON public.products;
CREATE POLICY "Vendors can insert own products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (
  vendor_id = auth.uid()
  AND sponsored = false
);

DROP POLICY "Vendors can update own products" ON public.products;
CREATE POLICY "Vendors can update own products"
ON public.products FOR UPDATE TO authenticated
USING (vendor_id = auth.uid())
WITH CHECK (vendor_id = auth.uid() AND sponsored = false);

-- Fix 4: Restrict storage uploads to user's own folder
DROP POLICY "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);