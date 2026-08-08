import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicSupabaseClient, getProductsForCategory, getProduct } from "@platform/db";
import { getNicheBySiteSlug } from "@/lib/niches";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { EsimComparator } from "@/components/tools/esim-comparator";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; site: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  return { title: dictionary.tools.esimComparatorTitle };
}

export default async function EsimComparatorPage({
  params,
}: {
  params: Promise<{ locale: Locale; site: string }>;
}) {
  const { locale, site } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  if (!niche || !niche.launched || site !== "travel") notFound();

  const client = createPublicSupabaseClient();
  const summaries = await getProductsForCategory(client, site, "esim-connectivity");
  const details = await Promise.all(summaries.map((s) => getProduct(client, site, s.slug)));
  const products = details.filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-medium" style={{ color: niche.accentVar }}>
        {niche.name}
      </p>
      <h1 className="mt-2 max-w-2xl font-serif text-3xl font-semibold text-ink">
        {dictionary.tools.esimComparatorTitle}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        {dictionary.tools.esimComparatorIntro}
      </p>

      <div className="mt-10">
        <EsimComparator
          products={products}
          labels={{
            selectToCompare: dictionary.tools.selectToCompare,
            entryPlanColumn: dictionary.tools.entryPlanColumn,
            priceColumn: dictionary.tools.priceColumn,
            dataModelColumn: dictionary.tools.dataModelColumn,
            largestPlanColumn: dictionary.tools.largestPlanColumn,
            coverageColumn: dictionary.tools.coverageColumn,
            noSelection: dictionary.tools.noSelection,
            sourceLabel: dictionary.catalog.sourceLabel,
          }}
        />
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted">{dictionary.catalog.methodologyNote}</p>
    </div>
  );
}
