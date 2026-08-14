import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { getProductsSummary, getSiteInfoById } from "@platform/db";
import { StatCard } from "@/components/admin/stat-card";
import { ScopeNote } from "@/components/admin/scope-note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsDashboardPage() {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const [summary, sites] = await Promise.all([getProductsSummary(client), getSiteInfoById(client)]);

  const totalProducts = summary.productsByStatus.reduce((sum, s) => sum + s.count, 0);
  const publishedProducts = summary.productsByStatus.find((s) => s.status === "published")?.count ?? 0;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Products</h1>
      <p className="mt-1 text-sm text-muted">
        Catalog size and price/feature freshness. KPI_TREE.md §5 — views/saves/compare rate require{" "}
        <code>product_impression</code>/<code>save_product</code>/<code>comparison_add</code> events, not wired yet
        (backlog 707).
      </p>

      {isSiteScopedOnly && <ScopeNote>Counts below already reflect only the site(s) your role covers.</ScopeNote>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products" value={totalProducts.toLocaleString("en")} note={`${publishedProducts} published`} />
        <StatCard
          label="Price freshness"
          value={`${summary.productsWithFreshPrice} / ${summary.productsWithAnyPrice}`}
          note="checked in the last 30 days"
        />
        <StatCard
          label="Feature freshness"
          value={`${summary.productsWithFreshFeatures} / ${summary.productsWithAnyFeatures}`}
          note="checked in the last 30 days"
        />
        <StatCard
          label="No price yet"
          value={(totalProducts - summary.productsWithAnyPrice).toLocaleString("en")}
          note="published without a seeded price"
        />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Products by site</h2>
        {summary.productsBySite.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No products yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {summary.productsBySite.map((row) => (
              <li key={row.siteId} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">{sites[row.siteId]?.name ?? row.siteId}</span>
                <span className="text-ink">{row.count.toLocaleString("en")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
