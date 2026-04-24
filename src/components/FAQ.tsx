import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  { q: "Comment créer un compte ?", a: "Inscrivez-vous avec votre email pour obtenir votre ID." },
  { q: "Pourquoi un ID ?", a: "Pour sécuriser votre accès après paiement." },
  { q: "Comment acheter un film ?", a: "Cliquez sur « Acheter », payez, puis regardez directement." },
  { q: "Quels paiements sont acceptés ?", a: "Mobile money (MVola, Orange Money)." },
  { q: "Puis-je revoir le film ?", a: "Oui, après achat il reste disponible dans votre compte." },
  { q: "Puis-je télécharger le film ?", a: "Non, uniquement en streaming." },
  { q: "Paiement effectué mais pas d'accès ?", a: "Reconnectez-vous ou contactez le support." },
];

export const FAQ = () => (
  <section className="container py-16" id="faq">
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-primary/40 bg-noir/60 text-primary text-xs uppercase tracking-widest">
          <HelpCircle className="h-3 w-3" /> Questions fréquentes
        </div>
        <h2 className="font-display text-4xl md:text-5xl text-cream">FAQ</h2>
      </div>
      <Accordion type="single" collapsible className="rounded-lg border border-border/60 bg-noir/40 px-6">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
            <AccordionTrigger className="text-left text-cream hover:text-primary hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-foreground/70">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
