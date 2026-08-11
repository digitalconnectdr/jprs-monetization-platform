/**
 * URL base absoluta del sitio, para canonical/sitemap/hreflang/JSON-LD (Fase 8).
 *
 * NUNCA hardcodear un dominio literal: backlog 109 (registro de dominio propio) sigue
 * diferido (`packages/shared/src/branding.ts` tiene `domain: ""`). Prioridad:
 * 1. NEXT_PUBLIC_SITE_URL — override explícito, para cuando 109 se resuelva.
 * 2. VERCEL_PROJECT_PRODUCTION_URL — variable que Vercel expone automáticamente con
 *    el dominio real de producción (sin protocolo).
 * 3. http://localhost:3000 — fallback de desarrollo local.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
