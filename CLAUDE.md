# CLAUDE.md — memoria de proyecto mínima (Claude Code)

Este archivo es breve a propósito. No es una copia del blueprint. Fuente de verdad completa: `docs/PROJECT_BLUEPRINT.md` y los documentos que enlaza.

## Estado actual del proyecto

**Fase 0 (Charter & Research Lock) en curso.** No hay código de producto todavía. No inicies bootstrap técnico (Fase 1) hasta que Fase 0 esté marcada CLOSED en `docs/MASTER_BACKLOG.md`.

## Project guardrails

- Nunca trabajes "todo el blueprint a la vez" — una fase a la vez, con scope e IDs de `docs/MASTER_BACKLOG.md`.
- No eres tu propio auditor: todo cambio de una fase requiere revisión del otro agente (Codex ↔ Claude Code) antes de cerrar.
- No hagas merge a `main` ni lo edites directamente.
- No inventes arquitectura fuera de `docs/PROJECT_BLUEPRINT.md` sin crear un ADR nuevo en `docs/DECISIONS.md`.
- Nunca guardes secretos (API keys, tokens) en el repo, en logs o en el bundle de cliente.
- Nombre comercial actual: **Decidero** — provisional (ADR-009), puede cambiar. Nunca lo hardcodees disperso en UI/SEO/seeds/nombres de paquete; debe vivir en un único punto de configuración de branding (tarea 108 del backlog) para soportar un rename sin fricción.

## Comandos

- `npm install` (raíz) — instala todo el monorepo (workspaces npm).
- `npm run dev` — arranca `apps/web` en local.
- `npm run typecheck` / `npm run lint` / `npm run build` — corren en todos los workspaces (`--if-present`).
- `unit` / `integration` / `e2e` / `DB test` — se agregan cuando exista código real que probar (Fase 2+).

**Nota**: `apps/web/AGENTS.md` y `apps/web/CLAUDE.md` son generados automáticamente por `next dev`/`next build` (Next.js 16+) — son la guía de la API de Next.js para esa instalación local, **no** son este archivo ni tienen relación con las reglas del proyecto. Están en `.gitignore`. Si trabajas dentro de `apps/web`, léelos también (documentan breaking changes de Next.js 16 relevantes para no escribir código con APIs obsoletas).

## Fuente de verdad (rutas exactas)

- `docs/PROJECT_BLUEPRINT.md` — resumen operativo completo
- `docs/PROJECT_CHARTER.md` — propósito, scope, verticales
- `docs/MONETIZATION_POLICY.md` — reglas de ads/affiliate/leads/sponsored
- `docs/CONTENT_POLICY.md` — reglas editoriales y de freshness
- `docs/KPI_TREE.md` — KPIs y gates económicos
- `docs/MASTER_BACKLOG.md` — backlog con IDs, nunca reutilizar IDs
- `docs/DECISIONS.md` — ADRs, append-only
- `docs/phases/` — reportes de cierre por fase (`[FASE]_REPORT.md`)
- `docs/audits/` — hallazgos de auditoría por fase

## Reglas de datos (aplican desde Fase 2)

- RLS obligatorio en Supabase/Postgres — nunca solo ocultar UI.
- Todo registro monetizable requiere `site_id`/`niche_id`.
- Todo precio/comisión/claim requiere `source` + `checked_at` + `confidence/status`.
- No sobrescribir históricos: series temporales, no updates destructivos.
- Eventos analíticos requieren `event_id` idempotente.

## Quality

- Tests obligatorios antes de cerrar cualquier fase (unit/integration/E2E según aplique).
- Accesibilidad WCAG AA baseline.
- Sin fallos ocultos: si algo no pasa, se reporta, no se oculta.

## Reglas de monetización (firewall editorial)

- La comisión de afiliado nunca determina el ranking editorial (Quality Score ≠ Monetization Score).
- Disclosure de afiliación visible; Sponsored siempre separado y etiquetado.
- Sin auto-publicación de contenido monetizado sin revisión humana (ADR-005).
- Detalle completo en `docs/MONETIZATION_POLICY.md`.

## Definition of Done (por fase)

Tests + `PHASE_REPORT.md` + auditoría de agentes especializados + actualización de `MASTER_BACKLOG.md`/`DECISIONS.md`/`CHANGELOG.md` + PR con checks verdes. Protocolo completo: `docs/PROJECT_BLUEPRINT.md` §9.
