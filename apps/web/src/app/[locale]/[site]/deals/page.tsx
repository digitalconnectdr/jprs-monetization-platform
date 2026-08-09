import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicSupabaseClient, getActiveDeals } from "@platform/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { getNicheBySiteSlug } from "@/lib/niches";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).catalog.dealsTitle };
}

export default async function DealsPage({ params }: { params: Promise<{ locale: Locale; site: string }> }) {
  const { locale, site } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  if (!niche || !niche.launched) notFound();

  const deals = await getActiveDeals(createPublicSupabaseClient(), site);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-medium" style={{ color: niche.accentVar }}>
        {niche.name}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{dictionary.catalog.dealsTitle}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{dictionary.catalog.dealsIntro}</p>

      {deals.length === 0 ? (
        <p className="mt-10 text-sm text-muted">{dictionary.catalog.noActiveDeals}</p>
      ) : (
        <ul className="mt-10 flex flex-col divide-y divide-border border-y border-border">
          {deals.map((deal) => (
            <li key={deal.id} className="flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <div>
                <p className="font-serif text-xl font-semibold text-ink">{deal.name}</p>
                {deal.vendorName && <p className="mt-1 text-sm text-muted">{deal.vendorName}</p>}
                <p className="mt-2 text-sm text-ink">
                  ${deal.latestPrice.amount.toFixed(2)} · {dictionary.catalog.dealEnds}: {new Date(deal.latestPrice.expiresAt).toLocaleDateString(locale)}
                </p>
              </div>
              <Link
                href={`/${locale}/${site}/${deal.categorySlug}/${deal.slug}`}
                className="shrink-0 text-sm font-medium text-ink underline underline-offset-2"
              >
                {dictionary.catalog.viewDetails}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-xs leading-relaxed text-muted">{dictionary.catalog.methodologyNote}</p>
    </div>
  );
}
