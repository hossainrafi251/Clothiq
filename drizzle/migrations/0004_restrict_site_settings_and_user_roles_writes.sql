-- 1) site_settings: explicit allow-list of public keys instead of blanket exclusion
DROP POLICY IF EXISTS "Public site settings are viewable" ON public.site_settings;

CREATE POLICY "Public storefront settings are viewable"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key = ANY (ARRAY[
  'site_name','site_tagline','site_description','footer_about',
  'contact_phone','contact_phone_2','whatsapp_number',
  'support_email','contact_address','business_hours',
  'facebook_url','instagram_url','tiktok_url','youtube_url',
  'hero_headline','hero_subheadline','hero_text','hero_badge','hero_cta','hero_image_url',
  'promo_text','shop_headline','product_note',
  'reviews_eyebrow','reviews_title','reviews_subtitle',
  'flash_sale_active','flash_sale_title','flash_sale_ends_at',
  'delivery_inside_dhaka','delivery_outside_dhaka',
  'meta_pixel_id'
]));

-- 2) user_roles: no client writes at all; role assignment is server/admin-side only
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "No client writes to user roles" ON public.user_roles;
CREATE POLICY "No client writes to user roles"
ON public.user_roles
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "No client role updates" ON public.user_roles;
CREATE POLICY "No client role updates"
ON public.user_roles
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No client role deletes" ON public.user_roles;
CREATE POLICY "No client role deletes"
ON public.user_roles
FOR DELETE
TO anon, authenticated
USING (false);