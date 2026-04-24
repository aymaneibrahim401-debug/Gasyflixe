import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Film, Target, Heart } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const About = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    document.title = "Qui sommes Nous? — BOODJI PROD";
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); return m;
    })();
    meta.setAttribute('content', "BOODJI PROD — compagnie de production de films. Notre mission, notre vision et nos valeurs.");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 max-w-3xl">
        <header className="mb-12 text-center">
          <p className="text-xs uppercase tracking-widest text-primary mb-2">Qui sommes Nous?</p>
          <h1 className="font-display text-5xl md:text-6xl text-cream mb-4">BOODJI PROD</h1>
          <p className="text-muted-foreground italic">Compagnie de production de films · Fondée en 2026</p>
        </header>

        <div className="space-y-8">
          <section className="bg-card border border-border rounded-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <Film className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl text-cream">Notre histoire</h2>
            </div>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
              {settings.about_text}
            </p>
          </section>

          <section className="bg-card border border-border rounded-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl text-cream">Notre objectif</h2>
            </div>
            <p className="text-foreground/90 leading-relaxed">
              Produire des œuvres originales, audacieuses et accessibles, qui mettent en valeur
              les talents locaux et offrent aux spectateurs une alternative authentique aux
              productions standardisées.
            </p>
          </section>

          <section className="bg-card border border-border rounded-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl text-cream">Notre souhait</h2>
            </div>
            <p className="text-foreground/90 leading-relaxed">
              Construire, film après film, une véritable maison de création reconnue pour la
              qualité de ses récits et la fidélité de sa communauté.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
