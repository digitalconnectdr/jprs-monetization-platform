import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/locales";
import { updateAdminSession } from "@/lib/supabase/middleware";

function getLocaleFromAcceptLanguage(request: NextRequest): Locale {
  const header = request.headers.get("accept-language");
  if (!header) return defaultLocale;

  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase());

  for (const lang of preferred) {
    if (!lang) continue;
    const base = lang.split("-")[0];
    if (locales.includes(base as Locale)) return base as Locale;
  }
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin no vive bajo [locale] (herramienta interna, no contenido público
  // multi-idioma) — refresca la sesión de Supabase en vez de redirigir por locale.
  // La lógica pública de abajo queda completamente intacta para todo lo demás.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return updateAdminSession(request);
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (pathnameHasLocale) {
    // `app/[locale]/not-found.tsx` no recibe `params` (contrato de Next.js para
    // not-found.js) — se reenvía el pathname por header para que pueda derivar el
    // locale y renderizar el 404 traducido en vez del genérico en inglés (backlog 408).
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const cookieLocale = request.cookies.get("locale")?.value;
  const locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : getLocaleFromAcceptLanguage(request);

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Excluye archivos internos de Next.js, convenciones estáticas de la raíz
     * de app/ (robots.txt, sitemap.xml, manifest.json) y extensiones de
     * archivo estático comunes — evita que Fase 4+ agregue apps/web/public/
     * y esos archivos queden con prefijo de locale por accidente (F-03,
     * docs/audits/P3_AUDIT.md).
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|txt|xml|json)$).*)",
  ],
};
