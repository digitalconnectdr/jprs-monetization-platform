# PHASE_REPORT — Fase 2: Data Core, Auth & RBAC

Builder: Claude Code (esta sesión). Fecha: 2026-08-08. **Estado: CLOSED.**

Scope y criterios de aceptación: `docs/phases/P2.md`.

## Qué se implementó

- **Migraciones** (`supabase/migrations/`): `properties_domain` (niches, sites, categories, site_settings), `identity_domain` (roles, profiles, user_roles con scope por `site_id`, user_preferences, trigger `handle_new_user`, helpers `has_role`/`is_admin_for_site`/`is_admin_for_niche`, trigger `enforce_role_scope`), `catalog_minimal` (vendors, products — shell, detalle completo en Fase 4), `grant_service_role_access` (fix post-merge, ver abajo).
- RLS habilitado en las 10 tablas desde su creación, con `GRANT` explícito a `anon`/`authenticated`/`service_role` (el proyecto tiene "Automatically expose new tables" desactivado desde Fase 1).
- `supabase/seed.sql`: 6 roles, 3 niches (`active`), 3 sites (`draft`, 1 por niche) — idempotente.
- `docs/DATA_DICTIONARY.md`: documentación completa del schema.
- `supabase/tests/rls_access.test.mjs`: 18 tests de acceso positivo/negativo.

## PRs y auditorías

| PR | Contenido | Auditoría | Veredicto |
|---|---|---|---|
| [#4](https://github.com/digitalconnectdr/jprs-monetization-platform/pull/4) | Schema completo de Fase 2 | `docs/audits/P2_AUDIT.md` (F-01 a F-06) | GO tras corregir 1 High + 3 Medium + 2 Low |
| [#5](https://github.com/digitalconnectdr/jprs-monetization-platform/pull/5) | Fix post-merge: GRANT a `service_role` (F-07, F-08) | Auditoría acotada adjunta a `docs/audits/P2_AUDIT.md` | GO, sin hallazgos |

Ambos PRs llevaron auditoría de agente independiente adjunta antes de mergear, por ser obligatorio según ADR-011 (PRs que tocan Auth/RBAC/RLS).

## Verificación empírica final

`node supabase/tests/rls_access.test.mjs` corrido contra el proyecto Supabase real (`jprs-monetization-platform`) después de aplicar todas las migraciones (incluida la de PR #5): **18/18 tests pasan**. Cleanup verificado sin datos huérfanos (0 usuarios, 0 `user_roles`, 0 `categories` de prueba tras la corrida).

Cubre los 3 criterios de aceptación de `docs/phases/P2.md`:
- [x] Usuario normal no puede leer/escribir datos admin — probado explícitamente (niches, user_roles, auto-escalamiento).
- [x] Admin scope funciona por property — probado explícitamente (escritura permitida en su site, bloqueada en otro site/niche).
- [x] Todas las tablas sensibles tienen RLS explícito — 10/10 tablas con RLS habilitado y policies verificadas.

## Decisiones tomadas durante la fase

- **ADR-012**: corrige ADR-010 — Database Branching requiere plan Pro (no disponible en FREE); migraciones se aplican directo al proyecto único post-merge.
- **ADR-011, revisión al inicio de Fase 2**: se cumplió el disparador de revisión; sin cambios (sigue una sola cuenta con acceso, se mantiene el control de compensación).

## Hallazgo de proceso relevante para fases futuras

El hallazgo F-07 (GRANT faltante a `service_role`) solo se detectó al ejecutar los tests contra el proyecto real por primera vez — ninguna revisión de código (Builder o auditor independiente) lo había detectado, porque el efecto de "Automatically expose new tables" sobre `service_role` no es obvio leyendo SQL estático. Esto confirma que, incluso sin preview DB (ADR-012), la fase no puede darse por cerrada sin al menos una corrida real contra el proyecto — la revisión de código sola no es suficiente evidencia.

## Riesgos y deuda conocida (heredada a Fase 3+)

- `GRANT` a `service_role` es explícito por tabla, no vía `ALTER DEFAULT PRIVILEGES` — Fase 3+ debe repetir el patrón o resolverlo a nivel de proyecto (ver `docs/DATA_DICTIONARY.md`).
- `rls_access.test.mjs` no corre en CI (requiere secrets de Supabase en GitHub Actions, fuera de scope de Fase 2).
- `user_roles` solo lo escribe `super_admin`; delegar a `admin` de property es decisión futura explícita (ver `docs/DATA_DICTIONARY.md`).
- Backlog 204 (Admin/User route guards) se difiere a Fase 3, porque requiere que existan rutas reales de Next.js (`apps/web`) contra las cuales aplicar los guards — no tiene sentido antes de que exista UI.
