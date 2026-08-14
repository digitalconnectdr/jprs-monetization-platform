import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { getAcquisitionSummary, getSiteInfoById } from "@platform/db";
import { StatCard } from "@/components/admin/stat-card";
import { ScopeNote } from "@/components/admin/scope-note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Acquisition" };

export default async function AcquisitionDashboardPage() {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const [summary, sites] = await Promise.all([getAcquisitionSummary(client), getSiteInfoById(client)]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Acquisition</h1>
      <p className="mt-1 text-sm text-muted">
        Sessions and top pages from real <code>page_view</code> events. KPI_TREE.md §5 — channel breakdown
        (Google/TikTok/Meta/etc.) requires capturing <code>referrer</code>/UTM params, not tracked yet.
      </p>

      {isSiteScopedOnly && <ScopeNote>Sessions and page views below are already filtered to your site.</ScopeNote>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Sessions" value={summary.totalSessions.toLocaleString("en")} />
        <StatCard label="Page views" value={summary.totalPageViews.toLocaleString("en")} />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Sessions by site</h2>
        <p className="mt-1 text-xs text-muted">
          A session can touch more than one site, so these rows can add up to more than the total above.
        </p>
        {summary.sessionsBySite.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No page views recorded yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {summary.sessionsBySite.map((row) => (
              <li key={row.siteId ?? "shell"} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">{row.siteId ? (sites[row.siteId]?.name ?? row.siteId) : "Shell (home, discover, legal, ...)"}</span>
                <span className="text-ink">
                  {row.sessions.toLocaleString("en")} sessions · {row.pageViews.toLocaleString("en")} views
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Top pages</h2>
        {summary.topPaths.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No page views recorded yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {summary.topPaths.map((row) => (
              <li key={row.path} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">{row.path}</span>
                <span className="text-ink">{row.pageViews.toLocaleString("en")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
