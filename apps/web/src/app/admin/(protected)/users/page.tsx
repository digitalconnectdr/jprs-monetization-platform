import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { listUserRoles, getSiteInfoById } from "@platform/db";
import { ScopeNote } from "@/components/admin/scope-note";
import { assignRole, revokeRole } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Users" };

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "Only super_admin can manage roles.",
  invalid_user_id: "That doesn't look like a valid user ID (uuid).",
  invalid_role: "Invalid role.",
  invalid_site: "Invalid site.",
  invalid_user_role_id: "Invalid assignment ID.",
  duplicate: "That user already has that exact role on that site.",
  cannot_revoke_super_admin: "super_admin can't be revoked from this screen — that stays a manual Admin API step.",
  unknown: "Something went wrong. Please try again.",
};

export default async function UsersDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; assigned?: string; revoked?: string }>;
}) {
  const { error, assigned, revoked } = await searchParams;
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);
  const isSiteScopedOnly = !context?.isSuperAdmin && (context?.siteRoles.length ?? 0) > 0;

  const [roleRows, sites] = await Promise.all([listUserRoles(client), getSiteInfoById(client)]);
  const siteList = Object.values(sites).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Users</h1>
      <p className="mt-1 text-sm text-muted">
        Staff role assignments (backlog 413). KPI_TREE.md §5&apos;s visitor-facing metrics — signups, favorites,
        newsletter — have no schema yet: there are no public accounts before Fase 11.
      </p>

      {isSiteScopedOnly && (
        <ScopeNote>
          <code>user_roles</code> read access is self-scoped by RLS — you only see your own role assignment here,
          not other staff on your site.
        </ScopeNote>
      )}

      {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{ERROR_MESSAGES[error] ?? error}</p>}
      {assigned && <p className="mt-4 rounded-md border border-border bg-surface p-3 text-sm text-ink">Role assigned.</p>}
      {revoked && <p className="mt-4 rounded-md border border-border bg-surface p-3 text-sm text-ink">Role revoked.</p>}

      {context?.isSuperAdmin && (
        <section className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">Assign a role</h2>
          <p className="mt-1 text-xs text-muted">
            Paste the user&apos;s ID from Supabase Dashboard → Authentication → Users (email lookup isn&apos;t
            available here yet — <code>auth.users</code> isn&apos;t exposed via the public schema). Assigning
            <code>super_admin</code> stays a manual Admin API step, by design.
          </p>
          <form action={assignRole} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              type="text"
              name="userId"
              placeholder="User ID (uuid)"
              required
              className="rounded-md border border-border bg-bg px-3 py-2 text-sm sm:col-span-2"
            />
            <select name="roleName" required className="rounded-md border border-border bg-bg px-3 py-2 text-sm">
              <option value="">Role…</option>
              <option value="admin">admin</option>
              <option value="editor">editor</option>
              <option value="analyst">analyst</option>
            </select>
            <select name="siteId" required className="rounded-md border border-border bg-bg px-3 py-2 text-sm">
              <option value="">Site…</option>
              {siteList.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-ink transition-colors duration-fast hover:bg-primary-hover sm:col-span-4 sm:w-fit"
            >
              Assign
            </button>
          </form>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-ink">Current assignments</h2>
        {roleRows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No role assignments visible.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {roleRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="text-ink">
                    {row.displayName ?? `${row.userId.slice(0, 8)}…`} — <span className="font-semibold">{row.roleName}</span>
                  </p>
                  <p className="text-xs text-muted">{row.siteName ?? "All sites"}</p>
                </div>
                {context?.isSuperAdmin && row.roleName !== "super_admin" && (
                  <form action={revokeRole}>
                    <input type="hidden" name="userRoleId" value={row.id} />
                    <button type="submit" className="text-xs text-red-700 underline underline-offset-2 hover:text-red-900">
                      Revoke
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
