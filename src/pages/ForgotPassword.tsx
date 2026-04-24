import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MailCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { document.title = "Mot de passe oublié — GasyFlix"; }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Email envoyé !");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
            <ArrowLeft className="h-3 w-3" /> Retour à la connexion
          </Link>
          <div className="border border-border rounded-sm bg-card p-6">
            <h1 className="font-display text-3xl text-cream mb-2">Mot de passe oublié</h1>
            <p className="text-sm text-muted-foreground mb-5">Entrez votre email pour recevoir un lien de réinitialisation.</p>

            {sent ? (
              <Alert className="border-primary/40 bg-primary/10">
                <MailCheck className="h-4 w-4 text-primary" />
                <AlertDescription className="text-cream">
                  Si un compte existe pour <span className="text-primary">{email}</span>, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte mail (et vos spams).
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label htmlFor="fp-email">Email</Label>
                  <Input id="fp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background" />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
                  {busy ? "Envoi…" : "Envoyer le lien"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
