import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Film as FilmIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolvePoster, hasPoster } from "@/lib/posters";

const Library = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Ma bibliothèque — GasyFlix";
    if (!user) return;
    supabase.from("purchases")
      .select("status, created_at, movies(id,title,slug,poster_url,genre,year)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, [user]);

  const valid = items.filter((i: any) => i.movies && hasPoster(i.movies.poster_url, i.movies.slug));
  const paid = valid.filter((i: any) => i.status === "paid");
  const pending = valid.filter((i: any) => i.status === "pending");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-10">
        <h1 className="font-display text-4xl text-cream mb-2">Ma bibliothèque</h1>
        <p className="text-muted-foreground mb-8">Vos films achetés sur GasyFlix.</p>

        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-border rounded-sm p-12 text-center text-muted-foreground">
            <FilmIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="mb-3">Vous n'avez encore acheté aucun film.</p>
            <Link to="/" className="text-primary hover:underline">Découvrir le catalogue →</Link>
          </div>
        ) : (
          <div className="space-y-10">
            {paid.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-cream mb-4">Films disponibles</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {paid.map((p: any, i: number) => (
                    <Link to={`/film/${p.movies.slug}`} key={i} className="group">
                      <div className="relative overflow-hidden rounded-sm border border-border bg-card aspect-[2/3]">
                        <img src={resolvePoster(p.movies.poster_url, p.movies.slug)} alt={p.movies.title} className="w-full h-full object-cover transition group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-noir to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                          <Play className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="mt-2 font-display text-cream group-hover:text-primary transition line-clamp-1">{p.movies.title}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {pending.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-cream mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> En attente de validation
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pending.map((p: any, i: number) => (
                    <div key={i} className="opacity-70">
                      <div className="relative overflow-hidden rounded-sm border border-border bg-card aspect-[2/3]">
                        <img src={resolvePoster(p.movies.poster_url, p.movies.slug)} alt={p.movies.title} className="w-full h-full object-cover grayscale" />
                        <Badge className="absolute top-2 left-2 bg-noir/80 text-primary border border-primary/40 text-[10px] uppercase tracking-widest">En attente</Badge>
                      </div>
                      <h3 className="mt-2 font-display text-cream line-clamp-1">{p.movies.title}</h3>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Library;
