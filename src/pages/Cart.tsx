import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { getPoster } from "@/lib/posters";
import { Trash2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

const Cart = () => {
  const { items, remove, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { document.title = "Panier — CinéPalace"; }, []);

  const handleCheckout = async () => {
    if (!user) {
      toast.info("Connectez-vous pour finaliser votre achat");
      navigate("/auth");
      return;
    }
    // Simulation v1 — en attendant Stripe : marque comme acheté
    const rows = items.map(i => ({
      user_id: user.id,
      movie_id: i.id,
      amount_cents: i.price_cents,
      status: "completed",
    }));
    const { error } = await supabase.from("purchases").upsert(rows, { onConflict: "user_id,movie_id" });
    if (error) {
      toast.error("Erreur lors du paiement : " + error.message);
      return;
    }
    toast.success("Achat confirmé ! (Mode démo — Stripe à activer)");
    clear();
    navigate("/library");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-12 flex-1">
        <h1 className="font-display text-4xl md:text-5xl text-cream mb-8 border-b border-border pb-4">Votre panier</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">Votre panier est vide.</p>
            <Button asChild className="bg-primary text-primary-foreground"><Link to="/catalogue">Parcourir le catalogue</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            <ul className="space-y-4">
              {items.map(item => (
                <li key={item.id} className="flex gap-4 p-4 border border-border rounded-sm bg-card">
                  <Link to={`/film/${item.slug}`} className="shrink-0">
                    <img src={getPoster(item.poster_url)} alt={item.title} width={80} height={120} className="w-20 aspect-[2/3] object-cover rounded-sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/film/${item.slug}`} className="font-display text-xl text-cream hover:text-primary transition-colors">{item.title}</Link>
                    <p className="text-primary font-display text-lg mt-1">{(item.price_cents / 100).toFixed(2)} €</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)} aria-label="Retirer">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>

            <aside className="border border-border rounded-sm bg-card p-6 h-fit sticky top-24">
              <h2 className="font-display text-2xl text-cream mb-4">Récapitulatif</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{items.length} film{items.length > 1 ? "s" : ""}</span>
                <span>{(total / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-display text-2xl text-primary border-t border-border pt-4 mt-4">
                <span>Total</span>
                <span>{(total / 100).toFixed(2)} €</span>
              </div>
              <Button size="lg" onClick={handleCheckout} className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
                Procéder au paiement
              </Button>
              <p className="text-[10px] text-muted-foreground italic mt-3 text-center">Paiement Stripe à activer — mode démo actif</p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
