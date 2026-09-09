ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.slugify(_txt text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT btrim(regexp_replace(lower(coalesce(_txt, '')), '[^a-z0-9]+', '-', 'g'), '-')
$$;

CREATE OR REPLACE FUNCTION public.products_set_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; n int := 1;
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    base := public.slugify(NEW.title);
  ELSE
    base := public.slugify(NEW.slug);
  END IF;
  IF base = '' THEN base := 'product'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.products p WHERE p.slug = candidate AND p.id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS products_slug ON public.products;
CREATE TRIGGER products_slug
BEFORE INSERT OR UPDATE OF title, slug ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_set_slug();

UPDATE public.products SET slug = NULL;

ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);