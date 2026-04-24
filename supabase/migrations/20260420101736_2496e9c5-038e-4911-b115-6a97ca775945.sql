-- Ajout champ acteurs aux films
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS cast_list text DEFAULT '';

-- Ajout champs profil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Ajout champ notification admin sur paiements
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS read_by_admin boolean NOT NULL DEFAULT false;

-- Mise à jour du trigger handle_new_user pour inclure l'email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$function$;

-- S'assurer que le trigger existe sur auth.users pour handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- S'assurer que le trigger admin auto-promotion existe
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_promote_admin();

-- Contrainte unique sur user_id de profiles si pas déjà présente
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

-- Policies : admins peuvent voir et modifier tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Bucket avatars pour les photos de profil
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le bucket avatars
DROP POLICY IF EXISTS "Avatars publiquement visibles" ON storage.objects;
CREATE POLICY "Avatars publiquement visibles" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policies pour les buckets posters et videos (admin upload)
DROP POLICY IF EXISTS "Admins manage posters" ON storage.objects;
CREATE POLICY "Admins manage posters" ON storage.objects
  FOR ALL USING (bucket_id = 'posters' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'posters' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage videos" ON storage.objects;
CREATE POLICY "Admins manage videos" ON storage.objects
  FOR ALL USING (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role));