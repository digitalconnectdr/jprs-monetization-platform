import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Emite un evento de analytics idempotente (Fase 7, backlog 701) vía
 * record_analytics_event() — nunca INSERT directo (anon no tiene ese grant).
 * site_id queda sin resolver a propósito: resolver el slug de la URL a un uuid real
 * añadiría un roundtrip extra a cada navegación por un dato que, para el v1, ya viaja
 * en payload.site_slug (suficiente para agrupar en KPI_TREE.md §5 sin ese costo).
 */
export async function recordPageView(
  client: SupabaseClient,
  params: { path: string; locale: string; siteSlug: string | null; sessionId: string }
): Promise<void> {
  const eventId = `pv_${params.sessionId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await client.rpc("record_analytics_event", {
    p_event_id: eventId,
    p_event_type: "page_view",
    p_site_id: null,
    p_session_id: params.sessionId,
    p_payload: { path: params.path, locale: params.locale, site_slug: params.siteSlug },
  });
}
