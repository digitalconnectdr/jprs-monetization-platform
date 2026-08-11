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
  /** Slugs reales de public.categories, en el MISMO orden que dictionary.niches[slug].categories (nombres traducibles) — se combinan por índice en getNiches(). */
  categorySlugs: string[];
};

export type Niche = NicheStructure & Omit<NicheCopy, "categories"> & {
  categories: { slug: string; name: string }[];
};

export const nicheStructures: NicheStructure[] = [
  {
    slug: "business-software-ai",
    siteSlug: "software-ai",
    accentVar: "var(--color-niche-software)",
    launched: true,
    categorySlugs: ["crm", "ai-assistants", "automation", "seo-marketing", "website-ecommerce", "productivity"],
  },
  {
    slug: "travel-smart-travel",
    siteSlug: "travel",
    accentVar: "var(--color-niche-travel)",
    launched: true,
    categorySlugs: ["hotels", "destinations", "itineraries", "esim-connectivity", "luggage", "travel-tech"],
  },
  {
    slug: "consumer-tech-smart-home",
    siteSlug: "consumer-tech",
    accentVar: "var(--color-niche-tech)",
    launched: true,
    categorySlugs: ["smart-home", "networking", "audio", "monitors", "accessories", "home-office", "creator-gear"],
  },
];

export function getNiches(dictionary: Dictionary): Niche[] {
  return nicheStructures.map((structure) => {
    const copy = dictionary.niches[structure.slug];
    if (!copy) {
      throw new Error(`Missing niche copy for slug "${structure.slug}" in dictionary`);
    }
    const categories = copy.categories.map((name, i) => ({
      slug: structure.categorySlugs[i] ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
    }));
    return { ...structure, ...copy, categories };
  });
}

export function getNicheBySiteSlug(
  dictionary: Dictionary,
  siteSlug: string
): Niche | undefined {
  return getNiches(dictionary).find((n) => n.siteSlug === siteSlug);
}
