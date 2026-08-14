import type { SupabaseClient } from "@supabase/supabase-js";

export type AcquisitionSummary = {
  /** Sesiones distintas reales, deduplicadas globalmente — no es la suma de sessionsBySite (ver nota abajo). */
  totalSessions: number;
  totalPageViews: number;
  sessionsBySite: { siteId: string | null; sessions: number; pageViews: number }[];
  topPaths: { path: string; pageViews: number }[];
};

/**
 * Agregación real de `analytics_events` (`page_view`). Se beneficia directamente de
 * backlog 410: antes `site_id` era siempre `null`, así que "sessions by site" no
 * existía — ahora agrupa correctamente. Sin desglose por canal (Google/TikTok/etc,
 * KPI_TREE.md §5) porque `payload` no captura `referrer`/UTM todavía (backlog 707).
 *
 * `session_id` vive en `localStorage` (ver `analytics-beacon.tsx`), así que persiste
 * a través de TODOS los sites que visite un mismo navegador, no solo dentro de uno.
 * Sumar `sessionsBySite[i].sessions` sobredimensiona el total real cada vez que una
 * misma sesión visita más de un site — `totalSessions` se calcula aparte con un Set
 * global de `session_id` para no arrastrar ese doble conteo.
 */
export async function getAcquisitionSummary(client: SupabaseClient): Promise<AcquisitionSummary> {
  const { data: rows } = await client
    .from("analytics_events")
    .select("site_id, session_id, payload")
    .eq("event_type", "page_view");

  const bySite = new Map<string | null, { sessions: Set<string>; pageViews: number }>();
  const pathCounts = new Map<string, number>();
  const allSessions = new Set<string>();

  for (const row of rows ?? []) {
    const key = row.site_id;
    const entry = bySite.get(key) ?? { sessions: new Set<string>(), pageViews: 0 };
    if (row.session_id) {
      entry.sessions.add(row.session_id);
      allSessions.add(row.session_id);
    }
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

  return {
    totalSessions: allSessions.size,
    totalPageViews: rows?.length ?? 0,
    sessionsBySite,
    topPaths,
  };
}
