import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicSupabaseClient, getProduct, getProductsForCategory } from "@platform/db";
import { buildAlternates } from "@platform/seo";
import { MeshWifiFinder } from "@/components/tools/mesh-wifi-finder";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { getNicheBySiteSlug } from "@/lib/niches";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; site: string }> }): Promise<Metadata> {
  const { locale, site } = await params;
  const dictionary = getDictionary(locale);
  return {
    title: dictionary.tools.meshWifiFinderTitle,
    description: dictionary.tools.meshWifiFinderIntro,
    alternates: buildAlternates(`${site}/tools/mesh-wifi-finder`, locale),
  };
}

export default async function MeshWifiFinderPage({
  params,
}: {
  params: Promise<{ locale: Locale; site: string }>;
}) {
  const { locale, site } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  if (!niche || !niche.launched || site !== "consumer-tech") notFound();

  const client = createPublicSupabaseClient();
  const summaries = await getProductsForCategory(client, site, "networking");
  const details = await Promise.all(summaries.map((summary) => getProduct(client, site, summary.slug)));
  const products = details.filter((detail): detail is NonNullable<typeof detail> => detail !== null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-medium" style={{ color: niche.accentVar }}>
        {niche.name}
      </p>
      <h1 className="mt-2 max-w-2xl font-serif text-3xl font-semibold text-ink">
        {dictionary.tools.meshWifiFinderTitle}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        {dictionary.tools.meshWifiFinderIntro}
      </p>

      <div className="mt-10">
        <MeshWifiFinder
          products={products}
          locale={locale}
          site={site}
          category="networking"
          labels={{
            requireWifi7: dictionary.tools.requireWifi7,
            requireMultiGig: dictionary.tools.requireMultiGig,
            requireSmartHomeHub: dictionary.tools.requireSmartHomeHub,
            matchingProductsHeading: dictionary.tools.matchingProductsHeading,
            noMatchingProducts: dictionary.tools.noMatchingProducts,
            finderMethodology: dictionary.tools.finderMethodology,
            viewDetails: dictionary.catalog.viewDetails,
          }}
        />
      </div>
    </div>
  );
}
