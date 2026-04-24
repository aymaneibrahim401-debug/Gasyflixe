import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Upload, Save, Library as LibraryIcon, Play } from "lucide-react";
import { toast } from "sonner";
import { resolvePoster } from "@/lib/posters";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, loading } = useAuth();
  const { profile, setAvatar: setCtxAvatar, setName: setCtxName, refresh } = useProfile();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => { document.title = "Mon profil — GasyFlix"; }, []);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("purchases")
      .select("status, created_at, movies(title, slug, poster_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPurchases(data || []));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const initial = (displayName || user.email || "?").charAt(0).toUpperCase();

  const handleAvatar = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      if (updErr) throw updErr;
      setAvatarUrl(data.publicUrl);
      setCtxAvatar(data.publicUrl);
      toast.success("Photo mise à jour");
    } catch (e: any) {
      toast.error(e.message || "Erreur upload");
    } finally { setBusy(false); }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) { toast.error("Nom requis."); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("user_id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setCtxName(displayName.trim());
    toast.success("Profil mis à jour");
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[^A-Za-z0-9]/.test(pwd)) {
      toast.error("Mot de passe trop faible."); return;
    }
    if (pwd !== pwdConfirm) { toast.error("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mot de passe changé");
    setPwd(""); setPwdConfirm("");
  };

  const paid = purchases.filter((p) => p.status === "paid" && p.movies);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12 max-w-4xl">
        <h1 className="font-display text-4xl text-cream mb-8">Mon profil</h1>

        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="library">Mes films</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-5 border border-border rounded-sm bg-card p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/40">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="bg-primary text-primary-foreground font-display text-2xl">{initial}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar-input" className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-3 py-2 border border-primary/40 text-primary rounded-sm hover:bg-primary/10 text-sm">
                    <Upload className="h-4 w-4" /> Changer la photo
                  </span>
                  <input id="avatar-input" type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])} />
                </Label>
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input value={user.email || ""} disabled className="bg-background" />
            </div>

            <div>
              <Label htmlFor="dn">Nom affiché</Label>
              <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background" />
            </div>

            <Button onClick={handleSaveName} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
              <Save className="h-4 w-4 mr-2" /> Enregistrer
            </Button>
          </TabsContent>

          <TabsContent value="security" className="border border-border rounded-sm bg-card p-6">
            <h2 className="font-display text-xl text-cream mb-4">Changer le mot de passe</h2>
            <form onSubmit={handleChangePwd} className="space-y-4">
              <div>
                <Label htmlFor="np">Nouveau mot de passe</Label>
                <PasswordInput id="np" value={pwd} onChange={(e) => setPwd(e.target.value)} showHint required />
              </div>
              <div>
                <Label htmlFor="np2">Confirmer</Label>
                <PasswordInput id="np2" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} required />
              </div>
              <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
                {busy ? "…" : "Mettre à jour"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-cream">Mes films achetés</h2>
              <Button variant="outline" onClick={() => navigate("/library")} className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground">
                <LibraryIcon className="h-4 w-4 mr-2" /> Bibliothèque complète
              </Button>
            </div>
            {paid.length === 0 ? (
              <p className="text-muted-foreground border border-dashed border-border rounded-sm p-8 text-center">Vous n'avez encore aucun film acheté.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {paid.map((p, i) => (
                  <Link to={`/film/${p.movies.slug}`} key={i} className="group">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-border">
                      <img src={resolvePoster(p.movies.poster_url, p.movies.slug)} alt={p.movies.title} className="w-full h-full object-cover transition group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-noir to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                        <Play className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="mt-2 font-display text-sm text-cream group-hover:text-primary line-clamp-1">{p.movies.title}</h3>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
