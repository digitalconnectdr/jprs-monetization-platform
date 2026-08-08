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
| 6A | Vertical 1: Software & AI | NOT STARTED | — |
| 6B | Vertical 2: Travel | NOT STARTED | — |
| 6C | Vertical 3: Consumer Tech | NOT STARTED | — |
| 7 | Admin Analytics & ROE v1 | NOT STARTED | — |
| 8 | Growth/Search/Distribution | NOT STARTED | — |
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

## Fase 5 — cerrada 2026-08-08

Completado: 501, 502, 503, 504, 505, 506, 507. Dominios `affiliate` (programs/terms/offers/links/clicks), `monetization` (ad_slots/rules/roe_scores/sponsored_campaigns/placements), `leads` (forms/submissions/routes/revenue), `revenue_events` + import.

**Auditoría de cierre obligatoria (ADR-011 A3 + matriz de independencia A7)**: veredicto inicial **GO CON CONDICIONES** (`docs/audits/P5_AUDIT.md`) — 1 hallazgo High (F-01: dos funciones `SECURITY DEFINER` nuevas quedaron llamables sin sesión por un `GRANT`/`REVOKE` incompleto, una explotable de forma real) y 1 Low (F-02: `CHECK` de `monetization_rules` evadible por variantes de mayúsculas/espacios). Como las migraciones ya estaban aplicadas al único proyecto real (ADR-012), F-01 quedaba explotable en producción — corregido de inmediato (`revoke execute ... from public`, vocabulario fijo para `allowed_layers`). Verificado con 45/45 tests contra el proyecto real. Veredicto final: **GO**.

**Bug real encontrado y corregido durante el desarrollo** (antes de la auditoría): policies que unían `sites` directamente fallaban para `editor` en sites `draft` — corregido con funciones `SECURITY DEFINER` (`has_role_in_niche`, `site_niche_id`), documentado como regla general en `docs/DATA_DICTIONARY.md`.

**Deferred, sin fase fija**: backlog 411 (revisión sistemática de `GRANT`/`REVOKE EXECUTE` en funciones `SECURITY DEFINER` de Fases 2/4). 204/409 (route guards/wiring de auth) siguen sin resolver.
