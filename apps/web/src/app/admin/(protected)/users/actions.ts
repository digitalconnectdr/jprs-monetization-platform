"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";

const ASSIGNABLE_ROLES = ["admin", "editor", "analyst"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Server Action de asignación de rol (backlog 413). Nunca confía en el cliente: re-
 * verifica isSuperAdmin server-side con la sesión real antes de escribir. El INSERT
 * corre con el cliente de SESIÓN del propio super_admin (no service_role) — RLS
 * (`user_roles_super_admin_write`) es la autoridad real, esta función es solo UX
 * sobre esa misma policy, no un bypass.
 */
export async function assignRole(formData: FormData): Promise<void> {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  if (!context?.isSuperAdmin) redirect("/admin/users?error=forbidden");

  const userId = String(formData.get("userId") ?? "").trim();
  const roleName = String(formData.get("roleName") ?? "");
  const siteId = String(formData.get("siteId") ?? "");

  if (!UUID_RE.test(userId)) redirect("/admin/users?error=invalid_user_id");
  if (!ASSIGNABLE_ROLES.includes(roleName)) redirect("/admin/users?error=invalid_role");
  if (!UUID_RE.test(siteId)) redirect("/admin/users?error=invalid_site");

  const { data: role } = await client.from("roles").select("id").eq("name", roleName).maybeSingle();
  if (!role) redirect("/admin/users?error=invalid_role");

  const { error } = await client
    .from("user_roles")
    .insert({ user_id: userId, role_id: role.id, site_id: siteId, created_by: context.userId });

  if (error) {
    // Violación de unique(user_id, role_id, site_id) → ya tenía exactamente ese rol.
    redirect(error.code === "23505" ? "/admin/users?error=duplicate" : "/admin/users?error=unknown");
  }

  redirect("/admin/users?assigned=1");
}

/**
 * Revoca un rol. Nunca permite revocar una fila `super_admin` desde esta UI —
 * autobloqueo real (un super_admin podría quitarse a sí mismo el único acceso), la
 * gestión de super_admin se queda deliberadamente en el flujo manual vía Admin API.
 */
export async function revokeRole(formData: FormData): Promise<void> {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  if (!context?.isSuperAdmin) redirect("/admin/users?error=forbidden");

  const userRoleId = String(formData.get("userRoleId") ?? "");
  if (!UUID_RE.test(userRoleId)) redirect("/admin/users?error=invalid_user_role_id");

  const { data: row } = await client
    .from("user_roles")
    .select("id, role:roles(name)")
    .eq("id", userRoleId)
    .maybeSingle();
  const roleField = row?.role as { name: string } | { name: string }[] | null | undefined;
  const roleName = Array.isArray(roleField) ? roleField[0]?.name : roleField?.name;
  if (roleName === "super_admin") redirect("/admin/users?error=cannot_revoke_super_admin");

  const { error } = await client.from("user_roles").delete().eq("id", userRoleId);
  if (error) redirect("/admin/users?error=unknown");

  redirect("/admin/users?revoked=1");
}
