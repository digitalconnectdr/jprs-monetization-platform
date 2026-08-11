import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la sesión del visitante (cookies), para Server
 * Components/Actions de `/admin` — a diferencia de `createPublicSupabaseClient()`
 * (`@platform/db`, siempre `anon`, sin sesión), este SÍ trae el JWT del usuario
 * logueado, así que las queries quedan sujetas a RLS real por su rol
 * (`has_role`/`is_admin_for_site`), no al acceso público.
 *
 * `set`/`remove` van en un try/catch porque un Server Component no puede escribir
 * cookies (solo leerlas) — el refresco real de la sesión ocurre en el middleware
 * (`lib/supabase/middleware.ts`), que sí corre antes de cada request y puede
 * escribir. Este patrón es el oficial de `@supabase/ssr` para Next.js App Router.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas.");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component (no puede escribir cookies) — el middleware ya se
          // encarga de mantener la sesión fresca en la siguiente request.
        }
      },
    },
  });
}
