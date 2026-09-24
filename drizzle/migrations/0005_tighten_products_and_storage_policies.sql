DROP POLICY IF EXISTS "Products are publicly viewable" ON public.products;
CREATE POLICY "Published products are publicly viewable" ON public.products
  FOR SELECT TO anon, authenticated
  USING (slug IS NOT NULL AND btrim(title) <> '' AND price >= 0);

DROP POLICY IF EXISTS "No client delete of storage objects" ON storage.objects;
DROP POLICY IF EXISTS "No client insert of storage objects" ON storage.objects;
DROP POLICY IF EXISTS "No client read of storage objects" ON storage.objects;
DROP POLICY IF EXISTS "No client update of storage objects" ON storage.objects;