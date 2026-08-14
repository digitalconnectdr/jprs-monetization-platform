import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/supabase/admin-context";
import { signOut } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const client = await createServerSupabaseClient();
  const context = await getAdminContext(client);

  // Sin sesión → login. Distinto de "sesión válida pero sin rol calificado" (abajo) —
  // nunca se confunden en un loop de redirect.
  if (!context) redirect("/admin/login");

  const hasAnyRole = context.isSuperAdmin || context.siteRoles.length > 0;
  if (!hasAnyRole) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-xl font-semibold text-ink">Access denied</h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as {context.email}, but this account has no admin/analyst role on any site.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className="text-sm underline underline-offset-2">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <p className="font-serif text-lg font-semibold text-ink">Decidero Admin</p>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>{context.email}</span>
          <form action={signOut}>
            <button type="submit" className="underline underline-offset-2 hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <AdminNav />
      <main className="py-10">{children}</main>
    </div>
  );
}
