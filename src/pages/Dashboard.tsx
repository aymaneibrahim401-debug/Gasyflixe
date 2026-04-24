import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Play, Library, Mail, LogOut } from "lucide-react";

const FILM_SLUG = "shadows-of-midnight";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard — GasyFlix";
  }, []);

  const displayName =
    (user?.user_metadata?.display_name as string) ||
    user?.email?.split("@")[0] ||
    "Utilisateur";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-sm text-primary uppercase tracking-widest mb-2">Bienvenue</p>
            <h1 className="font-display text-4xl md:text-5xl text-cream">
              Bonjour, {displayName}
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Mail className="h-4 w-4" /> {user?.email}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-sm bg-card p-6">
              <Play className="h-8 w-8 text-primary mb-3" />
              <h2 className="font-display text-xl text-cream mb-2">Regarder le film</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Accédez à notre production exclusive en streaming HD.
              </p>
              <Button
                onClick={() => navigate(`/film/${FILM_SLUG}`)}
                className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest"
              >
                Voir le film
              </Button>
            </div>

            <div className="border border-border rounded-sm bg-card p-6">
              <Library className="h-8 w-8 text-primary mb-3" />
              <h2 className="font-display text-xl text-cream mb-2">Ma bibliothèque</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Retrouvez vos achats et l'historique de visionnage.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/library")}
                className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Ouvrir
              </Button>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <Button variant="ghost" onClick={() => signOut()} className="text-muted-foreground">
              <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
