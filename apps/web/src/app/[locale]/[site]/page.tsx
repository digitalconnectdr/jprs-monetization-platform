import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildAlternates } from "@platform/seo";
import { nicheStructures, getNicheBySiteSlug } from "@/lib/niches";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { locales, type Locale } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    nicheStructures.map((n) => ({ locale, site: n.siteSlug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; site: string }>;
}): Promise<Metadata> {
  const { locale, site } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  if (!niche) return {};
  return {
    title: niche.name,
    description: niche.description,
    alternates: buildAlternates(site, locale),
  };
}

export default async function NicheHubPage({
  params,
}: {
  params: Promise<{ locale: Locale; site: string }>;
}) {
  const { locale, site } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  if (!niche) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-medium" style={{ color: niche.accentVar }}>
        {dictionary.nicheHub.kicker}
      </p>
      <h1 className="mt-2 max-w-2xl font-serif text-3xl font-semibold text-ink">
        {niche.name}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        {niche.description}
      </p>

      {!niche.launched && (
        <div className="mt-10 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm leading-relaxed text-ink">
            {dictionary.nicheHub.inDevelopmentPrefix} {niche.shortName}{" "}
            {dictionary.nicheHub.inDevelopmentSuffix}{" "}
            <Link href={`/${locale}/about`} className="underline underline-offset-2">
              {dictionary.nicheHub.methodologyLink}
            </Link>
            .
          </p>
        </div>
      )}

      <section aria-labelledby="categories-heading" className="mt-12">
        <h2 id="categories-heading" className="font-serif text-xl font-semibold text-ink">
          {dictionary.nicheHub.categoriesHeading}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {niche.categories.map((category) =>
            niche.launched ? (
              <li key={category.slug}>
                <Link
                  href={`/${locale}/${niche.siteSlug}/${category.slug}`}
                  className="inline-block rounded-md border border-border px-3 py-1.5 text-sm text-ink transition-colors duration-fast hover:border-primary hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ) : (
              <li key={category.slug}>
                <span className="inline-block rounded-md border border-border px-3 py-1.5 text-sm text-ink">
                  {category.name}
                </span>
              </li>
            )
          )}
        </ul>
      </section>

      <p className="mt-14 border-t border-border pt-8 text-sm text-muted">
        <Link href={`/${locale}/discover`} className="text-ink underline underline-offset-2">
          {dictionary.common.backToDiscover}
        </Link>
      </p>
    </div>
  );
}
