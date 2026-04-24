import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Trash2, Pencil, Save, X, Film as FilmIcon, CheckCircle2, XCircle, Bell, Lock, Unlock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || `film-${Date.now()}`;

interface MovieRow {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  poster_url: string;
  video_url: string | null;
  price_ariary: number;
  release_date: string | null;
  end_date: string | null;
  director: string;
  featured: boolean;
  cast_list?: string | null;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { settings, reload: reloadSettings } = useSiteSettings();

  // Add film
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [poster, setPoster] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [releaseDate, setReleaseDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cast, setCast] = useState("");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);

  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState<MovieRow | null>(null);
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);

  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => { setDraft(settings); }, [settings]);

  useEffect(() => { document.title = "Admin — GasyFlix"; }, []);

  const loadMovies = async () => {
    const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
    setMovies((data as MovieRow[]) || []);
  };
  const loadPurchases = async () => {
    const { data } = await supabase.from("purchases")
      .select("*, movies(title, slug)")
      .order("created_at", { ascending: false });
    setPurchases(data || []);
  };
  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { console.warn("loadUsers: no session, skipping"); return; }
      const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "list" } });
      if (error) {
        console.error("loadUsers error", error);
        toast.error("Impossible de charger les utilisateurs. Réessayez.");
        return;
      }
      setUsers((data as any)?.users || []);
    } catch (e: any) {
      console.error("loadUsers fatal", e);
      toast.error("Erreur réseau lors du chargement des utilisateurs.");
    }
  };

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user || !isAdmin) return;
    loadMovies(); loadPurchases(); loadUsers();
    const ch = supabase.channel("admin-purchases")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "purchases" }, (payload) => {
        loadPurchases();
        toast.info("🔔 Nouvelle demande de paiement", { description: "Un client vient de soumettre un paiement." });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "purchases" }, () => loadPurchases())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, user, authLoading, roleLoading]);

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const pendingCount = purchases.filter(p => p.status === "pending").length;

  const updatePurchase = async (id: string, status: "paid" | "rejected") => {
    const { error } = await supabase.from("purchases").update({ status, read_by_admin: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "paid" ? "Paiement validé — accès débloqué" : "Paiement rejeté");
    loadPurchases();
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !synopsis.trim() || !poster) {
      toast.error("Titre, synopsis et affiche requis."); return;
    }
    if (!video && !videoUrl.trim()) {
      toast.error("Fournissez un fichier vidéo OU une URL vidéo."); return;
    }
    setBusy(true);
    try {
      const slug = `${slugify(title)}-${Date.now().toString(36)}`;
      setProgress("Upload affiche…");
      const posterPath = `${slug}/${Date.now()}-${poster.name}`;
      const { error: pErr } = await supabase.storage.from("posters").upload(posterPath, poster, { contentType: poster.type });
      if (pErr) throw pErr;
      const { data: pUrl } = supabase.storage.from("posters").getPublicUrl(posterPath);

      let finalVideoUrl = videoUrl.trim();
      if (video) {
        setProgress(`Upload vidéo (${(video.size / 1024 / 1024).toFixed(1)} MB)…`);
        const videoPath = `${slug}/${Date.now()}-${video.name}`;
        const { error: vErr } = await supabase.storage.from("videos").upload(videoPath, video, { contentType: video.type });
        if (vErr) throw vErr;
        finalVideoUrl = supabase.storage.from("videos").getPublicUrl(videoPath).data.publicUrl;
      }

      setProgress("Publication…");
      const { error: insErr } = await supabase.from("movies").insert({
        title, slug,
        synopsis,
        cast_list: cast,
        poster_url: pUrl.publicUrl,
        video_url: finalVideoUrl,
        director: "BOODJI PROD",
        genre: "Film",
        year: releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear(),
        duration_min: 0,
        price_cents: 0,
        price_ariary: price,
        release_date: releaseDate || null,
        end_date: endDate || null,
        featured: false,
      });
      if (insErr) throw insErr;

      toast.success("Film publié !");
      setTitle(""); setSynopsis(""); setPoster(null); setVideo(null); setVideoUrl("");
      setPrice(0); setReleaseDate(""); setEndDate(""); setCast("");
      (document.getElementById("poster-input") as HTMLInputElement).value = "";
      const vi = document.getElementById("video-input") as HTMLInputElement | null;
      if (vi) vi.value = "";
      await loadMovies();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la publication");
    } finally {
      setBusy(false); setProgress("");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    const { error } = await supabase.from("movies").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Film supprimé");
    loadMovies();
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      let { poster_url, video_url } = editing;

      if (editPosterFile) {
        const path = `${editing.slug}/${Date.now()}-${editPosterFile.name}`;
        const { error } = await supabase.storage.from("posters").upload(path, editPosterFile, { contentType: editPosterFile.type });
        if (error) throw error;
        poster_url = supabase.storage.from("posters").getPublicUrl(path).data.publicUrl;
      }
      if (editVideoFile) {
        const path = `${editing.slug}/${Date.now()}-${editVideoFile.name}`;
        const { error } = await supabase.storage.from("videos").upload(path, editVideoFile, { contentType: editVideoFile.type });
        if (error) throw error;
        video_url = supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("movies").update({
        title: editing.title,
        synopsis: editing.synopsis,
        cast_list: editing.cast_list || "",
        price_ariary: editing.price_ariary,
        release_date: editing.release_date || null,
        end_date: editing.end_date || null,
        poster_url, video_url,
        featured: editing.featured,
      }).eq("id", editing.id);
      if (error) throw error;
      toast.success("Film mis à jour");
      setEditing(null); setEditPosterFile(null); setEditVideoFile(null);
      loadMovies();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally { setBusy(false); }
  };

  const saveSettings = async () => {
    const rows = Object.entries(draft).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) { toast.error(error.message); return; }
    toast.success("Paramètres enregistrés");
    reloadSettings();
  };

  const toggleBlock = async (u: any) => {
    const action = u.profile?.is_blocked || u.banned_until ? "unblock" : "block";
    const { error } = await supabase.functions.invoke("admin-users", { body: { action, user_id: u.id } });
    if (error) { toast.error(error.message); return; }
    toast.success(action === "block" ? "Utilisateur bloqué" : "Utilisateur débloqué");
    loadUsers();
  };

  const deleteUser = async (u: any) => {
    if (u.email === "aymaneibrahim401@gmail.com") { toast.error("Impossible de supprimer l'admin principal."); return; }
    if (!confirm(`Supprimer définitivement ${u.email} ?`)) return;
    const { error } = await supabase.functions.invoke("admin-users", { body: { action: "delete", user_id: u.id } });
    if (error) { toast.error(error.message); return; }
    toast.success("Utilisateur supprimé");
    loadUsers();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="font-display text-4xl text-cream mb-1">Tableau de bord admin</h1>
              <p className="text-muted-foreground">Gérez les films, paiements, utilisateurs et le contenu du site.</p>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 border border-primary/40 bg-primary/10 rounded-sm">
                <Bell className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm text-primary font-display">{pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="films" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="films">Films</TabsTrigger>
              <TabsTrigger value="purchases">
                Paiements {pendingCount > 0 && <Badge className="ml-2 bg-primary text-primary-foreground">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="settings">Pages & Paiement</TabsTrigger>
            </TabsList>

            {/* FILMS */}
            <TabsContent value="films" className="space-y-8">
              <form onSubmit={handlePublish} className="border border-border rounded-sm bg-card p-6 space-y-4">
                <h2 className="font-display text-xl text-cream">Ajouter un film</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Titre</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" required />
                  </div>
                  <div>
                    <Label>Prix (Ariary)</Label>
                    <Input type="number" min={0} value={price} onChange={(e) => setPrice(parseInt(e.target.value) || 0)} className="bg-background" required />
                  </div>
                  <div>
                    <Label>Date de sortie</Label>
                    <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="bg-background" />
                  </div>
                  <div>
                    <Label>Date de fin de disponibilité</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-background" />
                  </div>
                </div>
                <div>
                  <Label>Synopsis</Label>
                  <Textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} className="bg-background" required />
                </div>
                <div>
                  <Label>Acteurs / Distribution</Label>
                  <Input value={cast} onChange={(e) => setCast(e.target.value)} placeholder="Nom 1, Nom 2, …" className="bg-background" />
                </div>
                <div>
                  <Label htmlFor="poster-input">Affiche (jpg/png/webp)</Label>
                  <Input id="poster-input" type="file" accept="image/*" onChange={(e) => setPoster(e.target.files?.[0] ?? null)} className="bg-background" required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="video-input">Vidéo (fichier)</Label>
                    <Input id="video-input" type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} className="bg-background" />
                  </div>
                  <div>
                    <Label>OU URL vidéo</Label>
                    <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" className="bg-background" />
                  </div>
                </div>
                {progress && <p className="text-sm text-primary">{progress}</p>}
                <Button type="submit" disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
                  <Upload className="mr-2 h-4 w-4" /> {busy ? "Publication…" : "Publier"}
                </Button>
              </form>

              <div>
                <h2 className="font-display text-2xl text-cream mb-4">Films publiés ({movies.length})</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {movies.map((m) => (
                    <div key={m.id} className="border border-border rounded-sm bg-card overflow-hidden">
                      {m.poster_url ? (
                        <img src={m.poster_url} alt={m.title} className="w-full aspect-[2/3] object-cover" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                          <FilmIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <h3 className="font-display text-cream truncate">{m.title}</h3>
                        <p className="text-xs text-primary">{m.price_ariary?.toLocaleString("fr-FR")} Ar</p>
                        {m.release_date && <p className="text-[10px] text-muted-foreground">Sortie : {new Date(m.release_date).toLocaleDateString("fr-FR")}</p>}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(m)} className="text-cream hover:text-primary flex-1">
                            <Pencil className="h-3 w-3 mr-1" /> Modifier
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id, m.title)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {movies.length === 0 && <p className="text-muted-foreground col-span-full">Aucun film pour l'instant.</p>}
                </div>
              </div>

              {editing && (
                <div className="fixed inset-0 z-50 bg-noir/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
                  <div className="bg-card border border-border rounded-sm max-w-2xl w-full p-6 space-y-4 my-8" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl text-cream">Modifier le film</h3>
                      <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-cream"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Titre</Label>
                        <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="bg-background" />
                      </div>
                      <div>
                        <Label>Prix (Ariary)</Label>
                        <Input type="number" value={editing.price_ariary} onChange={(e) => setEditing({ ...editing, price_ariary: parseInt(e.target.value) || 0 })} className="bg-background" />
                      </div>
                      <div>
                        <Label>Date de sortie</Label>
                        <Input type="date" value={editing.release_date || ""} onChange={(e) => setEditing({ ...editing, release_date: e.target.value })} className="bg-background" />
                      </div>
                      <div>
                        <Label>Date de fin</Label>
                        <Input type="date" value={editing.end_date || ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} className="bg-background" />
                      </div>
                    </div>
                    <div>
                      <Label>Synopsis</Label>
                      <Textarea rows={4} value={editing.synopsis} onChange={(e) => setEditing({ ...editing, synopsis: e.target.value })} className="bg-background" />
                    </div>
                    <div>
                      <Label>Acteurs / Distribution</Label>
                      <Input value={editing.cast_list || ""} onChange={(e) => setEditing({ ...editing, cast_list: e.target.value })} className="bg-background" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Remplacer affiche (optionnel)</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setEditPosterFile(e.target.files?.[0] ?? null)} className="bg-background" />
                      </div>
                      <div>
                        <Label>Remplacer vidéo (optionnel)</Label>
                        <Input type="file" accept="video/*" onChange={(e) => setEditVideoFile(e.target.files?.[0] ?? null)} className="bg-background" />
                      </div>
                    </div>
                    <div>
                      <Label>OU URL vidéo</Label>
                      <Input value={editing.video_url || ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} className="bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-cream">
                      <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                      À l'affiche (page d'accueil)
                    </label>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
                      <Button onClick={saveEdit} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary-glow">
                        <Save className="h-4 w-4 mr-1" /> {busy ? "Enregistrement…" : "Enregistrer"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* PURCHASES */}
            <TabsContent value="purchases" className="space-y-3">
              {purchases.length === 0 && <p className="text-muted-foreground">Aucune demande pour l'instant.</p>}
              {purchases.map((p) => (
                <div key={p.id} className="border border-border rounded-sm bg-card p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display text-cream truncate">{p.movies?.title || "Film supprimé"}</h3>
                      <Badge className={
                        p.status === "paid" ? "bg-primary text-primary-foreground" :
                        p.status === "rejected" ? "bg-destructive text-destructive-foreground" :
                        "bg-noir border border-primary/40 text-primary"
                      }>{p.status === "pending" ? "EN ATTENTE" : p.status === "paid" ? "VALIDÉ" : "REFUSÉ"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground break-all">
                      {p.payer_name} · {p.payer_phone} · {p.payment_method} · Réf : <span className="text-primary">{p.payment_reference}</span> · {p.amount_cents?.toLocaleString("fr-FR")} Ar
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                  {p.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updatePurchase(p.id, "paid")} className="bg-primary text-primary-foreground hover:bg-primary-glow">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Valider
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updatePurchase(p.id, "rejected")} className="border-destructive/40 text-destructive">
                        <XCircle className="h-3 w-3 mr-1" /> Refuser
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            {/* USERS */}
            <TabsContent value="users" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-cream flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Utilisateurs ({users.length})
                </h2>
                <Button variant="outline" size="sm" onClick={loadUsers} className="border-primary/40 text-primary">Rafraîchir</Button>
              </div>
              {users.length === 0 && <p className="text-muted-foreground">Aucun utilisateur.</p>}
              {users.map((u) => {
                const blocked = u.profile?.is_blocked || !!u.banned_until;
                const isAdminUser = u.roles?.includes("admin");
                return (
                  <div key={u.id} className="border border-border rounded-sm bg-card p-4 flex items-center gap-4 flex-wrap">
                    <Avatar className="h-12 w-12">
                      {u.profile?.avatar_url && <AvatarImage src={u.profile.avatar_url} />}
                      <AvatarFallback className="bg-primary text-primary-foreground font-display">
                        {(u.profile?.display_name || u.email || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-cream truncate">{u.profile?.display_name || "—"}</h3>
                        {isAdminUser && <Badge className="bg-primary text-primary-foreground text-[10px]">ADMIN</Badge>}
                        {blocked && <Badge className="bg-destructive text-destructive-foreground text-[10px]">BLOQUÉ</Badge>}
                        {!u.confirmed && <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">NON CONFIRMÉ</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Inscrit : {new Date(u.created_at).toLocaleDateString("fr-FR")}
                        {u.last_sign_in_at && ` · Dernière connexion : ${new Date(u.last_sign_in_at).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                    {!isAdminUser && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleBlock(u)} className={blocked ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}>
                          {blocked ? <><Unlock className="h-3 w-3 mr-1" /> Débloquer</> : <><Lock className="h-3 w-3 mr-1" /> Bloquer</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteUser(u)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            {/* SETTINGS */}
            <TabsContent value="settings" className="space-y-6">
              <div className="border border-border rounded-sm bg-card p-6 space-y-4">
                <h2 className="font-display text-xl text-cream">Méthodes de paiement Mobile Money</h2>
                <p className="text-xs text-muted-foreground">Configurez chaque opérateur (MVola, Orange Money, Airtel Money). Laissez le numéro vide pour désactiver une option côté client.</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { key: "yas", label: "MVola" },
                    { key: "orange", label: "Orange Money" },
                    { key: "airtel", label: "Airtel Money" },
                  ].map((m) => (
                    <div key={m.key} className="border border-border rounded-sm bg-background p-4 space-y-3">
                      <h3 className="font-display text-cream">{m.label}</h3>
                      <div>
                        <Label className="text-xs">Bénéficiaire</Label>
                        <Input
                          value={draft[`pay_${m.key}_holder`] || ""}
                          onChange={(e) => setDraft({ ...draft, [`pay_${m.key}_holder`]: e.target.value })}
                          placeholder="BOODJI PROD"
                          className="bg-card"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Numéro</Label>
                        <Input
                          value={draft[`pay_${m.key}_number`] || ""}
                          onChange={(e) => setDraft({ ...draft, [`pay_${m.key}_number`]: e.target.value })}
                          placeholder="034 00 000 00"
                          className="bg-card"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Logo (URL ou upload)</Label>
                        {draft[`pay_${m.key}_logo`] && (
                          <img src={draft[`pay_${m.key}_logo`]} alt={m.label} className="h-10 w-auto object-contain my-2" />
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const path = `payment-logos/${m.key}-${Date.now()}-${f.name}`;
                              const { error } = await supabase.storage.from("posters").upload(path, f, { contentType: f.type, upsert: true });
                              if (error) throw error;
                              const url = supabase.storage.from("posters").getPublicUrl(path).data.publicUrl;
                              setDraft({ ...draft, [`pay_${m.key}_logo`]: url });
                              toast.success("Logo téléchargé. N'oubliez pas d'enregistrer.");
                            } catch (err: any) {
                              toast.error("Upload échoué : " + err.message);
                            }
                          }}
                          className="bg-card text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded-sm bg-card p-6 space-y-4">
                <h2 className="font-display text-xl text-cream">Page d'accueil</h2>
                <div>
                  <Label>Titre principal</Label>
                  <Input value={draft.home_title || ""} onChange={(e) => setDraft({ ...draft, home_title: e.target.value })} placeholder="Un FILM. Une histoire. Une expérience INOUBLIABLE." className="bg-background" />
                </div>
                <div>
                  <Label>Sous-titre</Label>
                  <Textarea rows={2} value={draft.home_subtitle || ""} onChange={(e) => setDraft({ ...draft, home_subtitle: e.target.value })} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Affiche d'arrière-plan (Hero)</Label>
                  {draft.home_hero_image && (
                    <img src={draft.home_hero_image} alt="Aperçu hero" className="h-32 rounded-sm border border-border object-cover" />
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="bg-background"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        try {
                          const path = `hero/${Date.now()}-${f.name}`;
                          const { error } = await supabase.storage.from("posters").upload(path, f, { contentType: f.type, upsert: true });
                          if (error) throw error;
                          const url = supabase.storage.from("posters").getPublicUrl(path).data.publicUrl;
                          setDraft({ ...draft, home_hero_image: url });
                          toast.success("Affiche téléchargée. N'oubliez pas d'enregistrer.");
                        } catch (err: any) { toast.error(err.message || "Erreur upload"); }
                      }}
                    />
                    {draft.home_hero_image && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...draft, home_hero_image: "" })}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input value={draft.home_hero_image || ""} onChange={(e) => setDraft({ ...draft, home_hero_image: e.target.value })} placeholder="ou collez une URL d'image" className="bg-background" />
                </div>
              </div>

              <div className="border border-border rounded-sm bg-card p-6 space-y-4">
                <h2 className="font-display text-xl text-cream">Page « Qui sommes Nous? »</h2>
                <Textarea rows={6} value={draft.about_text || ""} onChange={(e) => setDraft({ ...draft, about_text: e.target.value })} className="bg-background" />
              </div>

              <div className="border border-border rounded-sm bg-card p-6 space-y-4">
                <h2 className="font-display text-xl text-cream">Page « Contact »</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Téléphone</Label>
                    <Input value={draft.contact_phone || ""} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })} className="bg-background" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={draft.contact_email || ""} onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })} className="bg-background" />
                  </div>
                  <div>
                    <Label>Adresse</Label>
                    <Input value={draft.contact_address || ""} onChange={(e) => setDraft({ ...draft, contact_address: e.target.value })} placeholder="Antananarivo, Madagascar" className="bg-background" />
                  </div>
                  <div>
                    <Label>Lien Facebook</Label>
                    <Input value={draft.contact_facebook || ""} onChange={(e) => setDraft({ ...draft, contact_facebook: e.target.value })} placeholder="https://facebook.com/votrepage" className="bg-background" />
                  </div>
                </div>
                <div>
                  <Label>Texte d'introduction</Label>
                  <Textarea rows={3} value={draft.contact_text || ""} onChange={(e) => setDraft({ ...draft, contact_text: e.target.value })} className="bg-background" />
                </div>
              </div>

              <Button onClick={saveSettings} className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
                <Save className="h-4 w-4 mr-1" /> Enregistrer les paramètres
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
