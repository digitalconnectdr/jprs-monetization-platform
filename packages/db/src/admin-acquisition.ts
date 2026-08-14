import type { SupabaseClient } from "@supabase/supabase-js";

export type AcquisitionSummary = {
  sessionsBySite: { siteId: string | null; sessions: number; pageViews: number }[];
  topPaths: { path: string; pageViews: number }[];
};

/**
 * Agregación real de `analytics_events` (`page_view`). Se beneficia directamente de
 * backlog 410: antes `site_id` era siempre `null`, así que "sessions by site" no
 * existía — ahora agrupa correctamente. Sin desglose por canal (Google/TikTok/etc,
 * KPI_TREE.md §5) porque `payload` no captura `referrer`/UTM todavía (backlog 707).
 */
export async function getAcquisitionSummary(client: SupabaseClient): Promise<AcquisitionSummary> {
  const { data: rows } = await client
    .from("analytics_events")
    .select("site_id, session_id, payload")
    .eq("event_type", "page_view");

  const bySite = new Map<string | null, { sessions: Set<string>; pageViews: number }>();
  const pathCounts = new Map<string, number>();

  for (const row of rows ?? []) {
    const key = row.site_id;
    const entry = bySite.get(key) ?? { sessions: new Set<string>(), pageViews: 0 };
    if (row.session_id) entry.sessions.add(row.session_id);
    entry.pageViews += 1;
    bySite.set(key, entry);

    const path = (row.payload as { path?: string } | null)?.path;
    if (path) pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);
  }

  const sessionsBySite = Array.from(bySite.entries()).map(([siteId, v]) => ({
    siteId,
    sessions: v.sessions.size,
    pageViews: v.pageViews,
  }));

  const topPaths = Array.from(pathCounts.entries())
    .map(([path, pageViews]) => ({ path, pageViews }))
    .sort((a, b) => b.pageViews - a.pageViews)
    .slice(0, 10);

  return { sessionsBySite, topPaths };
}
