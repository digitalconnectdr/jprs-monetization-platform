import type { SupabaseClient } from "@supabase/supabase-js";

export type AffiliateSummary = {
  programsByStatus: { status: string; count: number }[];
  linksByStatus: { status: string; count: number }[];
  clickCount: number;
};

/**
 * `affiliate_programs`/`affiliate_links` son legibles por admin/editor del site del
 * vendor asociado (Fase 5). `affiliate_clicks` es `super_admin`-únicamente — RLS
 * filtra filas silenciosamente (no hay forma de distinguir "0 real" de "0 por RLS"
 * desde un simple count), así que la página condiciona el texto de contexto según
 * `isSuperAdmin`, igual que el resto de módulos, en vez de intentar inferirlo aquí.
 */
export async function getAffiliateSummary(client: SupabaseClient): Promise<AffiliateSummary> {
  const [{ data: programs }, { data: links }, clicksResult] = await Promise.all([
    client.from("affiliate_programs").select("status"),
    client.from("affiliate_links").select("status"),
    client.from("affiliate_clicks").select("id", { count: "exact", head: true }),
  ]);

  const programsByStatus = new Map<string, number>();
  for (const row of programs ?? []) {
    programsByStatus.set(row.status, (programsByStatus.get(row.status) ?? 0) + 1);
  }
  const linksByStatus = new Map<string, number>();
  for (const row of links ?? []) {
    linksByStatus.set(row.status, (linksByStatus.get(row.status) ?? 0) + 1);
  }

  return {
    programsByStatus: Array.from(programsByStatus.entries()).map(([status, count]) => ({ status, count })),
    linksByStatus: Array.from(linksByStatus.entries()).map(([status, count]) => ({ status, count })),
    clickCount: clicksResult.count ?? 0,
  };
}
