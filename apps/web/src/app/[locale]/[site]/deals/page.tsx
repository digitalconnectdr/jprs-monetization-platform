import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicSupabaseClient, getActiveDeals, type ProductDeal } from "@platform/db";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { getNicheBySiteSlug } from "@/lib/niches";

export const dynamic = "force-dynamic";

function formatPrice(locale: Locale, amount: number, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

function getSafeSourceHost(source: string): string | null {
  try {
    const url = new URL(source);
    return url.protocol === "https:" || url.protocol === "http:" ? url.hostname : null;
  } catch {
    return null;
  }
}

/** % de descuento entero, solo si el precio de lista es mayor que el de oferta y misma moneda — nunca un porcentaje inventado o negativo. */
function savingsPercent(deal: ProductDeal): number | null {
  if (!deal.listPrice || deal.listPrice.currency !== deal.latestPrice.currency) return null;
  if (deal.listPrice.amount <= deal.latestPrice.amount) return null;
  return Math.round((1 - deal.latestPrice.amount / deal.listPrice.amount) * 100);
}

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
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-medium" style={{ color: niche.accentVar }}>
        {niche.name}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{dictionary.catalog.dealsTitle}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{dictionary.catalog.dealsIntro}</p>

      {deals.length === 0 ? (
        <p className="mt-10 text-sm text-muted">{dictionary.catalog.noActiveDeals}</p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => {
            const percent = savingsPercent(deal);
            const sourceHost = getSafeSourceHost(deal.latestPrice.source);

            return (
              <li key={deal.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
                <div>
                  <p className="font-serif text-lg font-semibold text-ink">{deal.name}</p>
                  {deal.vendorName && <p className="mt-0.5 text-sm text-muted">{deal.vendorName}</p>}
                </div>

                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-2xl font-semibold text-ink">
                    {formatPrice(locale, deal.latestPrice.amount, deal.latestPrice.currency)}
                  </span>
                  {percent !== null && deal.listPrice && (
                    <>
                      <span className="text-sm text-muted line-through">
                        {dictionary.catalog.wasLabel} {formatPrice(locale, deal.listPrice.amount, deal.listPrice.currency)}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold text-primary-ink"
                        style={{ backgroundColor: niche.accentVar }}
                      >
                        {t(dictionary.catalog.saveLabel, { percent: String(percent) })}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-sm text-ink">
                  {dictionary.catalog.dealEnds}: {new Date(deal.latestPrice.expiresAt).toLocaleDateString(locale)}
                </p>

                <p className="text-xs text-muted">
                  {dictionary.catalog.sourceLabel}:{" "}
                  {sourceHost ? (
                    <a href={deal.latestPrice.source} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">
                      {sourceHost}
                    </a>
                  ) : (
                    <span>{deal.latestPrice.source}</span>
                  )}
                  {" · "}
                  {dictionary.catalog.lastCheckedLabel}: {new Date(deal.latestPrice.checkedAt).toLocaleDateString(locale)}
                </p>

                <Link
                  href={`/${locale}/${site}/${deal.categorySlug}/${deal.slug}`}
                  className="mt-auto text-sm font-medium text-ink underline underline-offset-2"
                >
                  {dictionary.catalog.viewDetails}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 text-xs leading-relaxed text-muted">{dictionary.catalog.methodologyNote}</p>
    </div>
  );
}
