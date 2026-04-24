import { Link } from "react-router-dom";
import { getPoster } from "@/lib/posters";
import { Badge } from "@/components/ui/badge";

export interface MovieCardData {
  id: string;
  title: string;
  slug: string;
  year: number;
  genre: string;
  director: string;
  price_cents: number;
  poster_url: string;
}

export const MovieCard = ({ movie }: { movie: MovieCardData }) => {
  return (
    <Link to={`/film/${movie.slug}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-border/60 shadow-poster transition-all duration-500 group-hover:border-primary/60 group-hover:shadow-gold">
        <img
          src={getPoster(movie.poster_url)}
          alt={`Affiche de ${movie.title}`}
          loading="lazy"
          width={512}
          height={768}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/30 to-transparent opacity-80" />
        <Badge className="absolute top-2 right-2 bg-noir/80 text-primary border border-primary/40 text-[10px]">
          {movie.year}
        </Badge>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display text-xl tracking-wide text-cream leading-tight">{movie.title}</h3>
          <p className="text-xs text-muted-foreground italic">{movie.genre}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">{movie.director}</span>
        <span className="font-display text-lg text-primary">{(movie.price_cents / 100).toFixed(2)} €</span>
      </div>
    </Link>
  );
};
