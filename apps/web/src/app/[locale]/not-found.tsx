import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/locales";

/**
 * `not-found.js` no recibe `params` (contrato de Next.js) — el locale se deriva del
 * header `x-pathname` que `proxy.ts` reenvía en cada request bajo `/[locale]/*`.
 * Renderiza dentro de `[locale]/layout.tsx` (header/footer ya localizados), así que
 * solo el propio mensaje necesita el locale.
 */
async function resolveLocale(): Promise<Locale> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const segment = pathname.split("/")[1];
  return locales.includes(segment as Locale) ? (segment as Locale) : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const dictionary = getDictionary(locale);
  return { title: dictionary.notFound.metaTitle };
}

export default async function NotFound() {
  const locale = await resolveLocale();
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-semibold text-ink">{dictionary.notFound.title}</h1>
      <p className="text-muted">{dictionary.notFound.description}</p>
      <Link
        href={`/${locale}`}
        className="mt-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-ink transition-colors duration-fast hover:bg-primary-hover"
      >
        {dictionary.notFound.backHome}
      </Link>
    </div>
  );
}
