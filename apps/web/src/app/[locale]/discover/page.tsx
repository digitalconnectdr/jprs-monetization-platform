import Link from "next/link";
import type { Metadata } from "next";
import { buildAlternates } from "@platform/seo";
import { getNiches } from "@/lib/niches";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  return {
    title: dictionary.discover.metaTitle,
    description: dictionary.discover.metaDescription,
    alternates: buildAlternates("discover", locale),
  };
}

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const niches = getNiches(dictionary);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="max-w-2xl font-serif text-3xl font-semibold text-ink">
        {dictionary.discover.h1}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        {dictionary.discover.intro}
      </p>

      <div className="mt-12 flex flex-col gap-12">
        {niches.map((niche) => (
          <section key={niche.slug} aria-labelledby={`${niche.slug}-heading`}>
            <div className="flex items-baseline gap-3">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: niche.accentVar }}
              />
              <h2
                id={`${niche.slug}-heading`}
                className="font-serif text-2xl font-semibold text-ink"
              >
                <Link
                  href={`/${locale}/${niche.siteSlug}`}
                  className="hover:text-primary"
                >
                  {niche.name}
                </Link>
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {niche.description}
            </p>
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
        ))}
      </div>

      <p className="mt-14 max-w-2xl border-t border-border pt-8 text-sm text-muted">
        {dictionary.discover.waveNotePrefix}{" "}
        <Link
          href={`/${locale}/about`}
          className="text-ink underline underline-offset-2"
        >
          {dictionary.discover.waveNoteLink}
        </Link>{" "}
        {dictionary.discover.waveNoteSuffix}
      </p>
    </div>
  );
}
