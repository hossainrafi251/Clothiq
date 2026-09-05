-- 1. Restrict the SECURITY DEFINER helper function to server-side use only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- 2. Explicit deny-all policies on tables holding customer PII / credentials.
--    All legitimate access happens server-side with service_role, which bypasses RLS.
CREATE POLICY "No client access to orders"
  ON public.orders FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "No client access to incomplete orders"
  ON public.incomplete_orders FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "No client access to meta settings"
  ON public.meta_settings FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- 3. Storage: product-images is served exclusively through a server route using
--    service_role. Add explicit policies so no client role can touch objects.
CREATE POLICY "No client read of storage objects"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY "No client insert of storage objects"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client update of storage objects"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "No client delete of storage objects"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (false);