import type { SupabaseClient } from "@supabase/supabase-js";

export type RevenueByType = { eventType: string; amount: number };

export type ExecutiveSummary = {
  totalRevenue: number;
  currency: string;
  sessions: number;
  pageViews: number;
  /** Revenue per session. */
  rps: number;
  /** Revenue per 1,000 sessions — KPI_TREE.md §2, métrica de decisión principal. */
  r1k: number;
  revenueByType: RevenueByType[];
};

/**
 * Módulo Executive del dashboard admin (Fase "409+706", KPI_TREE.md §5). Requiere un
 * cliente con la sesión del usuario (no `anon`, no `service_role`) para que RLS
 * aplique de verdad — `revenue_events` es `super_admin`-únicamente (Fase 5),
 * `analytics_events` es `analyst`/`admin` de su site o `super_admin` (Fase 7). Con
 * cero afiliados conectados y tráfico real mínimo, la mayoría de estos números son
 * honestamente 0 — nunca se rellenan con datos de muestra.
 */
export async function getExecutiveSummary(client: SupabaseClient): Promise<ExecutiveSummary> {
  const [{ data: revenueRows }, { data: eventRows }] = await Promise.all([
    client.from("revenue_events").select("event_type, amount"),
    client.from("analytics_events").select("session_id").eq("event_type", "page_view"),
  ]);

  const revenueByType = new Map<string, number>();
  let totalRevenue = 0;
  for (const row of revenueRows ?? []) {
    const amount = Number(row.amount);
    totalRevenue += amount;
    revenueByType.set(row.event_type, (revenueByType.get(row.event_type) ?? 0) + amount);
  }

  const pageViews = (eventRows ?? []).length;
  const sessions = new Set((eventRows ?? []).map((r) => r.session_id).filter(Boolean)).size;
  const rps = sessions > 0 ? totalRevenue / sessions : 0;
  const r1k = rps * 1000;

  return {
    totalRevenue,
    // v1: asume USD (todo el revenue sembrado hasta ahora es USD) — sumar monedas
    // distintas sin conversión sería incorrecto; se revisita si aparece revenue real
    // en otra moneda.
    currency: "USD",
    sessions,
    pageViews,
    rps,
    r1k,
    revenueByType: Array.from(revenueByType.entries()).map(([eventType, amount]) => ({ eventType, amount })),
  };
}
