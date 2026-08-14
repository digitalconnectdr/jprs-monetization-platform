import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createPublicSupabaseClient, getPublishedContentItem, getProduct } from "@platform/db";
import { buildAlternates } from "@platform/seo";
import { getNicheBySiteSlug } from "@/lib/niches";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { priceSuffix, formatPrice } from "@/lib/catalog-price";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

type RouteParams = { locale: Locale; site: string; slug: string };

/** Descripción real: el propio texto de intro del artículo, truncado a longitud de meta description — nunca texto inventado aparte. */
function introExcerpt(item: { blocks: { blockType: string; blockData: Record<string, unknown> }[] }): string | undefined {
  const intro = item.blocks.find((b) => b.blockType === "intro");
  const text = intro ? String(intro.blockData.text ?? "") : "";
  if (!text) return undefined;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { locale, site, slug } = await params;
  const client = createPublicSupabaseClient();
  const item = await getPublishedContentItem(client, site, slug);
  if (!item) return {};
  return {
    title: item.title,
    description: introExcerpt(item),
    alternates: buildAlternates(`${site}/guides/${slug}`, locale),
  };
}

function IntroBlock({ text }: { text: string }) {
  return <p className="text-lg leading-relaxed text-muted">{text}</p>;
}

async function ComparisonTableBlock({
  productSlugs,
  categorySlug,
  entryPlanFeatureKey,
  site,
  locale,
  dictionary,
}: {
  productSlugs: string[];
  categorySlug: string;
  entryPlanFeatureKey: string;
  site: string;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const client = createPublicSupabaseClient();
  const products = (await Promise.all(productSlugs.map((slug) => getProduct(client, site, slug)))).filter(
    (p): p is NonNullable<typeof p> => p !== null
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-4 font-semibold text-ink"> </th>
            <th className="py-2 pr-4 font-semibold text-ink">{dictionary.tools.entryPlanColumn}</th>
            <th className="py-2 pr-4 font-semibold text-ink">{dictionary.tools.priceColumn}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-border">
              <td className="py-3 pr-4 font-medium text-ink">
                <Link href={`/${locale}/${site}/${categorySlug}/${p.slug}`} className="hover:text-primary">
                  {p.name}
                </Link>
              </td>
              <td className="py-3 pr-4 text-ink">
                {p.features.find((f) => f.featureKey === entryPlanFeatureKey)?.featureValue ?? "—"}
              </td>
              <td className="py-3 pr-4 text-ink">
                {p.latestPrice
                  ? `${formatPrice(p.latestPrice.amount, p.latestPrice.currency, locale)}${priceSuffix(dictionary, p.latestPrice.priceType)}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProsConsBlock({ productName, pros, cons }: { productName: string; pros: string[]; cons: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="font-serif text-lg font-semibold text-ink">{productName}</h3>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pros</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink">
            {pros.map((pro) => (
              <li key={pro}>+ {pro}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cons</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink">
            {cons.map((con) => (
              <li key={con}>− {con}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function VerdictsBlock({ items }: { items: { useCase: string; pick: string; reason: string }[] }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((v) => (
        <div key={v.useCase} className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{v.useCase}</p>
          <p className="mt-1.5 text-sm text-ink">
            <span className="font-semibold">{v.pick}</span> — {v.reason}
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function GuidePage({ params }: { params: Promise<RouteParams> }) {
  const { locale, site, slug } = await params;
  const dictionary = getDictionary(locale);
  const niche = getNicheBySiteSlug(dictionary, site);
  if (!niche || !niche.launched) notFound();

  const client = createPublicSupabaseClient();
  const item = await getPublishedContentItem(client, site, slug);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <Breadcrumb
        items={[
          { name: dictionary.catalog.breadcrumbHome, href: `/${locale}` },
          { name: niche.name, href: `/${locale}/${site}` },
          { name: item.title, href: `/${locale}/${site}/guides/${slug}` },
        ]}
      />
      <p className="mt-4 text-sm font-medium" style={{ color: niche.accentVar }}>
        {niche.name}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{item.title}</h1>

      <div className="prose-legal mt-10 flex flex-col gap-8">
        {item.blocks.map((block, i) => {
          const data = block.blockData as Record<string, unknown>;
          if (block.blockType === "intro" || block.blockType === "conclusion") {
            return <IntroBlock key={i} text={String(data.text ?? "")} />;
          }
          if (block.blockType === "comparison_table") {
            return (
              <ComparisonTableBlock
                key={i}
                productSlugs={(data.productSlugs as string[]) ?? []}
                categorySlug={String(data.categorySlug ?? "crm")}
                entryPlanFeatureKey={String(data.entryPlanFeatureKey ?? "entry_plan_name")}
                site={site}
                locale={locale}
                dictionary={dictionary}
              />
            );
          }
          if (block.blockType === "verdicts") {
            return <VerdictsBlock key={i} items={(data.items as { useCase: string; pick: string; reason: string }[]) ?? []} />;
          }
          if (block.blockType === "pros_cons") {
            return (
              <ProsConsBlock
                key={i}
                productName={String(data.productName ?? "")}
                pros={(data.pros as string[]) ?? []}
                cons={(data.cons as string[]) ?? []}
              />
            );
          }
          return null;
        })}
      </div>

      {item.sources.length > 0 && (
        <section className="mt-14 border-t border-border pt-8">
          <h2 className="font-serif text-lg font-semibold text-ink">{dictionary.catalog.sourceLabel}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {item.sources.map((s) => (
              <li key={s.sourceUrl}>
                <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-ink underline underline-offset-2">
                  {s.sourceLabel ?? s.sourceUrl}
                </a>
                <span className="text-muted"> — {dictionary.catalog.lastCheckedLabel.toLowerCase()}: {new Date(s.checkedAt).toLocaleDateString(locale)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 border-t border-border pt-8 text-xs leading-relaxed text-muted">
        <Link href={`/${locale}/affiliate-disclosure`} className="underline underline-offset-2">
          {dictionary.footer.legal.affiliateDisclosure}
        </Link>
        {" — "}
        {dictionary.catalog.methodologyNote}
      </p>
    </div>
  );
}
