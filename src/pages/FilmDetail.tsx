import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Film as FilmIcon, ShoppingBag, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { resolvePoster, formatAriary } from "@/lib/posters";

const FilmDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: m } = await supabase.from("movies").select("*").eq("slug", slug).maybeSingle();
      setMovie(m);
      setLoading(false);
      if (m) document.title = `${m.title} — GasyFlix`;
      if (m && user) {
        const { data: p } = await supabase.from("purchases")
          .select("*").eq("movie_id", m.id).eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        setPurchase(p);
      }
    })();
  }, [slug, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement…</div>;
  if (!movie) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-20 text-center flex-1">
        <h1 className="font-display text-4xl text-cream mb-4">Film introuvable</h1>
        <Link to="/" className="text-primary hover:underline">← Retour à l'accueil</Link>
      </main>
      <Footer />
    </div>
  );

  const hasAccess = isAdmin || purchase?.status === "paid";
  const isPending = !isAdmin && purchase?.status === "pending";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-sm overflow-hidden border border-border bg-noir mb-6">
            {hasAccess && movie.video_url ? (
              <video
                src={movie.video_url}
                poster={resolvePoster(movie.poster_url, movie.slug)}
                controls
                controlsList="nodownload"
                className="w-full aspect-video bg-noir"
              />
            ) : (
              <div className="relative w-full aspect-video">
                <img src={resolvePoster(movie.poster_url, movie.slug)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-noir/70 flex flex-col items-center justify-center text-center p-6">
                  {hasAccess ? (
                    <>
                      <FilmIcon className="h-12 w-12 text-primary mb-2" />
                      <p className="text-cream">La vidéo sera bientôt disponible.</p>
                    </>
                  ) : isPending ? (
                    <>
                      <CheckCircle2 className="h-12 w-12 text-primary mb-3" />
                      <p className="font-display text-2xl text-cream mb-2">Paiement en cours de vérification</p>
                      <p className="text-foreground/80 max-w-md">Merci ! Notre équipe vérifie votre paiement. Vous recevrez l'accès dès validation.</p>
                    </>
                  ) : (
                    <>
                      <Lock className="h-12 w-12 text-primary mb-3" />
                      <p className="font-display text-2xl text-cream mb-2">Contenu réservé</p>
                      <p className="text-foreground/80 mb-4">Achetez ce film pour le regarder en streaming HD.</p>
                      <Button onClick={() => navigate(`/payment/${movie.slug}`)} className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest shadow-gold">
                        <ShoppingBag className="mr-2 h-4 w-4" /> Acheter — {formatAriary(movie.price_ariary)}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <img src={resolvePoster(movie.poster_url, movie.slug)} alt={`Affiche ${movie.title}`}
              className="w-40 aspect-[2/3] object-cover rounded-sm border border-border self-start" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-noir/80 text-primary border border-primary/40">{movie.genre || "Film"}</Badge>
                {movie.badge && <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest text-[10px]">{movie.badge}</Badge>}
              </div>
              <h1 className="font-display text-3xl md:text-5xl text-cream mb-2">{movie.title}</h1>
              <p className="text-muted-foreground italic mb-4">Un film de {movie.director || "BOODJI PROD"}</p>
              <div className="flex flex-wrap gap-4 text-sm text-foreground/80 mb-4">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> {movie.year}</span>
                <span className="font-display text-primary text-lg">{formatAriary(movie.price_ariary)}</span>
              </div>
              <p className="text-foreground/90 leading-relaxed max-w-2xl mb-4 whitespace-pre-line">{movie.synopsis}</p>
              {movie.cast_list && (
                <p className="text-sm text-foreground/80 mb-6">
                  <span className="text-primary uppercase tracking-widest text-xs mr-2">Distribution</span>
                  {movie.cast_list}
                </p>
              )}
              {movie.release_date && (
                <p className="text-xs text-muted-foreground mb-4">
                  Sortie : {new Date(movie.release_date).toLocaleDateString("fr-FR")}
                  {movie.end_date && ` · Disponible jusqu'au ${new Date(movie.end_date).toLocaleDateString("fr-FR")}`}
                </p>
              )}
              {!hasAccess && !isPending && (
                <Button onClick={() => navigate(`/payment/${movie.slug}`)} size="lg" className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest shadow-gold">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Acheter maintenant
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FilmDetail;
