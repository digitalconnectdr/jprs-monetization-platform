import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { getOperationsSummary } from "@platform/db";
import { StatCard } from "@/components/admin/stat-card";
import { ScopeNote } from "@/components/admin/scope-note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Operations" };

export default async function OperationsDashboardPage() {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const summary = await getOperationsSummary(client);
  const dueCount = summary.freshnessByStatus.find((s) => s.status === "due")?.count ?? 0;
  const staleCount = summary.freshnessByStatus.find((s) => s.status === "stale")?.count ?? 0;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Operations</h1>
      <p className="mt-1 text-sm text-muted">
        Freshness queue (<code>freshness_checks</code>). KPI_TREE.md §5 — job/sync-failure tracking and
        audit-findings/backlog status live in <code>docs/MASTER_BACKLOG.md</code>, not in Postgres, so they aren&apos;t
        shown here.
      </p>

      {isSiteScopedOnly && (
        <ScopeNote>
          <code>freshness_checks</code> is readable by <code>super_admin</code> only, for every operation — this
          module always reads empty for a site-scoped role, regardless of real staleness.
        </ScopeNote>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Due for review" value={dueCount.toLocaleString("en")} />
        <StatCard label="Stale" value={staleCount.toLocaleString("en")} />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Needs attention</h2>
        {summary.staleEntities.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing due or stale right now.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {summary.staleEntities.map((row) => (
              <li key={`${row.entityType}-${row.entityId}`} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">
                  {row.entityType} · {row.entityId.slice(0, 8)}
                </span>
                <span className="text-xs text-muted">
                  {row.nextCheckDueAt
                    ? `due ${new Date(row.nextCheckDueAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}`
                    : "no due date"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
