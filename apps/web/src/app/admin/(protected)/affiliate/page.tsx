import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { getAffiliateSummary } from "@platform/db";
import { StatCard } from "@/components/admin/stat-card";
import { ScopeNote } from "@/components/admin/scope-note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Affiliate" };

export default async function AffiliateDashboardPage() {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const summary = await getAffiliateSummary(client);
  const totalPrograms = summary.programsByStatus.reduce((sum, s) => sum + s.count, 0);
  const activePrograms = summary.programsByStatus.find((s) => s.status === "active")?.count ?? 0;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Affiliate</h1>
      <p className="mt-1 text-sm text-muted">
        Programs, links, and click volume. KPI_TREE.md §5 — EPC/CR/commissions require real revenue reconciliation
        (backlog 608/618/628, no programs connected yet).
      </p>

      {isSiteScopedOnly && (
        <ScopeNote>
          Click volume is readable by <code>super_admin</code> only, by design — it may read as 0 here even with
          real clicks.
        </ScopeNote>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Affiliate programs" value={totalPrograms.toLocaleString("en")} note={`${activePrograms} active`} />
        <StatCard
          label="Affiliate links"
          value={summary.linksByStatus.reduce((sum, s) => sum + s.count, 0).toLocaleString("en")}
        />
        <StatCard label="Clicks" value={summary.clickCount.toLocaleString("en")} note="record_affiliate_click()" />
      </div>

      {totalPrograms === 0 && (
        <p className="mt-8 text-sm text-muted">
          No affiliate programs connected yet — backlog 608/618/628. The domain verification step (Impact.com) is
          done; program approval and real tracking links are still pending.
        </p>
      )}
    </div>
  );
}
