import type { SupabaseClient } from "@supabase/supabase-js";

/** Resuelve el uuid real de un site a partir de su slug. */
export async function getSiteIdBySlug(client: SupabaseClient, siteSlug: string): Promise<string | null> {
  const { data } = await client.from("sites").select("id").eq("slug", siteSlug).maybeSingle();
  return data?.id ?? null;
}

/**
 * Mapa slug→uuid de todos los sites, en una sola query — usado por AnalyticsBeacon
 * (backlog 410) para resolver site_id sin pagar un roundtrip por cada navegación: el
 * caller cachea el resultado una vez y lo reusa mientras dure la sesión del visitante.
 */
export async function getSiteIdMap(client: SupabaseClient): Promise<Record<string, string>> {
  const { data } = await client.from("sites").select("id,slug");
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.slug] = row.id;
  }
  return map;
}

export type SiteInfo = { id: string; slug: string; name: string };

/** uuid→{slug,name} para mostrar nombres legibles en el dashboard admin (módulos de 412) en vez de UUIDs crudos. */
export async function getSiteInfoById(client: SupabaseClient): Promise<Record<string, SiteInfo>> {
  const { data } = await client.from("sites").select("id,slug,name");
  const map: Record<string, SiteInfo> = {};
  for (const row of data ?? []) {
    map[row.id] = { id: row.id, slug: row.slug, name: row.name };
  }
  return map;
}
