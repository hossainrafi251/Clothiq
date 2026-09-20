ALTER TABLE public.products
ADD COLUMN offer_note text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.products.offer_note IS 'Optional offer or freebie subtitle displayed only below the title on the dedicated product page.';