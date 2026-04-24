-- 1. Ajouter dates aux films
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS release_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

-- 2. Table site_settings (clé/valeur)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings publiquement visibles"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins peuvent insérer settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins peuvent modifier settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins peuvent supprimer settings"
  ON public.site_settings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Valeurs par défaut
INSERT INTO public.site_settings (key, value) VALUES
  ('about_text', 'Boodji Prod est un studio malgache passionné par le cinéma vintage et les histoires authentiques. Notre mission est de raconter Madagascar à travers ses films, ses voix et ses émotions.'),
  ('contact_phone', '+261 34 00 000 00'),
  ('contact_email', 'contact@gasyflix.com'),
  ('contact_text', 'Une question, une suggestion ou un projet ? Notre équipe vous répond avec plaisir.'),
  ('payment_number', '+261 34 00 000 00'),
  ('payment_holder', 'BOODJI PROD')
ON CONFLICT (key) DO NOTHING;