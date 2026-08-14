import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicSupabaseClient, getProduct } from "@platform/db";
import { buildAlternates, getSiteUrl, productSchema } from "@platform/seo";
import { getNicheBySiteSlug } from "@/lib/niches";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { priceSuffix, formatPrice } from "@/lib/catalog-price";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

type RouteParams = { locale: Locale; site: string; category: string; product: string };

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { locale, site, category, product } = await params;
  const dictionary = getDictionary(locale);
  const client = createPublicSupabaseClient();
  const detail = await getProduct(client, site, product);
  if (!detail) return {};
  return {
    title: `${detail.name}${detail.vendorName ? ` — ${detail.vendorName}` : ""}`,
    description: detail.vendorName
      ? t(dictionary.catalog.productMetaDescription, { product: detail.name, vendor: detail.vendorName })
      : t(dictionary.catalog.productMetaDescriptionNoVendor, { product: detail.name }),
    alternates: buildAlternates(`${site}/${category}/${product}`, locale),
  };
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

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/${locale}/${site}/${category}/${product}`;
  const schema = productSchema({
    name: detail.name,
    description: detail.vendorName
      ? t(dictionary.catalog.productMetaDescription, { product: detail.name, vendor: detail.vendorName })
      : t(dictionary.catalog.productMetaDescriptionNoVendor, { product: detail.name }),
    url: productUrl,
    brand: detail.vendorName,
    price: detail.latestPrice?.amount ?? null,
    priceCurrency: detail.latestPrice?.currency ?? null,
    priceValidUntil: detail.latestPrice?.expiresAt ?? null,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb
        items={[
          { name: dictionary.catalog.breadcrumbHome, href: `/${locale}` },
          { name: niche.name, href: `/${locale}/${site}` },
          { name: categoryCopy.name, href: `/${locale}/${site}/${category}` },
          { name: detail.name, href: `/${locale}/${site}/${category}/${product}` },
        ]}
      />
      <p className="mt-4 text-sm font-medium" style={{ color: niche.accentVar }}>
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
            {formatPrice(detail.latestPrice.amount, detail.latestPrice.currency, locale)}
            <span className="text-base font-normal text-muted">{priceSuffix(dictionary, detail.latestPrice.priceType)}</span>
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
    </div>
  );
}
