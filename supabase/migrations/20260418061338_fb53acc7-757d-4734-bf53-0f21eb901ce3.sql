
-- 1) Add Ariary price + badge column on movies
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS price_ariary INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge TEXT;

-- 2) Allow users to insert their own purchases (manual MM flow)
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;
CREATE POLICY "Users can insert own purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update purchases" ON public.purchases;
CREATE POLICY "Admins can update purchases"
ON public.purchases FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Add columns to purchases for Mobile Money manual flow
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS payer_name TEXT,
  ADD COLUMN IF NOT EXISTS payer_phone TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;
