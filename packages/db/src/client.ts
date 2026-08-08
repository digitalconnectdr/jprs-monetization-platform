import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente público (anon key) para lectura de datos publicados desde apps/web.
 * NO requiere sesión/login — distinto del wiring de auth (backlog 409), que sigue
 * pendiente. Solo lee lo que RLS ya permite a `anon` (status=published/active).
 */
export function createPublicSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas.");
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
