import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { getContentSummary, getSiteInfoById } from "@platform/db";
import { StatCard } from "@/components/admin/stat-card";
import { ScopeNote } from "@/components/admin/scope-note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Content" };

export default async function ContentDashboardPage() {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const [summary, sites] = await Promise.all([getContentSummary(client), getSiteInfoById(client)]);

  const totalItems = summary.itemsByStatus.reduce((sum, s) => sum + s.count, 0);
  const publishedItems = summary.itemsByStatus.find((s) => s.status === "published")?.count ?? 0;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Content</h1>
      <p className="mt-1 text-sm text-muted">
        Editorial pipeline and the pending-approval queue (ADR-005). KPI_TREE.md §5 — sessions/CTR/assisted revenue
        per article require analytics joined to content, not built yet.
      </p>

      {isSiteScopedOnly && <ScopeNote>Counts below already reflect only the site(s) your role covers.</ScopeNote>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Content items" value={totalItems.toLocaleString("en")} note={`${publishedItems} published`} />
        <StatCard
          label="Pending editorial review"
          value={summary.pendingEditorialReview.length.toLocaleString("en")}
          note="awaiting a publish/reject decision"
        />
        <StatCard label="Approved, unpublished" value={summary.approvedUnpublishedCount.toLocaleString("en")} />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Pending your decision</h2>
        {summary.pendingEditorialReview.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing waiting on editorial review right now.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {summary.pendingEditorialReview.map((row) => (
              <li key={row.contentVersionId} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="text-ink">{row.title}</p>
                  <p className="text-xs text-muted">
                    {sites[row.siteId]?.name ?? row.siteId} · {row.contentType}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted">
                  {new Date(row.createdAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
