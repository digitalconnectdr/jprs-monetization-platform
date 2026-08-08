import type { Dictionary, NicheCopy } from "./i18n/dictionary";

/**
 * Datos estructurales (no traducibles) de los 3 verticales MVP — coincide con
 * supabase/seed.sql y PROJECT_BLUEPRINT.md §3. El nombre/descripción/categorías
 * traducibles viven en src/lib/i18n/{en,es}.ts (clave = slug).
 *
 * Se sirve como constante estática en Fase 3 (Design System & Public Shell);
 * Fase 4 (CMS & Product Intelligence) lo reemplaza por datos reales de
 * `public.niches`/`public.sites` vía Supabase.
 */
export type NicheStructure = {
  slug: string;
  siteSlug: string;
  accentVar: string;
  launched: boolean;
};

export type Niche = NicheStructure & NicheCopy;

export const nicheStructures: NicheStructure[] = [
  {
    slug: "business-software-ai",
    siteSlug: "software-ai",
    accentVar: "var(--color-niche-software)",
    launched: false,
  },
  {
    slug: "travel-smart-travel",
    siteSlug: "travel",
    accentVar: "var(--color-niche-travel)",
    launched: false,
  },
  {
    slug: "consumer-tech-smart-home",
    siteSlug: "consumer-tech",
    accentVar: "var(--color-niche-tech)",
    launched: false,
  },
];

export function getNiches(dictionary: Dictionary): Niche[] {
  return nicheStructures.map((structure) => {
    const copy = dictionary.niches[structure.slug];
    if (!copy) {
      throw new Error(`Missing niche copy for slug "${structure.slug}" in dictionary`);
    }
    return { ...structure, ...copy };
  });
}

export function getNicheBySiteSlug(
  dictionary: Dictionary,
  siteSlug: string
): Niche | undefined {
  return getNiches(dictionary).find((n) => n.siteSlug === siteSlug);
}
