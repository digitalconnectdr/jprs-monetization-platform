# Fase 7 — Reporte de cierre

Admin Analytics & ROE v1. Scope: `docs/phases/P7.md`. Cerrada 2026-08-11.

## Qué se entregó

- **701 (event schema)**: `analytics_events` (tabla genérica, `event_type` + `event_id` idempotente + `payload jsonb`), cubre los 9 tipos de `KPI_TREE.md` §3. RLS: sin `INSERT` directo (fuerza pasar por `record_analytics_event()`), lectura solo `analyst`/`admin` de su site o `super_admin`.
- **`page_view` cableado end-to-end**: `AnalyticsBeacon` (client component en el layout raíz) emite un evento real en cada navegación del shell público. Verificado con filas reales en la tabla tras navegar `/en/discover`, `/en/software-ai`, `/en/travel`, `/en/consumer-tech/deals` — `payload.site_slug` correcto en cada caso (`null` en rutas sin vertical como `/discover`).
- **705 (ROE v1 estructural)**: `compute_structural_roe_scores()` calculó `quality_score` real para los 3 `content_items` existentes (los 3 artículos `pending_editorial_review` de 6A/6B/6C) — 100.00 para los dos que tienen precio+features completos en todos sus productos vinculados, 83.33 para el de Consumer Tech (refleja honestamente que TP-Link Deco BE63 no tiene precio sembrado, por decisión deliberada de Fase 6C). `monetization_score` queda `null` — no hay señales de afiliados que calcularlo.
- Tests de acceso: 10/10 contra el proyecto real (`supabase/tests/analytics_events.test.mjs`) — idempotencia de `event_id`, aislamiento de lectura entre sites, y que `compute_structural_roe_scores()` solo es ejecutable por `service_role`.

## Los dos bloqueos reales que definieron el scope (documentados desde el inicio en `docs/phases/P7.md`)

1. **No hay UI de dashboard**. `apps/web` no tiene wiring de auth/sesión (backlog 409, TODO desde Fase 4) — construir pantallas de admin sin un gate de sesión real habría sido, en el mejor caso, una promesa falsa de seguridad. Los 8 módulos de `KPI_TREE.md` §5 (Executive, Ads, Affiliate, Products, Content, Acquisition, Users, Operations) quedan sin construir hasta que 409 se resuelva.
2. **No hay ROE real todavía**. La fórmula del blueprint (`Ad EV + Affiliate EV + Lead EV + Sponsor EV`, cada uno derivado de `P(click)`/`P(conversion)` reales) requiere tráfico real — el proyecto está pre-lanzamiento (Fase 11 no ha empezado), cero sesiones de visitante real registradas antes de esta fase. Calcular la fórmula real hoy habría significado inventar probabilidades de conversión — el mismo tipo de dato fabricado que se ha evitado consistentemente en contenido editorial (Luggage en 6B, precio de TP-Link en 6C), aplicado ahora a analytics. Se construyó en su lugar un score estructural honesto, explícitamente etiquetado como no-ROE-real (`rule_version='structural_readiness_v1'`).

## Verificación

- `npm run typecheck` (`apps/web` + `packages/db`) y `npm run lint` en verde.
- Migración `20260811100000_analytics_events.sql` aplicada al proyecto Supabase real — el `supabase db push --linked` fue bloqueado por el clasificador de permisos del agente incluso tras confirmación explícita del propietario funcional; lo ejecutó él mismo desde su terminal (mismo patrón que Fase 6C).
- `supabase/tests/analytics_events.test.mjs`: 10/10 pasaron contra el proyecto real.
- Verificado en navegador: eventos `page_view` reales confirmados vía query directa a `analytics_events` (no solo la función probada de forma aislada) tras navegar 4 rutas distintas del sitio.
- `compute_structural_roe_scores()` ejecutado contra el proyecto real, 3 filas nuevas en `roe_scores` con valores coherentes con el catálogo real ya sembrado.

## Nota técnica: duplicación de eventos en modo desarrollo (no es un bug de producción)

Durante la verificación se observaron pares de filas `page_view` casi idénticas (mismo `session_id`/`path`, `occurred_at` separados por milisegundos) para una misma navegación. Causa: React 19 Strict Mode invoca los efectos dos veces en desarrollo (`next dev`) para detectar side-effects no idempotentes — comportamiento documentado de React, no ocurre en un build de producción. Como cada invocación genera un `event_id` distinto (incluye `Date.now()` + aleatorio), la idempotencia de `event_id` no des-duplica este caso — protege contra reintentos de red del *mismo* evento lógico, no contra que el efecto se dispare dos veces con IDs nuevos cada vez. No se consideró un hallazgo bloqueante (es exclusivo de dev, y el volumen de un dashboard futuro puede filtrar duplicados casi-simultáneos si hiciera falta), pero queda documentado explícitamente en vez de ocultarlo.

## Backlog resultante

- **706** (nuevo): construir la UI del dashboard administrativo (8 módulos de `KPI_TREE.md` §5) — bloqueado por backlog 409 (auth/sesión). Es, con esta fase cerrada, el candidato más claro para la siguiente sesión de desarrollo.
- **707** (nuevo): cablear los 8 tipos de evento restantes en la UI real (`product_impression`, `affiliate_click`, `comparison_add`, `save_product`, `lead_start`/`submit`, `conversion`, `ad_revenue_daily`, `newsletter_signup`) — varios dependen de trabajo que tampoco existe todavía (afiliados reales, cuentas de usuario).
- **708** (nuevo): calcular el ROE real (fórmula completa del blueprint) — requiere tráfico real post-lanzamiento (Fase 11+), no antes.
- Backlog 409 sigue siendo el bloqueador transversal más importante del proyecto en este punto: bloquea 204 (route guards) desde Fase 4, y ahora también 706.
