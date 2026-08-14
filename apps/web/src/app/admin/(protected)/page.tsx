import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { getExecutiveSummary } from "@platform/db";
import { StatCard } from "@/components/admin/stat-card";
import { ScopeNote } from "@/components/admin/scope-note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Executive",
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(amount);
}

export default async function ExecutiveDashboardPage() {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);

  // Sessions/page views SÍ se atribuyen por site desde backlog 410 (AnalyticsBeacon
  // resuelve site_id real) — RLS filtra analytics_events automáticamente para
  // analyst/admin scoped. revenue_events sigue siendo estrictamente super_admin-only
  // por diseño (Fase 5), así que Revenue/RPS/R1K/Revenue mix siempre leen $0 para un
  // rol scoped a site, con o sin tráfico real. Se documenta en vez de ocultarlo.
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const summary = await getExecutiveSummary(client);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Executive</h1>
      <p className="mt-1 text-sm text-muted">
        Revenue and traffic, platform-wide. KPI_TREE.md §2 — R1K/RPS, not pageviews, is the decision metric.
      </p>

      {isSiteScopedOnly && (
        <ScopeNote>
          Your role is scoped to a specific site — sessions and page views below are already filtered to your
          site. Revenue figures stay at $0 regardless of traffic: <code>revenue_events</code> is readable by
          <code>super_admin</code> only, by design.
        </ScopeNote>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(summary.totalRevenue, summary.currency)} />
        <StatCard label="Sessions" value={summary.sessions.toLocaleString("en")} note={`${summary.pageViews.toLocaleString("en")} page views`} />
        <StatCard label="RPS" value={formatCurrency(summary.rps, summary.currency)} note="Revenue per session" />
        <StatCard label="R1K" value={formatCurrency(summary.r1k, summary.currency)} note="Revenue per 1,000 sessions" />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Revenue mix</h2>
        {summary.revenueByType.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No revenue events yet — no affiliate programs, ads, or leads are connected (backlog 608/618/628).
          </p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {summary.revenueByType.map((row) => (
              <li key={row.eventType} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">{row.eventType}</span>
                <span className="text-ink">{formatCurrency(row.amount, summary.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
