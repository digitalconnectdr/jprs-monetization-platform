import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Emite un evento de analytics idempotente (Fase 7, backlog 701) vía
 * record_analytics_event() — nunca INSERT directo (anon no tiene ese grant).
 * `siteId` se resuelve en el caller (AnalyticsBeacon, backlog 410) con un mapa
 * cacheado en memoria — así se evita el roundtrip extra que motivó dejarlo en `null`
 * en la versión original, sin sacrificar la atribución real por site.
 */
export async function recordPageView(
  client: SupabaseClient,
  params: { path: string; locale: string; siteSlug: string | null; siteId: string | null; sessionId: string }
): Promise<void> {
  const eventId = `pv_${params.sessionId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await client.rpc("record_analytics_event", {
    p_event_id: eventId,
    p_event_type: "page_view",
    p_site_id: params.siteId,
    p_session_id: params.sessionId,
    p_payload: { path: params.path, locale: params.locale, site_slug: params.siteSlug },
  });
}
