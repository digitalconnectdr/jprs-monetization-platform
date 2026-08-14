import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRoleRow = {
  id: string;
  userId: string;
  displayName: string | null;
  roleName: string;
  siteId: string | null;
  siteName: string | null;
  createdAt: string;
};

/**
 * Lista todas las asignaciones de rol reales (backlog 413) — join a `roles` (nombre)
 * y `sites` (nombre, null para roles globales de super_admin). `profiles` se resuelve
 * con una query separada (no hay FK directa user_roles→profiles: ambas apuntan a
 * auth.users de forma independiente, PostgREST no puede embeberlas juntas —
 * PGRST200, "no relationship found"). Si el usuario no configuró display_name, la UI
 * muestra el user_id truncado — no hay email disponible fuera del Admin API.
 */
export async function listUserRoles(client: SupabaseClient): Promise<UserRoleRow[]> {
  const { data, error } = await client
    .from("user_roles")
    .select("id, user_id, created_at, role:roles(name), site:sites(id,name)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await client.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const displayNameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return rows.map((row) => {
    const role = Array.isArray(row.role) ? row.role[0] : row.role;
    const site = Array.isArray(row.site) ? row.site[0] : row.site;
    return {
      id: row.id,
      userId: row.user_id,
      displayName: displayNameByUserId.get(row.user_id) ?? null,
      roleName: role?.name ?? "unknown",
      siteId: site?.id ?? null,
      siteName: site?.name ?? null,
      createdAt: row.created_at,
    };
  });
}
