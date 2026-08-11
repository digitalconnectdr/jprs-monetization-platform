import type { SupabaseClient } from "@supabase/supabase-js";

export type SiteRole = { siteId: string | null; roleName: string };

export type AdminContext = {
  userId: string;
  email: string | null;
  isSuperAdmin: boolean;
  /** Roles admin/analyst scoped a un site (super_admin no aparece acá — es global, ver isSuperAdmin). */
  siteRoles: SiteRole[];
};

const ADMIN_QUALIFYING_ROLES = ["super_admin", "admin", "analyst"];

/**
 * Sesión + roles del usuario actual, o `null` si no hay sesión. Distinto de "sin
 * rol calificado" (sesión válida pero `siteRoles`/`isSuperAdmin` vacíos) — el layout
 * de /admin trata cada caso distinto: sin sesión → redirect a login; con sesión pero
 * sin rol → "acceso denegado" (nunca un loop de redirect).
 */
export async function getAdminContext(client: SupabaseClient): Promise<AdminContext | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data: rows } = await client
    .from("user_roles")
    .select("site_id, role:roles(name)")
    .eq("user_id", user.id);

  const roles = (rows ?? [])
    .map((r) => {
      const role = Array.isArray(r.role) ? r.role[0] : r.role;
      return { siteId: r.site_id as string | null, roleName: (role?.name as string) ?? "" };
    })
    .filter((r) => ADMIN_QUALIFYING_ROLES.includes(r.roleName));

  return {
    userId: user.id,
    email: user.email ?? null,
    isSuperAdmin: roles.some((r) => r.roleName === "super_admin"),
    siteRoles: roles.filter((r) => r.roleName !== "super_admin"),
  };
}
