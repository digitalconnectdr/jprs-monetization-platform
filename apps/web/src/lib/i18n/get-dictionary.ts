import type { Locale } from "@/middleware";
import type { Dictionary } from "./dictionary";
import { en } from "./en";
import { es } from "./es";
import { pt } from "./pt";
import { hi } from "./hi";

const dictionaries: Record<Locale, Dictionary> = { en, es, pt, hi };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

/** Reemplaza `{brand}` en un string traducido — evita repetir el nombre de marca en cada idioma (ADR-009). */
export function t(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}
