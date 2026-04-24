-- Reset featured flags
UPDATE public.movies SET featured = false;

-- Insert SORONA as featured movie (idempotent)
INSERT INTO public.movies (slug, title, director, year, genre, synopsis, poster_url, price_ariary, price_cents, badge, featured, duration_min)
VALUES (
  'sorona',
  'SORONA',
  'BOODJI PROD',
  2026,
  'Drame',
  'Sur une plage bordée de cocotiers, deux destins se croisent dans le silence d''un secret trop lourd à porter. Sorona raconte l''histoire d''un amour suspendu entre la honte et l''espoir, dans une Madagascar à la fois sublime et impitoyable. Une fresque intime portée par Boodjï Dodo et Mohamed Fazilla, où chaque regard pèse plus que les mots.',
  '/src/assets/poster-sorona.jpg',
  15000,
  1500,
  'Nouveau',
  true,
  92
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  director = EXCLUDED.director,
  year = EXCLUDED.year,
  synopsis = EXCLUDED.synopsis,
  poster_url = EXCLUDED.poster_url,
  badge = EXCLUDED.badge,
  featured = true;