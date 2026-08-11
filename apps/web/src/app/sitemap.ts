import type { MetadataRoute } from "next";
import { getSiteUrl, LOCALES } from "@platform/seo";
import { createPublicSupabaseClient, listPublishedProductSlugs, listPublishedContentSlugs } from "@platform/db";
import { nicheStructures } from "@/lib/niches";

export const dynamic = "force-dynamic";

const STATIC_SHELL_PATHS = ["", "discover", "search", "about", "editorial-policy", "affiliate-disclosure", "privacy", "terms"];

/** Herramientas son rutas de archivo fijas, no datos — no hay tabla "tools" en el schema todavía. */
const TOOL_PATH_BY_SITE_SLUG: Record<string, string> = {
  "software-ai": "tools/crm-comparator",
  travel: "tools/esim-comparator",
  "consumer-tech": "tools/mesh-wifi-finder",
};

function entryForPath(siteUrl: string, path: string): MetadataRoute.Sitemap[number] {
  const normalized = path ? `/${path}` : "";
  return {
    url: `${siteUrl}/${LOCALES[0]}${normalized}`,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((locale) => [locale, `${siteUrl}/${locale}${normalized}`])),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const client = createPublicSupabaseClient();
  const entries: MetadataRoute.Sitemap = STATIC_SHELL_PATHS.map((path) => entryForPath(siteUrl, path));

  const launchedSites = nicheStructures.filter((niche) => niche.launched);

  for (const niche of launchedSites) {
    entries.push(entryForPath(siteUrl, niche.siteSlug));

    for (const categorySlug of niche.categorySlugs) {
      entries.push(entryForPath(siteUrl, `${niche.siteSlug}/${categorySlug}`));
    }

    const toolPath = TOOL_PATH_BY_SITE_SLUG[niche.siteSlug];
    if (toolPath) entries.push(entryForPath(siteUrl, `${niche.siteSlug}/${toolPath}`));

    entries.push(entryForPath(siteUrl, `${niche.siteSlug}/deals`));

    const [products, contentSlugs] = await Promise.all([
      listPublishedProductSlugs(client, niche.siteSlug),
      listPublishedContentSlugs(client, niche.siteSlug),
    ]);

    for (const product of products) {
      entries.push(entryForPath(siteUrl, `${niche.siteSlug}/${product.categorySlug}/${product.productSlug}`));
    }
    for (const slug of contentSlugs) {
      entries.push(entryForPath(siteUrl, `${niche.siteSlug}/guides/${slug}`));
    }
  }

  return entries;
}
