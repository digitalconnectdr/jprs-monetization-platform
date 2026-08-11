import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { getExecutiveSummary } from "@platform/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Executive",
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(amount);
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

export default async function ExecutiveDashboardPage() {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);

  // La policy de analytics_events exige site_id no-nulo para analyst/admin scoped a
  // un site — AnalyticsBeacon (Fase 7) no lo resuelve todavía (backlog nuevo), así
  // que hoy este módulo solo trae datos reales para super_admin. Se documenta en vez
  // de ocultarlo.
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const summary = await getExecutiveSummary(client);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Executive</h1>
      <p className="mt-1 text-sm text-muted">
        Revenue and traffic, platform-wide. KPI_TREE.md §2 — R1K/RPS, not pageviews, is the decision metric.
      </p>

      {isSiteScopedOnly && (
        <p className="mt-4 rounded-md border border-border bg-surface p-3 text-xs text-muted">
          Your role is scoped to a specific site. Session/page-view data isn&apos;t attributed to a site yet
          (backlog: resolve <code>site_id</code> in <code>analytics_events</code>), so those numbers may read as
          zero even where real traffic exists.
        </p>
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
