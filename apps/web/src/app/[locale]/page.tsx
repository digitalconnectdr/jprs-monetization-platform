import Link from "next/link";
import type { Metadata } from "next";
import { brand } from "@platform/shared";
import { getNiches } from "@/lib/niches";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/middleware";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  return {
    title: `${brand.name} — ${dictionary.home.metaTitleSuffix}`,
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const niches = getNiches(dictionary);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <h1 className="max-w-3xl font-serif text-3xl font-semibold text-ink">
          {dictionary.home.h1}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {t(dictionary.home.intro, { brand: brand.name })}
        </p>
      </section>

      <section
        aria-labelledby="verticals-heading"
        className="border-t border-border bg-surface"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2
            id="verticals-heading"
            className="font-serif text-2xl font-semibold text-ink"
          >
            {dictionary.home.verticalsHeading}
          </h2>
          <ul className="mt-8 flex flex-col divide-y divide-border border-y border-border">
            {niches.map((niche) => (
              <li key={niche.slug}>
                <Link
                  href={`/${locale}/${niche.siteSlug}`}
                  className="group flex flex-col gap-2 py-6 transition-colors duration-fast sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <span className="flex items-baseline gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: niche.accentVar }}
                    />
                    <span className="font-serif text-xl font-semibold text-ink group-hover:text-primary">
                      {niche.name}
                    </span>
                  </span>
                  <span className="max-w-xl text-sm leading-relaxed text-muted sm:text-right">
                    {niche.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="methodology-heading"
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16"
      >
        <h2
          id="methodology-heading"
          className="font-serif text-2xl font-semibold text-ink"
        >
          {dictionary.home.methodologyHeading}
        </h2>
        <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {dictionary.home.principles.map((p) => (
            <div key={p.title}>
              <dt className="font-serif text-lg font-semibold text-ink">
                {p.title}
              </dt>
              <dd className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                {p.body}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-sm text-muted">
          {dictionary.home.footerNotePrefix}{" "}
          <Link
            href={`/${locale}/about`}
            className="text-ink underline underline-offset-2"
          >
            {dictionary.home.footerNoteMethodologyLink}
          </Link>{" "}
          {dictionary.home.footerNoteMiddle}{" "}
          <Link
            href={`/${locale}/affiliate-disclosure`}
            className="text-ink underline underline-offset-2"
          >
            {dictionary.home.footerNoteAffiliateLink}
          </Link>
          {dictionary.home.footerNoteSuffix}
        </p>
      </section>
    </>
  );
}
