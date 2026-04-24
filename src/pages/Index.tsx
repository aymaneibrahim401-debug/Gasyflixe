import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Sparkles, Play, Compass } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { resolvePoster, hasPoster } from "@/lib/posters";
import heroCurtains from "@/assets/hero-curtains.jpg";

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  poster_url: string;
  price_ariary: number;
  badge: string | null;
  featured: boolean;
}

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Movie | null>(null);

  useEffect(() => {
    document.title = "GasyFlix — Un film. Une histoire. Une expérience inoubliable.";
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); return m;
    })();
    meta.setAttribute('content', "Plongez dans un nouvel univers et découvrez les films de BOODJI PROD. Disponibles en streaming HD.");

    supabase
      .from("movies")
      .select("id,title,slug,synopsis,poster_url,price_ariary,badge,featured")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = ((data as Movie[]) || []).filter((m) => hasPoster(m.poster_url, m.slug));
        const top = list.find((m) => m.featured) || list[0] || null;
        setFeatured(top);
      });
  }, []);

  const goBuy = (slug: string) => {
    if (isAdmin) return navigate(`/film/${slug}`);
    return user ? navigate(`/payment/${slug}`) : navigate("/auth", { state: { from: `/payment/${slug}` } });
  };

  const renderTitle = () => {
    const raw = settings.home_title || "Un film. Une histoire.\nUne expérience inoubliable.";
    const lines = raw.split(/\n|<br\s*\/?>/i);
    const highlight = (text: string, key: string, intense: boolean) => (
      <span
        key={key}
        className={
          intense
            ? "relative inline-block bg-gradient-to-r from-[hsl(45_85%_65%)] via-[hsl(50_95%_78%)] to-[hsl(42_65%_55%)] bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer drop-shadow-[0_0_18px_hsl(42_80%_65%/0.5)]"
            : "text-primary animate-gold-glow"
        }
      >
        {text}
      </span>
    );
    return lines.map((line, li) => {
      const parts = line.split(/(\binoubliable\b|\bfilm\b)/gi);
      return (
        <span key={li} className="block">
          {parts.map((p, i) => {
            if (/^film$/i.test(p)) return highlight(p, `${li}-${i}`, false);
            if (/^inoubliable$/i.test(p)) return highlight(p, `${li}-${i}`, true);
            return <span key={`${li}-${i}`}>{p}</span>;
          })}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* HERO cinéma — affiche rideau fixe */}
      <section className="relative overflow-hidden border-b border-border/40 bg-noir">
        {/* Rideau de théâtre en fond */}
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${settings.home_hero_image || heroCurtains})` }}
          aria-hidden="true"
        />
        {/* Voile léger pour lisibilité */}
        <div className="absolute inset-0 bg-noir/40" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-noir/20 via-transparent to-noir/70" aria-hidden="true" />

        <div className="relative z-10 container py-20 md:py-28 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-primary/40 bg-noir/60 text-primary text-xs uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> BOODJI PROD · GasyFlix
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-cream mb-6 animate-flicker leading-[1.05]">
            {renderTitle()}
          </h1>
          <p className="text-foreground/85 text-lg italic max-w-2xl mx-auto mb-8">
            {settings.home_subtitle || "Plongez dans un nouvel univers et découvrez les films de BOODJI PROD, disponibles en streaming HD."}
          </p>
          {featured && (
            <Button
              onClick={() => goBuy(featured.slug)}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary-glow shadow-gold font-display tracking-widest text-base px-10 rounded-md"
            >
              <Compass className="mr-2 h-5 w-5" /> Explorer maintenant
            </Button>
          )}
        </div>
      </section>

      {/* Film en avant : SORONA */}
      {featured && (
        <section id="a-l-affiche" className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={resolvePoster(featured.poster_url, featured.slug)} alt="" className="h-full w-full object-cover opacity-30 scale-110 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-noir/70 to-background" />
          </div>
          <div className="relative container py-16 md:py-24 animate-fade-in">
            <div className="grid md:grid-cols-[320px,1fr] gap-8 items-center max-w-5xl mx-auto">
              <button onClick={() => goBuy(featured.slug)} className="block mx-auto md:mx-0">
                <img
                  src={resolvePoster(featured.poster_url, featured.slug)}
                  alt={`Affiche ${featured.title}`}
                  className="w-full max-w-[320px] aspect-[2/3] object-cover rounded-sm border border-primary/30 shadow-gold hover:scale-[1.02] transition"
                />
              </button>
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-primary/40 bg-noir/60 text-primary text-xs uppercase tracking-widest">
                  <Sparkles className="h-3 w-3" /> À l'affiche
                </div>
                <h2 className="font-display text-4xl md:text-6xl text-cream mb-4 leading-[1.05]">
                  {featured.title}
                </h2>
                {featured.badge && (
                  <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest text-[10px] mb-4">
                    {featured.badge}
                  </Badge>
                )}
                <p className="text-foreground/85 text-lg leading-relaxed mb-8 max-w-xl mx-auto md:mx-0 italic">
                  {featured.synopsis}
                </p>
                <Button
                  onClick={() => goBuy(featured.slug)}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary-glow shadow-gold font-display tracking-widest text-base px-10"
                >
                  {isAdmin ? (<><Play className="mr-2 h-5 w-5" /> Regarder</>) : (<><ShoppingBag className="mr-2 h-5 w-5" /> Acheter</>)}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
