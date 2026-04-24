import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Contact = () => {
  const { settings } = useSiteSettings();

  useEffect(() => { document.title = "Contact — GasyFlix"; }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message envoyé ! Nous vous répondrons rapidement.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-16 flex-1">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary mb-2">Nous écrire</p>
          <h1 className="font-display text-4xl md:text-6xl text-cream mb-4">Contact</h1>
          <p className="text-foreground/70 mb-10 whitespace-pre-line">{settings.contact_text}</p>

          <div className="grid md:grid-cols-2 gap-4 mb-10">
            <div className="p-4 rounded-lg border border-border/60 bg-noir/40 flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Email</p>
                <p className="text-sm text-cream break-all">{settings.contact_email}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border/60 bg-noir/40 flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Téléphone</p>
                <p className="text-sm text-cream">{settings.contact_phone}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border/60 bg-noir/40 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Adresse</p>
                <p className="text-sm text-cream whitespace-pre-line">{settings.contact_address || "Antananarivo, Madagascar"}</p>
              </div>
            </div>
            {settings.contact_facebook && (
              <a
                href={settings.contact_facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-border/60 bg-noir/40 flex items-start gap-3 hover:border-primary/60 transition-colors"
              >
                <Facebook className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Facebook</p>
                  <p className="text-sm text-cream break-all">{settings.contact_facebook.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-4 p-6 rounded-lg border border-border/60 bg-noir/40">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" required placeholder="Votre nom" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required placeholder="vous@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input id="subject" required placeholder="Sujet du message" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" required rows={6} placeholder="Votre message..." />
            </div>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-glow font-display tracking-widest">
              Envoyer
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
