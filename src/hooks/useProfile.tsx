import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
}

interface Ctx {
  profile: ProfileData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setAvatar: (url: string) => void;
  setName: (name: string) => void;
}

const ProfileContext = createContext<Ctx>({
  profile: null,
  loading: true,
  refresh: async () => {},
  setAvatar: () => {},
  setName: () => {},
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, is_blocked")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile(data ?? { display_name: null, avatar_url: null, is_blocked: false });
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto sign-out if blocked
  useEffect(() => {
    if (profile?.is_blocked) {
      supabase.auth.signOut();
    }
  }, [profile?.is_blocked]);

  const setAvatar = (url: string) => setProfile((p) => p ? { ...p, avatar_url: url } : p);
  const setName = (name: string) => setProfile((p) => p ? { ...p, display_name: name } : p);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, setAvatar, setName }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
