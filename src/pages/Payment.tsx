import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { resolvePoster, formatAriary } from "@/lib/posters";
import { toast } from "sonner";
import logoMvola from "@/assets/logo-mvola.png";
import logoOrange from "@/assets/logo-orange-money.png";
import logoAirtel from "@/assets/logo-airtel-money.png";

type Method = "MVola" | "Orange Money" | "Airtel Money";

const Payment = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [movie, setMovie] = useState<any>(null);
  const [method, setMethod] = useState<Method | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from("movies").select("*").eq("slug", slug).maybeSingle()
      .then(({ data }) => { setMovie(data); if (data) document.title = `Paiement — ${data.title}`; });
  }, [slug]);

  // MVola reuses pay_yas_* keys for backwards compatibility with stored settings.
  const methods: { id: Method; logo: string; number: string; holder: string }[] = [
    { id: "MVola", logo: settings.pay_yas_logo || logoMvola, number: settings.pay_yas_number || settings.pay_telma_number || "", holder: settings.pay_yas_holder || settings.payment_holder || "" },
    { id: "Orange Money", logo: settings.pay_orange_logo || logoOrange, number: settings.pay_orange_number || "", holder: settings.pay_orange_holder || settings.payment_holder || "" },
    { id: "Airtel Money", logo: settings.pay_airtel_logo || logoAirtel, number: settings.pay_airtel_number || "", holder: settings.pay_airtel_holder || settings.payment_holder || "" },
  ];

  const selected = methods.find((m) => m.id === method);

  const copy = (n: string) => { navigator.clipboard.writeText(n); toast.success("Numéro copié"); };

  const handlePaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !movie) { toast.error("Vous devez être connecté."); return; }
    if (!method) { toast.error("Choisissez une méthode de paiement."); return; }
    if (!name.trim() || !phone.trim() || !reference.trim()) { toast.error("Remplissez tous les champs."); return; }
    setBusy(true);
    try {
      // Vérifier s'il existe déjà un achat pour cet utilisateur+film
      const { data: existing, error: selErr } = await supabase
        .from("purchases")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("movie_id", movie.id)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing) {
        if (existing.status === "approved") {
          toast.info("Vous avez déjà accès à ce film.");
          setDone(true);
          return;
        }
        if (existing.status === "pending") {
          toast.info("Une demande est déjà en attente de validation.");
          setDone(true);
          return;
        }
        // refused → on remet en attente avec les nouvelles infos
        const { error: updErr } = await supabase
          .from("purchases")
          .update({
            amount_cents: movie.price_ariary,
            status: "pending",
            payer_name: name.trim(),
            payer_phone: phone.trim(),
            payment_reference: reference.trim(),
            payment_method: method,
            read_by_admin: false,
          })
          .eq("id", existing.id);
        if (updErr) throw updErr;
      } else {
        const { error } = await supabase.from("purchases").insert({
          user_id: user.id,
          movie_id: movie.id,
          amount_cents: movie.price_ariary,
          status: "pending",
          payer_name: name.trim(),
          payer_phone: phone.trim(),
          payment_reference: reference.trim(),
          payment_method: method,
        });
        if (error) throw error;
      }
      setDone(true);
      toast.success("Demande enregistrée !");
    } catch (err: any) {
      toast.error("Erreur : " + (err?.message || "inconnue"));
    } finally {
      setBusy(false);
    }
  };

  if (!movie) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement…</div>;

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 max-w-xl mx-auto text-center">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-4xl text-cream mb-3">Merci pour votre achat</h1>
          <p className="text-foreground/80 mb-6">
            Votre paiement pour <span className="text-primary">{movie.title}</span> est en cours de vérification.
            Vous recevrez l'accès au film dès validation par notre équipe.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/library")} className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
              Ma bibliothèque
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="border-primary/40 text-primary">
              Accueil
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-10 max-w-3xl mx-auto">
        <Link to={`/film/${movie.slug}`} className="text-sm text-muted-foreground hover:text-primary">← Retour au film</Link>

        <div className="grid md:grid-cols-[180px,1fr] gap-5 my-6 items-center border border-border rounded-sm bg-card p-5">
          <img src={resolvePoster(movie.poster_url, movie.slug)} alt="" className="w-full aspect-[2/3] object-cover rounded-sm border border-border" />
          <div>
            <h1 className="font-display text-3xl text-cream mb-1">{movie.title}</h1>
            <p className="text-muted-foreground mb-3">{movie.genre} · {movie.year}</p>
            <p className="font-display text-3xl text-primary">{formatAriary(movie.price_ariary)}</p>
          </div>
        </div>

        <div className="border border-border rounded-sm bg-card p-5 mb-6">
          <h2 className="font-display text-xl text-cream mb-4">Choisissez votre méthode de paiement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => m.number && setMethod(m.id)}
                disabled={!m.number}
                className={`p-4 border rounded-sm bg-background flex flex-col items-center text-center gap-3 transition ${
                  method === m.id ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/40"
                } ${!m.number ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div className="space-y-1 w-full">
                  <p className="font-display text-sm text-cream">{m.id}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Bénéficiaire</p>
                  <p className="text-xs text-cream truncate">{m.holder || "—"}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Numéro</p>
                  <p className="font-display text-sm text-primary tracking-wider">{m.number || "Non configuré"}</p>
                </div>
                <div className="mt-2 pt-3 border-t border-border w-full flex justify-center bg-cream/5 rounded-sm">
                  <img src={m.logo} alt={m.id} className="h-16 w-16 object-contain p-1" loading="lazy" width={64} height={64} />
                </div>
              </button>
            ))}
          </div>

          {selected && selected.number && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Envoyez <span className="text-primary font-display">{formatAriary(movie.price_ariary)}</span> au numéro <span className="text-cream">{selected.id}</span> ci-dessus, puis remplissez le formulaire avec la référence reçue.
              </p>
              <div className="flex items-center justify-between gap-2 px-4 py-3 border border-primary/30 rounded-sm bg-background">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Méthode sélectionnée</p>
                  <p className="text-sm text-cream">{selected.holder} · {selected.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display tracking-wider text-primary text-lg">{selected.number}</span>
                  <button onClick={() => copy(selected.number)} className="text-muted-foreground hover:text-primary" aria-label="Copier" type="button">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handlePaid} className="border border-border rounded-sm bg-card p-5 space-y-4">
          <h2 className="font-display text-xl text-cream">Confirmer le paiement</h2>

          <div>
            <Label htmlFor="pay-name">Nom complet</Label>
            <Input id="pay-name" required value={name} onChange={(e) => setName(e.target.value)} className="bg-background" />
          </div>
          <div>
            <Label htmlFor="pay-phone">Numéro utilisé pour payer</Label>
            <Input id="pay-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="034 00 000 00" className="bg-background" />
          </div>
          <div>
            <Label htmlFor="pay-ref">Référence de la transaction</Label>
            <Input id="pay-ref" required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex: MP250101.1234.A12345" className="bg-background" />
          </div>

          <Alert className="border-primary/30 bg-primary/5">
            <AlertDescription className="text-xs text-foreground/80">
              Après validation par l'admin, le film sera débloqué automatiquement dans votre bibliothèque.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={busy || !method} size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest shadow-gold">
            {busy ? "Envoi…" : "J'ai payé"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
