# PHASE_REPORT — Fase 5: Monetization & Attribution

Builder: Claude Code (esta sesión). Fecha: 2026-08-08. **Estado: CLOSED.**

Scope y criterios de aceptación: `docs/phases/P5.md`.

## Qué se implementó

- **Affiliate** (`20260808040000_affiliate_domain.sql`): `affiliate_programs` (CRUD, trigger `enforce_active_program_requires_terms`), `affiliate_terms`/`affiliate_offers` (append-only, con cross-check de que `product_id` pertenezca al mismo niche que el vendor del programa), `affiliate_links` (CRUD, con cross-check de que `product_id`/`content_item_id` compartan site), `affiliate_clicks` (ledger insert-only vía `record_affiliate_click()`, idempotente por `click_id`).
- **Monetization** (`20260808040010_monetization_domain.sql`): `ad_slots`/`monetization_rules` (con `CHECK` que impide `ads` en páginas prohibidas), `roe_scores` (`super_admin` únicamente, nunca público — firewall editorial), `sponsored_campaigns`/`sponsorship_placements` (admin-only, `disclosure_label` nunca vacío).
- **Leads** (`20260808040020_leads_domain.sql`): `lead_forms`/`lead_submissions` (PII, `super_admin`-only)/`lead_routes`/`lead_revenue`.
- **Revenue events** (`20260808040030_revenue_events_and_import.sql`): ledger append-only + `import_revenue_events()`.
- **Decisión de scope explícita**: datos financieros/PII (`affiliate_clicks`, `lead_submissions`, `lead_revenue`, `revenue_events`, `roe_scores`) restringidos a `super_admin` únicamente — no site-scoped todavía, documentado en `docs/phases/P5.md` con razones concretas (sin dashboard/UI que lo necesite, minimizar superficie de ataque tras los hallazgos de Fase 4).

## Bug real encontrado y corregido durante el desarrollo (antes de la auditoría)

Al testear las policies de `affiliate_programs`/`affiliate_terms`/`affiliate_offers`/`affiliate_links`/`lead_routes`, todas fallaban con "row-level security policy violation" para el rol `editor`, incluso con datos correctos y rol correctamente asignado. Causa raíz: las policies unían `sites` directamente dentro de su `USING`/`WITH CHECK` para resolver el niche de un vendor — esa subconsulta corre con los privilegios del rol que llama (no con bypass), y `editor` no tiene ninguna policy de lectura sobre un site en estado `draft` (solo `admin`/`super_admin` vía `sites_admin_select`, o público si el site está `active`). Corregido con dos funciones `SECURITY DEFINER` nuevas (`has_role_in_niche`, `site_niche_id`), mismo patrón que `is_admin_for_niche` ya usaba desde Fase 2, en `20260808040050_fix_niche_scope_rls.sql`. Documentado en `docs/DATA_DICTIONARY.md` como regla general: nunca hacer `JOIN` directo a una tabla con RLS restrictivo dentro de la policy de otra tabla para resolver un dato derivado.

## Auditoría de cierre y corrección

Toca schema/RLS **y** monetización/afiliados — auditoría obligatoria por ADR-011 (A3) y la matriz de independencia de `PROJECT_BLUEPRINT.md` §10.1 (A7), sin excepción. Veredicto inicial: **GO CON CONDICIONES**.

| ID | Severidad | Resumen |
|---|---|---|
| F-01 | High | Las dos funciones nuevas de la corrección de scope (`site_niche_id`, `has_role_in_niche`) quedaron llamables sin ninguna sesión — Postgres otorga `EXECUTE` a `PUBLIC` por defecto al crear una función, y el `GRANT` explícito a `authenticated`/`service_role` no revocaba eso. `site_niche_id` era explotable de forma real: cualquier visitante podía aprender el `niche_id` de cualquier site, incluyendo sites `draft`. |
| F-02 | Low | El `CHECK` de `monetization_rules` comparaba `'ads'` con igualdad de string exacta — `'Ads'`/`'ADS'`/`' ads'` evadían el bloqueo en páginas prohibidas. |

**Nota operativa**: como en Fase 4, las migraciones ya estaban aplicadas al único proyecto Supabase real (ADR-012) — F-01 quedaba explotable en producción, así que se corrigió de inmediato con una migración nueva (`20260808050000_fix_p5_audit_findings.sql`), sin esperar el ciclo normal de PR.

Corrección: `revoke execute ... from public` sobre ambas funciones (F-01); vocabulario fijo para `allowed_layers` en vez de normalización dentro del `CHECK` (Postgres no permite subqueries en `CHECK constraints` — la normalización propuesta originalmente por el auditor no era aplicable; se usó su recomendación complementaria en su lugar). `monetization_access.test.mjs` se extendió con 4 casos negativos que reproducen ambos hallazgos — **45/45 tests pasan**. Veredicto final: **GO**. Detalle completo en `docs/audits/P5_AUDIT.md`.

## Verificación empírica final

`node supabase/tests/monetization_access.test.mjs` corrido contra el proyecto Supabase real después de aplicar la migración correctiva: **45/45 tests pasan**, incluyendo aislamiento cross-site/cross-niche explícito en cada relación nueva (verificado también por `UPDATE`, no solo `INSERT`, por el auditor), idempotencia de clics bajo concurrencia real y de revenue events con duplicado dentro del mismo lote, trigger de activación de programa, y los 2 hallazgos de la auditoría. Cleanup verificado sin filas huérfanas. `npm run typecheck` (todos los workspaces) limpio — esta fase no tocó `apps/web`.

## Decisiones tomadas durante la fase

No se generó un ADR nuevo — el diseño append-only, el firewall editorial de `roe_scores`, y las reglas de disclosure implementan reglas ya mandatadas por `PROJECT_BLUEPRINT.md` §5/§7 y `MONETIZATION_POLICY.md`, no arquitectura nueva fuera de esos documentos. La decisión de scope (`super_admin`-only para datos financieros/PII) está documentada en `docs/phases/P5.md` como parte del scope de la fase, no como un ADR separado.

## Riesgos y deuda conocida (heredada a Fase 6+)

- **Backlog 411 (nuevo)**: revisión sistemática de `GRANT`/`REVOKE EXECUTE` en funciones `SECURITY DEFINER` de Fases 2/4 — ninguna es explotable de forma independiente hoy según el auditor, pero requiere análisis cuidadoso antes de revocar `PUBLIC` sistemáticamente (riesgo de romper policies de lectura pública que dependan del privilegio implícito).
- **Datos financieros/PII sin acceso site-scoped**: `admin`/`editor` de un site no pueden ver sus propios `affiliate_clicks`/`revenue_events`/`lead_submissions` — decisión explícita de Fase 5 (ver arriba), se amplía cuando Fase 7 (Admin Analytics) construya dashboards reales.
- **Sin UI/endpoint HTTP de tracking real**: `record_affiliate_click`/`import_revenue_events` existen a nivel de base de datos; conectarlos a rutas reales de Next.js espera al mismo wiring de auth que backlog 409/204 (para `import_revenue_events`, que requiere sesión `super_admin`) — `record_affiliate_click` es candidato a una ruta pública temprana en Fase 6, dado que no requiere sesión.
- **`sponsorship_placements`/`sponsored_campaigns`**: sin motor de reglas ROE que decida placement automáticamente — eso es Fase 7 ("ROE v1").
