import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("admin@gasyflix.com");
  const [password, setPassword] = useState("");

  useEffect(() => { document.title = "Admin — GasyFlix"; }, []);

  if (!authLoading && !roleLoading && user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); toast.error("Identifiants invalides"); return; }
    // Verify role
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id)
      .eq("role", "admin")
      .maybeSingle();
    setBusy(false);
    if (!role) {
      await supabase.auth.signOut();
      toast.error("Accès refusé : ce compte n'est pas administrateur.");
      return;
    }
    toast.success("Bienvenue, administrateur");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="font-display text-3xl text-cream">Espace Administrateur</h1>
            <p className="text-sm text-muted-foreground mt-2">Réservé à l'équipe BOODJI PROD</p>
          </div>

          <form onSubmit={handleLogin} className="border border-border rounded-sm bg-card p-6 space-y-4">
            <div>
              <Label htmlFor="ad-email">Email</Label>
              <Input id="ad-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background" />
            </div>
            <div>
              <Label htmlFor="ad-pw">Mot de passe</Label>
              <Input id="ad-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background" />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
              {busy ? "..." : "Se connecter"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminLogin;
