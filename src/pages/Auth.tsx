import { useState, useEffect } from "react";
import { Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { Film, MailCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAIL = "aymaneibrahim401@gmail.com";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  // Sign up
  const [suEmail, setSuEmail] = useState("");
  const [suName, setSuName] = useState("");
  const [signupSent, setSignupSent] = useState(false);

  // Sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  const from = (location.state as { from?: string } | null)?.from || "/";

  useEffect(() => { document.title = "Connexion — GasyFlix"; }, []);

  if (!loading && user) {
    const dest = user.email === ADMIN_EMAIL ? "/admin" : from;
    return <Navigate to={dest} replace />;
  }

  const friendly = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("invalid login")) return "Email ou mot de passe incorrect.";
    if (m.includes("email not confirmed")) return "Vérifiez votre email pour activer votre compte.";
    if (m.includes("user already registered") || m.includes("already exists")) return "Un compte existe déjà avec cet email.";
    if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives. Réessayez dans quelques minutes.";
    if (m.includes("user is banned") || m.includes("banned")) return "Ce compte est bloqué. Contactez l'administrateur.";
    if (m.includes("invalid email")) return "Adresse email invalide.";
    return msg;
  };

  // Inscription : on crée le compte avec un mot de passe temporaire aléatoire,
  // puis on envoie un email de "réinitialisation" pour que l'utilisateur définisse SON mot de passe.
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suEmail.trim() || !suName.trim()) { toast.error("Nom et email requis."); return; }
    setBusy(true);

    const tempPassword = `Tmp_${crypto.randomUUID()}!A1`;
    const { error: signErr } = await supabase.auth.signUp({
      email: suEmail.trim(),
      password: tempPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/reset-password?welcome=1`,
        data: { display_name: suName.trim() },
      },
    });

    if (signErr) {
      setBusy(false);
      toast.error(friendly(signErr.message));
      return;
    }

    // On envoie ensuite un lien de "récupération" qui mène vers /reset-password
    // pour que l'utilisateur crée son vrai mot de passe.
    await supabase.auth.resetPasswordForEmail(suEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password?welcome=1`,
    });

    setBusy(false);
    setSignupSent(true);
    toast.success("Email de confirmation envoyé !");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siEmail.trim() || !siPassword) { toast.error("Email et mot de passe requis."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: siEmail.trim(), password: siPassword,
    });
    setBusy(false);
    if (error) { toast.error(friendly(error.message)); return; }
    toast.success("Bienvenue !");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Film className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="font-display text-3xl text-cream">Bienvenue sur GasyFlix</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {signupSent ? "Vérifiez votre boîte mail pour activer votre compte" : "Connectez-vous ou créez votre compte"}
            </p>
          </div>

          {signupSent ? (
            <div className="border border-border rounded-sm bg-card p-6 space-y-5">
              <Alert className="border-primary/40 bg-primary/10">
                <MailCheck className="h-4 w-4 text-primary" />
                <AlertDescription className="text-cream">
                  Un email de confirmation a été envoyé à <span className="text-primary">{suEmail}</span>.
                  Cliquez sur le lien dans l'email pour créer votre mot de passe.
                </AlertDescription>
              </Alert>
              <p className="text-xs text-muted-foreground text-center">
                Pensez à vérifier vos spams. Le lien expire après quelques minutes.
              </p>
              <button onClick={() => { setSignupSent(false); setTab("signin"); }} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Retour à la connexion
              </button>
            </div>
          ) : (
            <div className="border border-border rounded-sm bg-card p-6 space-y-5">
              <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Connexion</TabsTrigger>
                  <TabsTrigger value="signup">Inscription</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="si-email">Email</Label>
                      <Input id="si-email" type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} className="bg-background" placeholder="vous@exemple.com" />
                    </div>
                    <div>
                      <Label htmlFor="si-pwd">Mot de passe</Label>
                      <PasswordInput id="si-pwd" required value={siPassword} onChange={(e) => setSiPassword(e.target.value)} />
                    </div>
                    <div className="text-right">
                      <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">Mot de passe oublié ?</Link>
                    </div>
                    <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
                      {busy ? "Connexion…" : "Se connecter"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="su-name">Nom</Label>
                      <Input id="su-name" required value={suName} onChange={(e) => setSuName(e.target.value)} className="bg-background" />
                    </div>
                    <div>
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} className="bg-background" placeholder="vous@exemple.com" />
                    </div>
                    <Alert className="border-primary/30 bg-primary/5">
                      <AlertDescription className="text-xs text-foreground/80">
                        Vous recevrez un email pour confirmer votre adresse et créer votre mot de passe.
                      </AlertDescription>
                    </Alert>
                    <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
                      {busy ? "Envoi…" : "Créer mon compte"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
