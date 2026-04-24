import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolvePoster, hasPoster, formatAriary } from "@/lib/posters";

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  poster_url: string;
  price_ariary: number;
  badge: string | null;
}

const Catalogue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    document.title = "Catalogue — GasyFlix";
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); return m;
    })();
    meta.setAttribute('content', "Découvrez tous les films disponibles sur GasyFlix. Streaming HD.");

    supabase
      .from("movies")
      .select("id,title,slug,synopsis,poster_url,price_ariary,badge")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMovies(((data as Movie[]) || []).filter((m) => hasPoster(m.poster_url, m.slug)));
      });
  }, []);

  const goFilm = (slug: string) =>
    user ? navigate(`/film/${slug}`) : navigate("/auth", { state: { from: `/film/${slug}` } });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 max-w-6xl">
        <header className="mb-12 text-center">
          <p className="text-xs uppercase tracking-widest text-primary mb-2">Notre sélection</p>
          <h1 className="font-display text-5xl md:text-6xl text-cream mb-4">Catalogue</h1>
          <p className="text-muted-foreground italic">Tous les films disponibles en streaming HD.</p>
        </header>

        {movies.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucun film disponible pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((m) => (
              <button key={m.id} onClick={() => goFilm(m.slug)} className="group text-left">
                <div className="relative overflow-hidden rounded-sm border border-border bg-card aspect-[2/3]">
                  <img
                    src={resolvePoster(m.poster_url, m.slug)}
                    alt={`Affiche ${m.title}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {m.badge && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground uppercase tracking-widest text-[10px]">
                      {m.badge}
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <Play className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="mt-2 font-display text-cream group-hover:text-primary transition-colors line-clamp-1">
                  {m.title}
                </h3>
                <p className="text-xs text-primary mt-1">{formatAriary(m.price_ariary)}</p>
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Catalogue;
