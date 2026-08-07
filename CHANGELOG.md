# CHANGELOG

Formato: fecha, fase, resumen. Mantenido por A9 (Project Controller) al cierre de cada fase.

## 2026-08-07 — Fase 0 (Charter & Research Lock) — documentación generada y auditada

- Se generó toda la documentación operativa de Fase 0 a partir de `JPRS_Monetization_Intelligence_Platform_Blueprint_v1.docx` (v1.0): `PROJECT_BLUEPRINT.md`, `PROJECT_CHARTER.md`, `MONETIZATION_POLICY.md`, `CONTENT_POLICY.md`, `KPI_TREE.md`, `MASTER_BACKLOG.md`, `DECISIONS.md`, `AGENTS.md`, `CLAUDE.md`, `README.md`.
- ADR-009 aceptado (provisional): nombre comercial **Decidero**, tras screening informal de conflictos de marca sobre 11 candidatos.
- Se añadió guardrail de branding centralizado (backlog 108) para soportar un rename futuro sin fricción.
- Auditoría independiente de Fase 0 ejecutada (`docs/audits/P0_AUDIT.md`): 7 hallazgos (3 High, 2 Medium, 2 Low), todos corregidos. Cambios resultantes: sección "Experiencia pública y diseño" agregada a `PROJECT_BLUEPRINT.md` (faltaba en el resumen original), contenido operativo antes delegado al `.docx` ahora inlineado (tabla de dominios de datos, prioridad ads/affiliate/lead por tipo de página, matriz de independencia de auditores, template de post-mortem), referencias cruzadas corregidas, backlog ID 106 reubicado a Fase P0, ADR-002 agregado como criterio bloqueante de cierre en `PROJECT_CHARTER.md`.
- Estado: documentación lista, **pendiente de aprobación humana del propietario funcional** (incluida confirmación explícita de ADR-002) antes de marcar Fase 0 como CLOSED.

## 2026-08-07 — Fase 0 CLOSED / Fase 1 (Repository & Delivery Foundation) iniciada

- ADR-002 (Next.js + TypeScript) confirmado como ACCEPTED. Fase 0 marcada CLOSED en `docs/PHASE_STATUS.md` y `docs/MASTER_BACKLOG.md`.
- Inicio de Fase 1: bootstrap local del monorepo (git init, workspaces, `apps/web`, `packages/*`, `supabase/` skeleton, templates de `.github/`). Backlog 103/104/105/109 quedan explícitamente fuera del alcance de un agente autónomo — requieren credenciales/cuentas del propietario funcional (Supabase, GitHub remoto, Vercel, registro de marca/dominio).
- `npm install`, `typecheck`, `lint` y `dev` verificados en verde (ver `docs/phases/P1_REPORT.md`). Se corrigió `apps/web/eslint.config.mjs` (usaba el patrón de ESLint de Next.js 15, roto en Next.js 16 tras la eliminación de `next lint`). `next build` (producción) no se pudo confirmar en este entorno por una falla de asignación de memoria reproducible y aparentemente ajena al código (ver detalle y diagnóstico en el reporte de fase) — pendiente de confirmar vía CI o en otra máquina.
- Corregida colisión de nombres: Next.js 16 autogenera `apps/web/AGENTS.md`/`CLAUDE.md` (guía de su propia API) distintos de los `AGENTS.md`/`CLAUDE.md` del proyecto; se agregaron a `.gitignore` y se documentó la distinción.

## 2026-08-07 — Repo remoto, CI confirmado, main protegida

- Repositorio remoto creado por el propietario funcional en `github.com/digitalconnectdr/jprs-monetization-platform`; push inicial hecho usando la sesión de `gh` CLI ya autenticada (sin manejar tokens en la conversación).
- Primer run de CI en GitHub Actions: `conclusion=success` — confirma que la falla de `next build` reportada antes era una restricción de memoria de la máquina local del agente, no un defecto de código. Backlog 101/102 pasan a DONE.
- Branch protection aplicada en `main` (backlog 105, con confirmación explícita del propietario funcional): PR obligatorio, check `build` requerido en verde, rama actualizada, sin force-push ni borrado.
- Quedan pendientes de Fase 1: 103 (Supabase), 104 (Vercel), 109 (marca/dominio) — todas requieren cuentas/acciones del propietario funcional.
