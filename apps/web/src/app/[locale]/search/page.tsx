import type { Metadata } from "next";
import Link from "next/link";
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
    title: dictionary.search.metaTitle,
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const dictionary = getDictionary(locale);
  const niches = getNiches(dictionary);
  const query = q?.trim() ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-serif text-3xl font-semibold text-ink">
        {dictionary.search.h1}
      </h1>

      <form
        role="search"
        action={`/${locale}/search`}
        className="mt-6 flex gap-2"
      >
        <label htmlFor="search-q" className="sr-only">
          {dictionary.common.searchLabel}
        </label>
        <input
          id="search-q"
          type="search"
          name="q"
          defaultValue={query}
          placeholder={dictionary.common.searchPlaceholder}
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-muted focus-visible:border-primary focus-visible:bg-bg"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-ink transition-colors duration-fast hover:bg-primary-hover"
        >
          {dictionary.search.submitLabel}
        </button>
      </form>

      {query ? (
        <div className="mt-10 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm leading-relaxed text-ink">
            {dictionary.search.noResultsPrefix} &ldquo;{query}&rdquo;{" "}
            {dictionary.search.noResultsSuffix}
          </p>
        </div>
      ) : (
        <p className="mt-10 text-sm leading-relaxed text-muted">
          {dictionary.search.emptyPrompt}
        </p>
      )}

      <ul className="mt-6 flex flex-wrap gap-2">
        {niches.map((niche) => (
          <li key={niche.slug}>
            <Link
              href={`/${locale}/${niche.siteSlug}`}
              className="inline-block rounded-md border border-border px-3 py-1.5 text-sm text-ink transition-colors duration-fast hover:border-primary hover:text-primary"
            >
              {niche.shortName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
