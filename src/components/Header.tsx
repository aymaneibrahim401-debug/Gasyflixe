import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Film, ShoppingBag, LogOut, Library, ShieldCheck, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const { isAdmin } = useIsAdmin();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const initial = (profile?.display_name || user?.email || "?").charAt(0).toUpperCase();

  const navLinks = [
    { to: "/", label: "Accueil" },
    { to: "/catalogue", label: "Catalogue" },
    { to: "/about", label: "Qui sommes Nous?" },
    { to: "/contact", label: "Contact" },
  ];
  if (user) navLinks.push({ to: "/library", label: "Ma bibliothèque" });

  const isActive = (to: string) => location.pathname === to;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <Film className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
          <span className="font-display text-2xl tracking-widest text-cream">GASY<span className="text-primary">FLIX</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className={`transition-colors ${isActive(l.to) ? "text-primary" : "text-foreground/80 hover:text-primary"}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} className="relative" aria-label="Panier">
            <ShoppingBag className="h-5 w-5" />
            {items.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-primary text-primary-foreground">
                {items.length}
              </Badge>
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Compte" className="rounded-full ring-1 ring-primary/40 hover:ring-primary transition">
                  <Avatar className="h-9 w-9">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="avatar" />}
                    <AvatarFallback className="bg-primary text-primary-foreground font-display text-sm">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/library")}>
                  <Library className="mr-2 h-4 w-4" /> Ma bibliothèque
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Espace admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground">
              Connexion
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-md">
          <div className="container py-3 flex flex-col">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`py-3 px-2 border-b border-border/30 text-sm transition-colors ${isActive(l.to) ? "text-primary" : "text-foreground/80 hover:text-primary"}`}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link to="/profile" onClick={() => setOpen(false)} className="py-3 px-2 border-b border-border/30 text-sm text-foreground/80 hover:text-primary">
                Mon profil
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="py-3 px-2 border-b border-border/30 text-sm text-primary">
                Espace admin
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
