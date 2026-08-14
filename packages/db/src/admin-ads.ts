import type { SupabaseClient } from "@supabase/supabase-js";

export type AdsSummary = {
  slotsByStatus: { status: string; count: number }[];
  slotsBySite: { siteId: string; count: number }[];
  rulesByPageType: { pageType: string; adsAllowed: boolean; maxAdDensity: number | null }[];
};

/**
 * `ad_slots`/`monetization_rules` son legibles por `editor` o admin del site (Fase 5)
 * — un `analyst` puro (sin rol `editor`/`admin`) ve 0 filas incluso en su propio site,
 * RLS real, no un bug. Sin revenue: `ad_revenue_daily` nunca se emite todavía
 * (backlog 707) — este módulo refleja configuración/política, no ingresos.
 */
export async function getAdsSummary(client: SupabaseClient): Promise<AdsSummary> {
  const [{ data: slots }, { data: rules }] = await Promise.all([
    client.from("ad_slots").select("status, site_id"),
    client.from("monetization_rules").select("page_type, allowed_layers, max_ad_density"),
  ]);

  const slotsByStatus = new Map<string, number>();
  const slotsBySite = new Map<string, number>();
  for (const row of slots ?? []) {
    slotsByStatus.set(row.status, (slotsByStatus.get(row.status) ?? 0) + 1);
    if (row.site_id) slotsBySite.set(row.site_id, (slotsBySite.get(row.site_id) ?? 0) + 1);
  }

  return {
    slotsByStatus: Array.from(slotsByStatus.entries()).map(([status, count]) => ({ status, count })),
    slotsBySite: Array.from(slotsBySite.entries()).map(([siteId, count]) => ({ siteId, count })),
    rulesByPageType: (rules ?? []).map((r) => ({
      pageType: r.page_type,
      adsAllowed: (r.allowed_layers ?? []).includes("ads"),
      maxAdDensity: r.max_ad_density,
    })),
  };
}
