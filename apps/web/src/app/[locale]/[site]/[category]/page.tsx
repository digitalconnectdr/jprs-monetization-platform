import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicSupabaseClient, getProductsForCategory } from "@platform/db";
import { getNicheBySiteSlug } from "@/lib/niches";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { priceSuffix } from "@/lib/catalog-price";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; site: string; category: string }>;
}): Promise<Metadata> {
  const { locale, site, category } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  const categoryCopy = niche?.categories.find((c) => c.slug === category);
  if (!niche || !categoryCopy) return {};
  return { title: `${categoryCopy.name} — ${niche.name}` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: Locale; site: string; category: string }>;
}) {
  const { locale, site, category } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  if (!niche || !niche.launched) notFound();
  const categoryCopy = niche.categories.find((c) => c.slug === category);
  if (!categoryCopy) notFound();

  const client = createPublicSupabaseClient();
  const products = await getProductsForCategory(client, site, category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-medium" style={{ color: niche.accentVar }}>
        {niche.name}
      </p>
      <h1 className="mt-2 max-w-2xl font-serif text-3xl font-semibold text-ink">
        {categoryCopy.name}
      </h1>

      {products.length === 0 ? (
        <p className="mt-8 text-sm leading-relaxed text-muted">{dictionary.catalog.noProductsYet}</p>
      ) : (
        <ul className="mt-10 flex flex-col divide-y divide-border border-y border-border">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/${locale}/${site}/${category}/${product.slug}`}
                className="group flex flex-col gap-2 py-6 transition-colors duration-fast sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-serif text-xl font-semibold text-ink group-hover:text-primary">
                    {product.name}
                  </span>
                  {product.vendorName && (
                    <span className="text-sm text-muted">{product.vendorName}</span>
                  )}
                </span>
                {product.latestPrice && (
                  <span className="shrink-0 text-sm text-ink sm:text-right">
                    {dictionary.catalog.startingAt} ${product.latestPrice.amount.toFixed(2)}
                    {priceSuffix(dictionary, product.latestPrice.priceType)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-xs leading-relaxed text-muted">{dictionary.catalog.methodologyNote}</p>

      <p className="mt-14 border-t border-border pt-8 text-sm text-muted">
        <Link href={`/${locale}/${site}`} className="text-ink underline underline-offset-2">
          {t(dictionary.catalog.backToCategory, { category: niche.name })}
        </Link>
      </p>
    </div>
  );
}
