import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase (cookie con el JWT) en cada request a `/admin/*`.
 * Patrón oficial de `@supabase/ssr` para middleware de Next.js — necesario porque el
 * access token expira y los Server Components no pueden refrescarlo por sí solos
 * (no pueden escribir cookies, ver `lib/supabase/server.ts`).
 */
export async function updateAdminSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() (no getSession()) valida el JWT contra el servidor de Supabase en vez
  // de confiar ciegamente en la cookie — es el chequeo recomendado en middleware.
  await supabase.auth.getUser();

  return response;
}
