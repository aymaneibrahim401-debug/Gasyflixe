-- 1. Enum + table user_roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer pour éviter récursion RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. RLS admin sur movies (insert/update/delete)
CREATE POLICY "Admins can insert movies" ON public.movies
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update movies" ON public.movies
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete movies" ON public.movies
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 5. Ajouter colonne video_url à movies (streaming)
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.movies ALTER COLUMN price_cents SET DEFAULT 0;
ALTER TABLE public.movies ALTER COLUMN director SET DEFAULT '';
ALTER TABLE public.movies ALTER COLUMN year SET DEFAULT EXTRACT(YEAR FROM now())::int;
ALTER TABLE public.movies ALTER COLUMN duration_min SET DEFAULT 0;
ALTER TABLE public.movies ALTER COLUMN genre SET DEFAULT '';

-- 6. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('posters', 'posters', true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('videos', 'videos', true, 2147483648, ARRAY['video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies posters (public read, admin write)
CREATE POLICY "Posters publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'posters');

CREATE POLICY "Admins can upload posters" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posters' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posters" ON storage.objects
  FOR UPDATE USING (bucket_id = 'posters' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posters" ON storage.objects
  FOR DELETE USING (bucket_id = 'posters' AND public.has_role(auth.uid(), 'admin'));

-- 8. Storage policies videos (public read pour streaming, admin write)
CREATE POLICY "Videos publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

-- 9. Trigger handle_new_user existe déjà mais s'assurer qu'il est attaché
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();