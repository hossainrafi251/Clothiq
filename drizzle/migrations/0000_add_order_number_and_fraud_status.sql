CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001 INCREMENT BY 1;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number BIGINT;

-- Backfill existing orders in creation order.
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.orders
  WHERE order_number IS NULL
)
UPDATE public.orders o
SET order_number = 1001 + n.rn - 1
FROM numbered n
WHERE o.id = n.id;

-- Move the sequence past any backfilled values.
SELECT setval('public.order_number_seq', GREATEST(1001, COALESCE((SELECT MAX(order_number) FROM public.orders), 1000) + 1), false);

ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT nextval('public.order_number_seq');

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON public.orders (order_number);

-- Tracks whether a negative-feedback event was already reported to Meta.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS meta_feedback_event TEXT NOT NULL DEFAULT '';