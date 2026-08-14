import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { getAdsSummary, getSiteInfoById } from "@platform/db";
import { StatCard } from "@/components/admin/stat-card";
import { ScopeNote } from "@/components/admin/scope-note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ads" };

export default async function AdsDashboardPage() {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const [summary, sites] = await Promise.all([getAdsSummary(client), getSiteInfoById(client)]);

  const totalSlots = summary.slotsByStatus.reduce((sum, s) => sum + s.count, 0);
  const activeSlots = summary.slotsByStatus.find((s) => s.status === "active")?.count ?? 0;
  const pageTypesAllowingAds = summary.rulesByPageType.filter((r) => r.adsAllowed).length;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Ads</h1>
      <p className="mt-1 text-sm text-muted">
        Slot configuration and monetization policy. KPI_TREE.md §5 — impressions/RPM/revenue require{" "}
        <code>ad_revenue_daily</code> events, not wired yet (backlog 707): this module reflects configuration, not
        earnings.
      </p>

      {isSiteScopedOnly && (
        <ScopeNote>
          <code>ad_slots</code>/<code>monetization_rules</code> are readable by an <code>editor</code> or{" "}
          <code>admin</code> of the site — a pure <code>analyst</code> role sees 0 rows here even for their own
          site, by RLS design.
        </ScopeNote>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ad slots" value={totalSlots.toLocaleString("en")} note={`${activeSlots} active`} />
        <StatCard
          label="Page types allowing ads"
          value={`${pageTypesAllowingAds} / ${summary.rulesByPageType.length}`}
          note="monetization_rules"
        />
        <StatCard label="Ad revenue" value="Not tracked" note="ad_revenue_daily not wired (backlog 707)" />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Slots by site</h2>
        {summary.slotsBySite.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No ad slots configured yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {summary.slotsBySite.map((row) => (
              <li key={row.siteId} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">{sites[row.siteId]?.name ?? row.siteId}</span>
                <span className="text-ink">{row.count.toLocaleString("en")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Policy by page type</h2>
        {summary.rulesByPageType.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No monetization rules configured yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {summary.rulesByPageType.map((row) => (
              <li key={row.pageType} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">{row.pageType}</span>
                <span className={row.adsAllowed ? "text-ink" : "text-muted"}>
                  {row.adsAllowed ? `Ads allowed (max ${row.maxAdDensity ?? "—"})` : "No ads"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
