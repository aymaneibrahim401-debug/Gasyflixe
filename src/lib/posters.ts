import poster1 from "@/assets/poster-1.jpg";
import poster2 from "@/assets/poster-2.jpg";
import poster3 from "@/assets/poster-3.jpg";
import posterSorona from "@/assets/poster-sorona.jpg";

const map: Record<string, string> = {
  "/src/assets/poster-1.jpg": poster1,
  "/src/assets/poster-2.jpg": poster2,
  "/src/assets/poster-3.jpg": poster3,
  "/src/assets/poster-sorona.jpg": posterSorona,
  "madagaline": poster1,
  "nuit-rouge": poster2,
  "ombres-de-la-ville": poster3,
  "sorona": posterSorona,
};

export const resolvePoster = (url?: string | null, slug?: string | null) => {
  if (url && map[url]) return map[url];
  if (slug && map[slug]) return map[slug];
  return url || "";
};

export const hasPoster = (url?: string | null, slug?: string | null) =>
  Boolean(resolvePoster(url, slug));

export const formatAriary = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " Ar";

export const getPoster = (key: string) => map[key] ?? "";
export const POSTERS = map;
