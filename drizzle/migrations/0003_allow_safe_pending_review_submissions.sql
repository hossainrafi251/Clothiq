REVOKE INSERT ON TABLE public.reviews FROM anon, authenticated;
GRANT INSERT (product_id, author, rating, comment) ON TABLE public.reviews TO anon, authenticated;

CREATE POLICY "Customers can submit pending reviews"
ON public.reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (
  approved = false
  AND char_length(btrim(author)) BETWEEN 1 AND 80
  AND rating BETWEEN 1 AND 5
  AND char_length(btrim(comment)) BETWEEN 1 AND 1000
  AND (
    product_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.products
      WHERE products.id = reviews.product_id
    )
  )
);