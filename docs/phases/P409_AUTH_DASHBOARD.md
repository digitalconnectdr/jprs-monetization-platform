# Backlog 409 + 706 — Auth/sesión en `apps/web` + primer módulo del dashboard admin

Fuente: `docs/PROJECT_BLUEPRINT.md` §5.1 (RBAC), `docs/KPI_TREE.md` §5 (dashboard admin). No mapea a un número de fase del blueprint — es la resolución de un backlog transversal (409, prerrequisito real desde Fase 4 de 204 y ahora también de 706), igual que ADR-013 (i18n) o backlog 309 (francés) no fueron "una fase" tampoco. Iniciada 2026-08-11, a pedido explícito del propietario funcional.

## Por qué esto no se había hecho antes (contexto, no repetido aquí)

El backend RBAC/RLS existe desde Fase 2: tabla `roles` (6 roles), `user_roles` con `enforce_role_scope` (super_admin=global, todo lo demás scoped a un site), `has_role()`/`is_admin_for_site()`/`is_admin_for_niche()` (`SECURITY DEFINER`), trigger `handle_new_user` en `auth.users`. Lo que faltaba era 100% frontend: `apps/web` nunca tuvo `@supabase/ssr` instalado, ni login, ni una ruta protegida.

## Decisión de arquitectura: `/admin` fuera del árbol `[locale]`

El shell público (`[locale]/...`) es multi-idioma porque es contenido editorial/comercial dirigido a visitantes de 5 locales distintos (Fase 3, ADR-013). El panel admin es una herramienta interna, de un solo idioma, para el propietario funcional y futuro personal editorial — no tiene sentido de negocio traducirlo, y meterlo bajo `[locale]` lo expondría a la lógica de detección de idioma, al sitemap (Fase 8 ya lo excluye por construcción al no listar `/admin` en `STATIC_SHELL_PATHS`), y a hreflang que no aplica. Vive en `apps/web/src/app/admin/`, ruta independiente.

## Scope real de esta sesión

- **409 (wiring de sesión)**: `@supabase/ssr` instalado; cliente de servidor (`lib/supabase/server.ts`, para Server Components/Actions, cookies vía `next/headers`) y cliente de middleware (`lib/supabase/middleware.ts`, refresca el token en cada request a `/admin/*`). `middleware.ts` existente (locale redirect, Fase 3) se extiende — **nunca se toca su lógica para rutas públicas**, solo se agrega una rama nueva para `/admin/*` que refresca sesión en vez de redirigir por locale. Backlog 407 (migración a `proxy.ts`) sigue diferido por la misma razón que en Fase 3: sin documentación confiable del contrato en este entorno para confirmarlo sin riesgo — no se mezcla con este trabajo.
- **Login/logout reales**: `/admin/login` (email + password, Supabase Auth `signInWithPassword` vía Server Action), logout vía Server Action (`signOut`). Sin registro público — cuentas admin se crean vía Admin API (`service_role`), no self-signup, coherente con que `admin`/`analyst`/`super_admin` no son roles que un visitante deba poder auto-asignarse.
- **Ruta protegida real**: `apps/web/src/app/admin/layout.tsx` — sin sesión → redirect a `/admin/login`; con sesión pero sin rol `admin`/`analyst`/`super_admin` en ningún site → página de "acceso denegado" (nunca un loop de redirect).
- **706 (primer módulo real, Executive)**: `/admin` muestra Revenue total, Sessions, RPS, R1K, Revenue mix por `event_type` — con datos **reales** de `revenue_events`/`analytics_events`, consultados con el cliente autenticado de sesión (RLS real aplicada, no `service_role`, no `anon`). Con cero tráfico real y cero afiliados conectados todavía, la mayoría de estos números son honestamente `$0`/`0` — no se rellena con datos de muestra.
- **Cuenta super_admin real**: creada vía Admin API para el propietario funcional. El agente nunca ve ni elige la contraseña — se genera un link de recuperación/configuración para que el propietario funcional la establezca él mismo.

## Limitación real conocida, documentada explícitamente (no oculta)

`AnalyticsBeacon` (Fase 7) emite `page_view` con `site_id = null` deliberadamente (evitar un roundtrip extra por navegación — `payload.site_slug` alcanza para agrupar). Consecuencia real para este módulo: la policy de lectura de `analytics_events` exige `site_id is not null` para `analyst`/`admin` *site-scoped* — un analyst de un site específico **no puede ver ningún evento todavía**, solo `super_admin` (que no depende de `site_id`). El dashboard Executive de esta sesión es, por lo tanto, utilizable hoy solo por `super_admin`. Backlog nuevo: resolver `site_id` en `analytics_events` (ej. resolviéndolo server-side en `record_analytics_event` a partir de un site slug, o cableándolo desde el cliente) para que `analyst`/`admin` de site también puedan leer sus propios datos.

## Explícitamente fuera de scope

- **407** (migración `middleware.ts`→`proxy.ts`) — sigue diferido, razón ya documentada en Fase 3.
- **204** (route guards para `/user`, cuentas de visitantes) — este trabajo resuelve el prerrequisito (409) pero no construye guards de usuario final, solo de admin.
- **Módulos Ads/Affiliate/Products/Content/Acquisition/Users/Operations del dashboard** (702-704, KPI_TREE.md §5) — quedan para sesiones futuras, ahora sí desbloqueados por este trabajo.
- **Gestión de roles vía UI** (asignar/revocar admin/analyst a otros usuarios desde el panel) — se sigue haciendo vía `service_role` directo, como en toda la sesión hasta ahora; construir esa UI es trabajo nuevo, no wiring de auth.

## Criterios de aceptación

- [x] Login real funcional: sesión persiste entre requests (cookie), logout la invalida.
- [x] `/admin` sin sesión → redirect a `/admin/login`. Con sesión sin rol calificado → "acceso denegado", no loop.
- [x] Dashboard Executive muestra datos reales (no fabricados) de `revenue_events`/`analytics_events`, consultados con el cliente de sesión (RLS real, verificado que sin rol asignado no se puede leer).
- [x] Cuenta super_admin creada para el propietario funcional; el agente nunca vio ni eligió la contraseña.
- [x] Verificado con test automatizado contra el proyecto real (10/10, nunca logueando manualmente con credenciales reales vía UI).
- [x] `typecheck`/`lint` en verde.

**Cerrado 2026-08-11.** Reporte de cierre: `docs/phases/P409_REPORT.md`.
