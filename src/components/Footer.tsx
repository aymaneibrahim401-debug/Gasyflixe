import { Film } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border/60 mt-20 py-10 bg-noir/50">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Film className="h-4 w-4 text-primary" />
        <span className="font-display tracking-widest">GASYFLIX</span>
        <span>© {new Date().getFullYear()} BOODJI PROD</span>
      </div>
      <p className="text-xs italic">Un film. Une histoire. Une expérience inoubliable.</p>
    </div>
  </footer>
);
