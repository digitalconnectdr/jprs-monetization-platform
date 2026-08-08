import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicSupabaseClient, getProduct } from "@platform/db";
import { getNicheBySiteSlug } from "@/lib/niches";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

type RouteParams = { locale: Locale; site: string; category: string; product: string };

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { site, product } = await params;
  const client = createPublicSupabaseClient();
  const detail = await getProduct(client, site, product);
  if (!detail) return {};
  return { title: `${detail.name}${detail.vendorName ? ` — ${detail.vendorName}` : ""}` };
}

export default async function ProductPage({ params }: { params: Promise<RouteParams> }) {
  const { locale, site, category, product } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  if (!niche || !niche.launched) notFound();
  const categoryCopy = niche.categories.find((c) => c.slug === category);
  if (!categoryCopy) notFound();

  const client = createPublicSupabaseClient();
  const detail = await getProduct(client, site, product);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-medium" style={{ color: niche.accentVar }}>
        {categoryCopy.name}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{detail.name}</h1>
      {detail.vendorName && <p className="mt-1 text-muted">{detail.vendorName}</p>}

      {detail.latestPrice && (
        <section aria-labelledby="pricing-heading" className="mt-10 rounded-lg border border-border bg-surface p-6">
          <h2 id="pricing-heading" className="font-serif text-lg font-semibold text-ink">
            {dictionary.catalog.pricingHeading}
          </h2>
          <p className="mt-2 text-2xl font-semibold text-ink">
            ${detail.latestPrice.amount.toFixed(0)}
            <span className="text-base font-normal text-muted">{dictionary.catalog.perMonth}</span>
          </p>
          <p className="mt-2 text-xs text-muted">
            {dictionary.catalog.sourceLabel}:{" "}
            <a href={detail.latestPrice.source} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">
              {new URL(detail.latestPrice.source).hostname}
            </a>
            {" · "}
            {dictionary.catalog.lastCheckedLabel}: {new Date(detail.latestPrice.checkedAt).toLocaleDateString(locale)}
          </p>
        </section>
      )}

      {detail.features.length > 0 && (
        <section aria-labelledby="features-heading" className="mt-10">
          <h2 id="features-heading" className="font-serif text-lg font-semibold text-ink">
            {dictionary.catalog.featuresHeading}
          </h2>
          <dl className="mt-4 flex flex-col gap-4">
            {detail.features.map((f) => (
              <div key={f.featureKey} className="border-b border-border pb-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">{f.featureKey.replace(/_/g, " ")}</dt>
                <dd className="mt-1 text-sm text-ink">{f.featureValue}</dd>
                <dd className="mt-1 text-xs text-muted">
                  {dictionary.catalog.sourceLabel}:{" "}
                  <a href={f.source} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">
                    {new URL(f.source).hostname}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {detail.vendorWebsiteUrl && (
        <a
          href={detail.vendorWebsiteUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-10 inline-block rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-ink transition-colors duration-fast hover:bg-primary-hover"
        >
          {dictionary.catalog.visitWebsite}
        </a>
      )}

      <p className="mt-10 text-xs leading-relaxed text-muted">{dictionary.catalog.methodologyNote}</p>

      <p className="mt-14 border-t border-border pt-8 text-sm text-muted">
        <Link href={`/${locale}/${site}/${category}`} className="text-ink underline underline-offset-2">
          {t(dictionary.catalog.backToCategory, { category: categoryCopy.name })}
        </Link>
      </p>
    </div>
  );
}
