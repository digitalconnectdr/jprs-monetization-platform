# Backlog 409 + 706 — Reporte de cierre

Auth/sesión en `apps/web` + primer módulo real del dashboard admin (Executive). Scope: `docs/phases/P409_AUTH_DASHBOARD.md`. Cerrado 2026-08-11.

## Qué se entregó

- **409 (wiring de sesión)**: `@supabase/ssr` instalado (versión fijada `0.12.4`, no `latest`, coherente con backlog 110). Cliente de servidor (`lib/supabase/server.ts`, Server Components/Actions) y cliente de middleware (`lib/supabase/middleware.ts`, refresca el JWT en cada request). `middleware.ts` (Fase 3) extendido con una rama nueva exclusiva para `/admin/*` — la lógica de locale para el resto del sitio **no se tocó**.
- **Arquitectura**: `/admin` vive fuera del árbol `[locale]` (herramienta interna de un solo idioma, con su propio `<html>/<body>` en `app/admin/layout.tsx`, ya que no hay un `app/layout.tsx` raíz compartido con el shell público).
- **Login/logout reales**: `/admin/login` (Server Action `signIn`, `signInWithPassword`), logout (`signOut`). Sin self-signup — cuentas se provisionan vía Admin API.
- **Ruta protegida**: `app/admin/(protected)/layout.tsx` — sin sesión → redirect a `/admin/login` (verificado en navegador); con sesión pero sin rol `admin`/`analyst`/`super_admin` en ningún site → "Access denied" explícito, nunca un loop.
- **706 (Executive, primer módulo real)**: `/admin` muestra Revenue, Sessions, RPS, R1K, Revenue mix — con el cliente de **sesión** del usuario (RLS real aplicada), no `service_role`. Con cero afiliados conectados y tráfico real mínimo, la mayoría de estos números son honestamente `$0`/`0`.
- **Cuenta super_admin real** creada para el propietario funcional (`jcpenalo@gmail.com`) vía Admin API — el agente generó y asignó el rol, pero **nunca vio ni eligió la contraseña**: se generó un link de recuperación real para que el propietario funcional establezca su propia contraseña en `/admin/reset-password` (página nueva, cliente, detecta el token del link y llama `updateUser({password})`).

## Hallazgo real durante la verificación (no se ocultó, se corrigió)

El primer intento del test automatizado (`supabase/tests/admin_auth.test.mjs`) falló: una sesión real autenticada con rol `super_admin` no podía leer `revenue_events` — `permission denied for table revenue_events` (código Postgres `42501`). La policy RLS `revenue_events_super_admin_select` (Fase 5) era correcta, pero el `GRANT SELECT` de tabla a `authenticated` **nunca se había agregado** — a diferencia de `roe_scores` (misma migración de Fase 5, sí lo tiene). Postgres deniega en la capa de GRANT antes de evaluar RLS, así que la policy era inalcanzable. Invisible hasta ahora porque hasta esta sesión nunca existió una sesión `authenticated` real consultando esa tabla (todo el desarrollo previo usó `service_role` o `anon`). Corregido con `20260811120000_grant_authenticated_revenue_events.sql`, aplicado al proyecto real, re-verificado: **10/10 tests pasan**.

Este hallazgo es evidencia concreta de por qué backlog 411 (revisión sistemática de `GRANT`/`REVOKE EXECUTE` de Fases 2/4) sigue siendo relevante — el mismo patrón de "GRANT ausente, invisible sin una sesión real" puede repetirse en otras tablas no probadas todavía con `authenticated`.

## Limitación real conocida, documentada explícitamente

`AnalyticsBeacon` (Fase 7) emite `page_view` con `site_id = null` (decisión deliberada de esa fase). Consecuencia: un `analyst`/`admin` *site-scoped* (no `super_admin`) no puede leer ningún `analytics_events` todavía — la policy exige `site_id is not null`. El dashboard Executive de esta sesión es, hoy, solo plenamente utilizable por `super_admin`. Se muestra un aviso explícito en la UI cuando el usuario logueado es site-scoped en vez de dejar que los números lean como "cero tráfico" sin explicación.

## Verificación

- `typecheck`/`lint` en verde en todo el monorepo.
- `supabase/tests/admin_auth.test.mjs`: **10/10** contra el proyecto real — provisión vía Admin API, RLS de `revenue_events` (denegado sin rol, permitido con `super_admin` usando el propio token de sesión), `user_roles_self_read`, flujo completo de recovery link → `updateUser` → login con la nueva contraseña. **Nunca se logueó manualmente vía UI con credenciales reales** — todo verificado con cuentas de prueba descartables creadas y borradas dentro del test, mismo patrón que `deal_expiration.test.mjs`/`analytics_events.test.mjs`.
- Verificado en navegador (sin credenciales): `/admin` sin sesión redirige correctamente a `/admin/login`.
- Migración `20260811100000` (analytics, Fase 7) y `20260811120000` (este fix) aplicadas al proyecto real por el propietario funcional — el agente fue bloqueado por el clasificador de permisos en ambos intentos de `supabase db push --linked` de esta sesión, mismo patrón que Fases 6C/7.

## Backlog resultante

- **410** (nuevo): resolver `site_id` en `analytics_events` (server-side desde el slug, o cableado desde el cliente) para que `analyst`/`admin` de site también puedan usar el dashboard con sus propios datos, no solo `super_admin`.
- **411** (ya existía): revisión sistemática de GRANT en Fases 2/4 — reforzado por el hallazgo real de esta sesión en `revenue_events` (Fase 5).
- **412** (nuevo): módulos Ads/Affiliate/Products/Content/Acquisition/Users/Operations del dashboard (`KPI_TREE.md` §5) — ahora desbloqueados, quedan para sesiones futuras.
- **413** (nuevo): UI de gestión de roles (asignar/revocar admin/analyst a otros usuarios) — hoy sigue siendo vía `service_role` directo.
- Backlog 407 (migración `middleware.ts`→`proxy.ts`) sigue diferido, sin relación con este trabajo.
- Backlog 204 (route guards de usuario final, no admin) sigue sin resolver — este trabajo resolvió el prerrequisito de sesión, pero no construyó guards para `/user`.
