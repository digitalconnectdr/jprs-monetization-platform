"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server Action de login — sin registro público desde este formulario: cuentas
 * admin/analyst/super_admin se crean vía Admin API (service_role), nunca self-signup,
 * coherente con que ningún visitante debería poder auto-asignarse esos roles.
 */
export async function signIn(_prevState: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const client = await createServerSupabaseClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const client = await createServerSupabaseClient();
  await client.auth.signOut();
  redirect("/admin/login");
}
