import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { toast } from "sonner";

const ADMIN_EMAIL = "aymaneibrahim401@gmail.com";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isWelcome = params.get("welcome") === "1";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = isWelcome ? "Créer mon mot de passe — GasyFlix" : "Nouveau mot de passe — GasyFlix";
  }, [isWelcome]);

  const valid = /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) && password.length >= 8;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { toast.error("Le mot de passe ne respecte pas les règles."); return; }
    if (password !== confirm) { toast.error("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isWelcome ? "Compte activé !" : "Mot de passe mis à jour");
    const dest = data.user?.email === ADMIN_EMAIL ? "/admin" : "/";
    navigate(dest, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 flex items-center justify-center">
        <div className="w-full max-w-md border border-border rounded-sm bg-card p-6">
          <h1 className="font-display text-3xl text-cream mb-2">
            {isWelcome ? "Créer mon mot de passe" : "Nouveau mot de passe"}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            {isWelcome
              ? "Bienvenue ! Définissez le mot de passe qui sécurisera votre compte."
              : "Définissez votre nouveau mot de passe."}
          </p>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="np">Mot de passe</Label>
              <PasswordInput id="np" value={password} onChange={(e) => setPassword(e.target.value)} showHint required />
            </div>
            <div>
              <Label htmlFor="np2">Confirmer le mot de passe</Label>
              <PasswordInput id="np2" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" disabled={busy || !valid} className="w-full bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
              {busy ? "Enregistrement…" : (isWelcome ? "Activer mon compte" : "Mettre à jour")}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
