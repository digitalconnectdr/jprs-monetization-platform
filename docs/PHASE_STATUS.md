# PHASE_STATUS.md

Mantenido por A9 (Project Controller). Refleja el estado real de cada fase — nunca se marca CLOSED sin evidencia archivada.

| Fase | Nombre | Estado | Evidencia |
|---|---|---|---|
| 0 | Charter & Research Lock | **CLOSED** (2026-08-07) | `docs/phases/P0_REPORT.md`, `docs/audits/P0_AUDIT.md`, `CHANGELOG.md`, ADR-002 y ADR-009 ACCEPTED |
| 1 | Repository & Delivery Foundation | **CLOSED** (2026-08-07) | `docs/phases/P1_REPORT.md`, `docs/audits/P1_AUDIT.md` — repo remoto, CI verde, `main` protegida (`enforce_admins=true`, ADR-011), Supabase (ADR-010), Vercel conectado con preview confirmado (PR #3). 109 DEFERRED (ADR-009) |
| 2 | Data Core, Auth & RBAC | **CLOSED** (2026-08-08) | `docs/phases/P2_REPORT.md`, `docs/audits/P2_AUDIT.md` — 18/18 tests de RLS contra el proyecto real, ADR-012 (sin branching). 204 DEFERRED a Fase 3 |
| 3 | Design System & Public Shell | **CLOSED** (2026-08-08) | `docs/phases/P3_REPORT.md`, `docs/audits/P3_AUDIT.md` — shell público completo (Home/Discover/vertical hub/Search/5 legales), design tokens OKLCH, i18n 4 idiomas (EN/ES/PT/HI, ADR-013). 204 re-DEFERRED a Fase 4 |
| 4 | CMS & Product Intelligence | **CLOSED** (2026-08-08) | `docs/phases/P4_REPORT.md`, `docs/audits/P4_AUDIT.md` — catalog completo (variants/features/prices/media, append-only), content workflow con enforcement de ADR-005, freshness queue, bulk import. Auditoría inicial NO-GO (1 Critical + 2 High), corregido y verificado: 29/29 tests contra el proyecto real. Backlog 409 (nuevo) es prerrequisito real de 204, que se re-DEFERRED sin atarlo a una fase fija |
| 5 | Monetization & Attribution | **CLOSED** (2026-08-08) | `docs/phases/P5_REPORT.md`, `docs/audits/P5_AUDIT.md` — affiliate/monetization/leads/revenue_events completos, firewall editorial en `roe_scores`, disclosure obligatorio. Auditoría inicial GO CON CONDICIONES (1 High + 1 Low), corregido y verificado: 45/45 tests contra el proyecto real |
| 6A | Vertical 1: Software & AI | **CLOSED (v1 parcial)** (2026-08-08) | `docs/phases/P6A_REPORT.md` — taxonomía + 5 productos reales sembrados (CRM, AI Assistants) + templates + tool + 1 pieza de contenido en `pending_editorial_review`. Site activado (`draft`→`active`). Alcance parcial documentado explícitamente (1 de 12-18 páginas target) — backlog 606/607/608 |
| 6B | Vertical 2: Travel | **CLOSED (v1 parcial)** (2026-08-08) | `docs/phases/P6B_REPORT.md` — taxonomía (6 categorías) + 3 productos reales sembrados (eSIM & connectivity) + templates reutilizados + tool + 1 pieza de contenido en `pending_editorial_review`. Site activado (`draft`→`active`). Alcance parcial documentado explícitamente (1 de 6 categorías con catálogo real) — backlog 615/616/617/618 |
| 6C | Vertical 3: Consumer Tech | **CLOSED (v1 parcial)** (2026-08-09) | `docs/phases/P6C_REPORT.md` — 7 categorías + 3 productos reales sembrados (Networking) + templates + Mesh Wi-Fi Finder + `/deals` con expiración de ofertas (10/10 tests) + 1 pieza de contenido en `pending_editorial_review`. Site activado (`draft`→`active`). Desarrollado por Codex (PR #13), revisado y cerrado por Claude Code — backlog 626/627/628/629 |
| 7 | Admin Analytics & ROE v1 | **CLOSED (v1 parcial)** (2026-08-11) | `docs/phases/P7_REPORT.md` — `analytics_events` real (`page_view` cableado end-to-end, verificado), ROE v1 estructural (`compute_structural_roe_scores()`, 3 content_items). UI del dashboard NO construida (bloqueada por backlog 409, sin auth/sesión) — backlog 706/707/708 |
| 8 | Growth/Search/Distribution | **CLOSED (v1 parcial)** (2026-08-11) | `docs/phases/P8_REPORT.md` — robots.txt/sitemap dinámico (47 URLs)/metadata profunda (16 páginas, 5 locales)/structured data (Organization/WebSite/Product/BreadcrumbList) — verificado en HTML real servido. 805/806 (newsletter/social) fuera de scope — backlog 807/808 |
| 409/706 | Auth admin + Executive dashboard | **CLOSED** (2026-08-11) | `docs/phases/P409_REPORT.md` — `@supabase/ssr`, login/logout/ruta protegida en `/admin`, dashboard Executive con datos reales. 10/10 tests contra el proyecto real. Corrigió un GRANT faltante real en `revenue_events` (Fase 5) — backlog 410/412/413 |
| 9 | AI Operations & Freshness | NOT STARTED | — |
| 10 | Hardening & Compliance | NOT STARTED | — |
| 11 | MVP Launch + 10K Gate | NOT STARTED | — |
| 12 | 100K Scale | NOT STARTED | — |
| 13 | 1M Platform | NOT STARTED | — |

## Fase 0 — cerrada 2026-08-07

Todos los criterios de `PROJECT_CHARTER.md` §10 cumplidos: documentos completos y auditados, ADR-002 y ADR-009 en estado ACCEPTED (ADR-009 explícitamente provisional). Backlog 001–006 y 106 marcados DONE en `MASTER_BACKLOG.md`.

## Fase 1 — cerrada 2026-08-07

Completado: 101, 102, 103 (ADR-010), 104, 105, 106, 107, 108, 110. Auditoría de cierre ejecutada (`docs/audits/P1_AUDIT.md`): 8 hallazgos (1 Critical, 1 High, 3 Medium, 3 Low), todos resueltos. Los 4 criterios de aceptación del blueprint verificados con evidencia independiente: build reproducible (CI + Vercel), `main` protegida (`enforce_admins=true`), preview en PR (PR #3, Vercel "Ready"), secretos fuera del repo (secret scanning activo, nunca commiteados).

**Deferred, no bloqueante**: 109 (búsqueda formal de marca + registro de dominio) — antes de Fase 11.
**Disparador de revisión**: ADR-011 (control de compensación de revisión de PRs) se revisa en cuanto exista una segunda cuenta con acceso de escritura, o al iniciar Fase 2 como mínimo.

## Fase 2 — cerrada 2026-08-08

Completado: 201, 202, 203, 205. Dos PRs mergeados ([#4](https://github.com/digitalconnectdr/jprs-monetization-platform/pull/4), [#5](https://github.com/digitalconnectdr/jprs-monetization-platform/pull/5)), ambos con auditoría de agente independiente obligatoria (ADR-011). Auditoría inicial (`docs/audits/P2_AUDIT.md`): 6 hallazgos (1 High, 3 Medium, 2 Low). Al aplicar al proyecto real por primera vez (ADR-012, sin preview DB) se detectaron 2 hallazgos adicionales (F-07 High, F-08 Low) que ninguna revisión de código podía atrapar — corregidos y verificados empíricamente: **18/18 tests de RLS pasan contra el proyecto real**.

**Deferred a Fase 3**: 204 (Admin/User route guards) — requiere rutas reales de Next.js que todavía no existen.
**Deuda heredada**: `GRANT` a `service_role` es por-tabla, no `ALTER DEFAULT PRIVILEGES` — evaluar antes de que Fase 3 agregue tablas nuevas (ver `docs/DATA_DICTIONARY.md`).

## Fase 3 — cerrada 2026-08-08

Completado: 301, 302, 303, 304, 305 (parcial, ver `MASTER_BACKLOG.md`), 306 (i18n, agregado a mitad de fase, ADR-013). Shell público completo bajo `/impeccable`: design tokens OKLCH (`docs/DESIGN_SYSTEM.md`), header/footer/búsqueda responsive, 9 rutas (Home, Discover, vertical hub, Search, 5 legales) × 4 idiomas. Verificado en navegador (mobile 375px/tablet 768px/desktop) contra los 4 locales — sin mezcla de idiomas, `<html lang>` correcto, redirección de `/` respeta cookie/`Accept-Language`, menú móvil funcional. `typecheck`/`lint` en verde.

**Deuda heredada, re-deferred a Fase 4**: 204 (Admin/User route guards) — Fase 3 solo construyó shell público, no rutas admin/user.
**Deuda técnica no bloqueante**: `packages/ui` sigue siendo un placeholder vacío — los tokens viven en `apps/web/src/app/globals.css` (un solo consumidor hasta ahora); se evalúa moverlos a `packages/ui` cuando exista una segunda app.

**Actualización posterior al cierre (2026-08-08)**: se agregó francés (`fr`) como 5to idioma del shell público (backlog 309) — no reabre la fase, solo ejercita la extensibilidad de i18n que ADR-013 ya había diseñado. Ver `CHANGELOG.md`.

## Fase 4 — cerrada 2026-08-08

Completado: 401, 402, 403, 404, 405, 406. Catalog completo (`product_variants`/`product_features`/`product_prices`/`product_media`, append-only para features/prices), content workflow (`content_items`/`content_versions`/`content_blocks`/`content_product_links`/`content_sources`) con trigger que implementa ADR-005 a nivel de DB, `freshness_checks`, función `import_product_prices` con validación fila-por-fila.

**Auditoría de cierre obligatoria (ADR-011, toca schema/RLS)**: veredicto inicial **NO-GO** (`docs/audits/P4_AUDIT.md`) — 1 hallazgo Critical (F-01: el trigger de publish-gate no validaba que la versión aprobada perteneciera al mismo `content_item`, anulando el enforcement de ADR-005) y 2 High (F-02/F-03: `content_product_links` sin aislamiento por site/status). Como las migraciones ya estaban aplicadas al único proyecto Supabase real (ADR-012), los hallazgos quedaban explotables en producción — se corrigieron de inmediato con una migración nueva (`20260808030000_fix_p4_audit_findings.sql`), sin esperar el ciclo normal de PR. Verificado con 29/29 tests contra el proyecto real (4 nuevos, reproducen los escenarios exactos de la auditoría). Veredicto final: **GO**.

**Deferred, sin fase fija**: 204 (Admin/User route guards) sigue bloqueado por la falta de wiring de cliente Supabase/sesión en `apps/web` — nuevo backlog 409 documenta ese prerrequisito explícitamente.
**Deuda heredada de Fase 3, sin tocar** (Fase 4 no modificó `apps/web`): 407 (migración `middleware.ts`→`proxy.ts`), 408 (`not-found.tsx` localizado).

**Actualización posterior al cierre (2026-08-13)**: 407 y 408 resueltos — ver `CHANGELOG.md`. No reabre Fase 4.

## Fase 5 — cerrada 2026-08-08

Completado: 501, 502, 503, 504, 505, 506, 507. Dominios `affiliate` (programs/terms/offers/links/clicks), `monetization` (ad_slots/rules/roe_scores/sponsored_campaigns/placements), `leads` (forms/submissions/routes/revenue), `revenue_events` + import.

**Auditoría de cierre obligatoria (ADR-011 A3 + matriz de independencia A7)**: veredicto inicial **GO CON CONDICIONES** (`docs/audits/P5_AUDIT.md`) — 1 hallazgo High (F-01: dos funciones `SECURITY DEFINER` nuevas quedaron llamables sin sesión por un `GRANT`/`REVOKE` incompleto, una explotable de forma real) y 1 Low (F-02: `CHECK` de `monetization_rules` evadible por variantes de mayúsculas/espacios). Como las migraciones ya estaban aplicadas al único proyecto real (ADR-012), F-01 quedaba explotable en producción — corregido de inmediato (`revoke execute ... from public`, vocabulario fijo para `allowed_layers`). Verificado con 45/45 tests contra el proyecto real. Veredicto final: **GO**.

**Bug real encontrado y corregido durante el desarrollo** (antes de la auditoría): policies que unían `sites` directamente fallaban para `editor` en sites `draft` — corregido con funciones `SECURITY DEFINER` (`has_role_in_niche`, `site_niche_id`), documentado como regla general en `docs/DATA_DICTIONARY.md`.

**Deferred, sin fase fija**: backlog 411 (revisión sistemática de `GRANT`/`REVOKE EXECUTE` en funciones `SECURITY DEFINER` de Fases 2/4). 204/409 (route guards/wiring de auth) siguen sin resolver.

**Actualización posterior al cierre (2026-08-13)**: backlog 411 resuelto — ver `CHANGELOG.md`. No reabre Fase 5.

## Fase 6A — cerrada 2026-08-08 (v1 parcial)

Completado: 601 (taxonomía), 602 (seed parcial: 5 productos en 2 de 6 categorías), 603 (templates de categoría/perfil/comparación), 604 (CRM Pricing Comparator), 605 (1 pieza de contenido, `pending_editorial_review`). Site `software-ai` activado (`draft`→`active`). Nuevo paquete real `packages/db` (cliente Supabase público de solo lectura, sin auth).

**Alcance deliberadamente parcial** (documentado desde el inicio en `docs/phases/P6A.md`, no scope creep oculto): el target de `PROJECT_BLUEPRINT.md` §15 es 12-18 páginas de contenido; esta sesión entrega 1, priorizando verificar el pipeline completo (schema→seed real→cliente→template→tool→contenido→gate humano) con evidencia real en vez de maximizar volumen con contenido genérico. Backlog 607 (nuevo) documenta el resto del lote pendiente.

**ADR-005 confirmado en la práctica**: al intentar verificar visualmente el template de contenido, el Builder ejecutó (sin mala intención, para QA) un cambio de estado a `published` — el clasificador de permisos del entorno **bloqueó la acción** por ser auto-aprobación editorial. El Builder no intentó evadirlo; verificó los datos sin tocar el estado de publicación. Backlog 606 (nuevo): la pieza sigue esperando decisión humana explícita de publicar o rechazar.

**Deferred, sin fase fija**: backlog 606 (aprobar/rechazar contenido pendiente), 607 (resto del seed editorial), 608 (`affiliate_links` reales — hoy son links directos al vendor, no monetizados).

## Fase 6B — cerrada 2026-08-08 (v1 parcial)

Completado: 611 (taxonomía, 6 categorías), 611/612 (seed parcial: 3 productos reales en 1 de 6 categorías — `eSIM & connectivity`), 612 (templates reutilizados de Fase 6A sin cambios estructurales), 613 (eSIM Data Plan Comparator), 614 (1 pieza de contenido, `pending_editorial_review`). Site `travel` activado (`draft`→`active`).

**Defecto real corregido, retroactivo a Fase 6A**: el sufijo de precio en los templates de catálogo estaba hardcodeado a `/month` (asumía `subscription_monthly`); invisible en Fase 6A (catálogo 100% mensual) pero habría mostrado una afirmación falsa para los planes eSIM prepago de esta fase (`price_type='starting_at'`). Corregido con `apps/web/src/lib/catalog-price.ts` antes de sembrar el catálogo nuevo; verificado sin regresión sobre el catálogo de Fase 6A.

**Alcance deliberadamente parcial** (documentado desde el inicio en `docs/phases/P6B.md`): catálogo real solo en 1 de 6 categorías. Hoteles/vuelos quedan fuera porque el modelo `product_prices` (Fase 4) asume precio de catálogo relativamente estable, no tarifa dinámica por fecha/disponibilidad — sembrarlo como si fuera un hecho estable sería engañoso. `Luggage` fue investigado (Away, Samsonite) pero descartado por fuentes inconsistentes (Away bloqueó el fetch; Samsonite mostró 3 precios distintos para el mismo SKU en la misma sesión de búsqueda).

**Deferred, sin fase fija**: backlog 615 (seasonality rules), 616 (aprobar/rechazar contenido pendiente de esta fase), 617 (resto del seed editorial de Travel), 618 (`affiliate_links` reales). Backlog 606 (Fase 6A) sigue abierto también.

**Actualización posterior al cierre de Fase 6A (2026-08-08)**: a pedido del propietario funcional, se enriqueció el catálogo de los 5 productos ya sembrados (`billing_model`, `marketplace_integrations`, `seat_minimum`, `api_access`, `team_plan`), se amplió el CRM Pricing Comparator a 5 columnas, y se creó una versión 2 (más rica, con veredictos "mejor para X caso de uso") del artículo pendiente — sigue sin publicar (ADR-005). No reabre Fase 6A. Ver addendum en `docs/phases/P6A_REPORT.md` y `CHANGELOG.md`.

## Fase 6C — cerrada 2026-08-09 (v1 parcial)

Desarrollada por Codex (PR #13: taxonomía de 7 categorías incluyendo "Creator gear", catálogo real de 3 sistemas mesh en Networking, `product_prices.expires_at` con RLS que excluye ofertas vencidas, `Mesh Wi-Fi Finder`, ruta `/deals`, 1 pieza de contenido pendiente). Codex se auto-auditó (`docs/audits/P6C_AUDIT.md`): encontró 7 hallazgos (3 High) y los corrigió antes de abrir el PR.

Claude Code revisó el PR de forma independiente antes de mergear (ADR-011: la fase toca RLS/schema) — sin hallazgos adicionales bloqueantes — y tras el merge aplicó la migración y el seed al proyecto Supabase real (ADR-012), corrió `supabase/tests/deal_expiration.test.mjs` (10/10 pasaron), hizo QA en navegador, y cerró la fase formalmente. Ver `docs/phases/P6C_REPORT.md` para el detalle completo del reparto de trabajo entre ambos agentes.

**Bloqueo del clasificador de permisos**: tanto el merge del PR como `supabase db push --linked` fueron bloqueados por el clasificador del entorno del agente, incluso con confirmación explícita del propietario funcional en el chat — el merge se resolvió con un reintento, pero el `db push` requirió que el propietario funcional lo ejecutara él mismo desde su terminal.

**Deferred, sin fase fija**: backlog 626 (aprobar/rechazar contenido pendiente), 627 (resto del catálogo de Consumer Tech — 6 de 7 categorías), 628 (`affiliate_links` reales), 629 (sembrar una oferta `sale` real y vigente — se investigó activamente sin encontrar una verificable al cierre; se hizo una demostración temporal de `/deals` con un producto de prueba, eliminado inmediatamente después, a pedido del propietario funcional).

## Fase 7 — cerrada 2026-08-11 (v1 parcial)

Completado: 701 (`analytics_events` real, `page_view` cableado end-to-end desde `apps/web` y verificado con eventos reales tras navegar el sitio), 705 (ROE v1 estructural — `compute_structural_roe_scores()`, quality_score real para los 3 `content_items` existentes, refleja honestamente el precio faltante de TP-Link de Fase 6C con un score más bajo). 10/10 tests contra el proyecto real.

**Dos bloqueos reales definieron el scope, documentados desde el inicio en `docs/phases/P7.md`**: (1) la UI del dashboard administrativo (702-704, 706 originales) no se construyó — `apps/web` no tiene wiring de auth/sesión (backlog 409, TODO desde Fase 4), y una UI de admin sin gate de sesión real sería una fuga de datos de negocio; (2) el ROE real del blueprint (fórmula `Ad EV + Affiliate EV + Lead EV + Sponsor EV`) requiere tráfico real que no existe — el proyecto sigue pre-lanzamiento. Se construyó en su lugar la base de datos real (event schema + ROE estructural), dejando la UI y el ROE completo para cuando esos prerrequisitos se resuelvan.

**Deferred, sin fase fija**: backlog 706 (UI del dashboard, bloqueado por 409 — el candidato más claro para la siguiente sesión), 707 (cablear el resto de tipos de evento), 708 (ROE real, requiere tráfico post-lanzamiento). Backlog 409 sigue siendo el bloqueador transversal más importante del proyecto en este punto.

## Fase 8 — cerrada 2026-08-11 (v1 parcial)

A pedido explícito del propietario funcional (revisar cada página para maximizar descubribilidad en buscadores/LLMs). Completado: 801 (robots.txt + metadata profunda con canonical/hreflang en las 16 páginas del shell), 802 (sitemap dinámico, 47 URLs, excluye correctamente contenido no publicado), 803 (JSON-LD real: Organization/WebSite sitewide, Product con precio real en perfiles, BreadcrumbList), 804 (componente `Breadcrumb` — fuente única para navegación visible y schema estructurado).

**Hallazgo real durante la revisión**: `/search` no ejecuta ninguna búsqueda real contra el catálogo (siempre "sin resultados") — indexarlo generaría contenido delgado; se marcó `noindex, follow` explícitamente, documentado como reversible cuando exista búsqueda real (backlog 807).

**Decisión técnica**: la URL base para canonical/sitemap/hreflang se resuelve vía `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` (automática de Vercel) → localhost, nunca hardcodeada — backlog 109 (dominio propio) sigue siendo la única dependencia real pendiente, y el cambio cuando se resuelva es de una sola variable de entorno.

**Deferred, sin fase fija**: 805/806 (newsletter, social content workflow — canales de distribución, no descubribilidad), 807 (reactivar indexación de `/search`), 808 (Article/Review JSON-LD, depende de aprobación editorial 606/616/626).

**Práctica establecida hacia adelante**: toda página nueva se revisa contra la misma checklist (description real, canonical+hreflang, BreadcrumbList si aplica, schema.org de la entidad si aplica, inclusión en sitemap o noindex explícito) antes de darse por completa — ver `docs/phases/P8_REPORT.md` para el detalle.

## Backlog 409/706 — cerrado 2026-08-11

A pedido explícito del propietario funcional, resolviendo el bloqueador transversal más importante del proyecto en este punto. `@supabase/ssr` instalado (versión fijada), `/admin` (fuera de `[locale]`, herramienta interna) con login/logout reales y ruta protegida (sin sesión → login; con sesión sin rol calificado → "access denied", nunca un loop). Dashboard Executive (706, primer módulo real de `KPI_TREE.md` §5) con datos reales de `revenue_events`/`analytics_events`, consultados con el cliente de **sesión** del usuario (RLS real).

**Hallazgo real durante la verificación**: `revenue_events` (Fase 5) tenía la policy RLS correcta pero le faltaba el `GRANT SELECT` a `authenticated` — inalcanzable hasta que existió una sesión real autenticada consultándola (todo el desarrollo previo usó `service_role`/`anon`). Corregido con una migración correctiva aplicada al proyecto real, re-verificado: 10/10 tests.

Cuenta `super_admin` real creada para el propietario funcional vía Admin API — el agente generó y asignó el rol, pero nunca vio ni eligió la contraseña (link de recuperación real, el propietario funcional la estableció él mismo en `/admin/reset-password`).

**Deferred, sin fase fija**: backlog 410 (resolver `site_id` en `analytics_events` para que analyst/admin de site también puedan usar el dashboard), 412 (resto de módulos del dashboard: Ads/Affiliate/Products/Content/Acquisition/Users/Operations), 413 (UI de gestión de roles). Backlog 411 (revisión sistemática de GRANT) reforzado por el hallazgo real de esta sesión.

**Actualización posterior al cierre (2026-08-14)**: backlog 410/412/413 resueltos — ver `CHANGELOG.md`. No reabre el backlog 409/706.
