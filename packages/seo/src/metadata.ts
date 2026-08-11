import { getSiteUrl } from "./site-url";

export const LOCALES = ["en", "es", "pt", "hi", "fr"] as const;
export type SeoLocale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: SeoLocale = "en";

/**
 * `alternates` para el Metadata API de Next.js: canonical de la página actual +
 * hreflang para cada uno de los 5 locales + `x-default` (recomendación de Google
 * para cuando el user-agent no matchea ningún locale explícito).
 *
 * @param localePath ruta SIN el segmento de locale, ej. "/discover" o "/software-ai/crm".
 */
export function buildAlternates(localePath: string, currentLocale: SeoLocale) {
  const siteUrl = getSiteUrl();
  const normalizedPath = localePath.startsWith("/") ? localePath : `/${localePath}`;
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = `${siteUrl}/${locale}${normalizedPath}`;
  }
  languages["x-default"] = `${siteUrl}/${DEFAULT_LOCALE}${normalizedPath}`;

  return {
    canonical: `${siteUrl}/${currentLocale}${normalizedPath}`,
    languages,
  };
}
