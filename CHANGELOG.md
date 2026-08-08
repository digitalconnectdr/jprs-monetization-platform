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

## 2026-08-07 — Supabase configurado (backlog 103 DONE)

- Proyecto Supabase creado por el propietario funcional (`jprs-monetization-platform`, US East/N. Virginia; "Automatically expose new tables" desactivado, "Enable automatic RLS" activado; GitHub conectado).
- ADR-010 aceptado: un solo proyecto Supabase con Database Branching (vía GitHub) en lugar de 3 proyectos dev/staging/prod separados.
- `apps/web/.env.local` completado y verificado: formato correcto, JWTs con los roles correctos (`anon`/`service_role`, no intercambiadas), conectividad real confirmada. `apps/web/.env.local.example` agregado como plantilla versionada.
- Solo quedan pendientes de Fase 1: 104 (Vercel) y 109 (marca/dominio).

## 2026-08-07 — Vercel conectado (backlog 104 DONE); auditoría de cierre de Fase 1

- Proyecto Vercel `jprs-monetization-platform` conectado al repo, deploy a producción exitoso (Root Directory `apps/web`), variables de Supabase cargadas. Confirma junto con GitHub Actions que la falla local de `next build` era 100% de la máquina del agente. Backlog 109 diferido explícitamente (decisión del propietario funcional) hasta antes de Fase 11.
- Auditoría independiente de cierre de Fase 1 ejecutada (`docs/audits/P1_AUDIT.md`): 8 hallazgos (1 Critical, 1 High, 3 Medium, 3 Low).
  - **Critical/High**: los 2 PRs mergeados hasta ahora se auto-aprobaron sin revisión real, y `main` no tenía ninguna barrera técnica real para la única cuenta con acceso (admin). Resuelto vía **ADR-011**: `enforce_admins=true` activado + control de compensación (auditoría de agente independiente obligatoria en PRs de riesgo) mientras exista una sola cuenta con acceso de escritura, con disparador de revisión explícito.
  - **Medium**: `PHASE_STATUS.md` desincronizado (corregido); "preview en PR" afirmado sin evidencia (se resuelve con este mismo PR, que toca `apps/web`); Dependabot security updates estaba deshabilitado (activado) y las versiones `"latest"` no tenían ID de backlog (creado backlog 110, y ya resuelto: todas las dependencias de `apps/web` y `packages/*` fijadas a versión exacta).
  - **Low**: GitHub Actions pinneadas por SHA (antes por tag mutable `@v4`); `README.md` actualizado al estado real; `.gitignore` ahora cubre `.vercel/`.
- Veredicto final de la auditoría: **GO**.

## 2026-08-07 — Fase 1 CLOSED

- PR #3 confirmó preview real de Vercel (`jprs-monetization-platfor-git-4bf58b-digitalconnectdrs-projects.vercel.app`, estado "Ready"), resolviendo el último hallazgo abierto (F-04). Los 4 criterios de aceptación de Fase 1 del blueprint (build reproducible, `main` protegida, preview en PR, secretos fuera del repo) verificados con evidencia independiente.
- Fase 1 marcada **CLOSED** en `docs/PHASE_STATUS.md` y `docs/MASTER_BACKLOG.md`.
- Único pendiente no bloqueante: backlog 109 (marca/dominio), diferido hasta antes de Fase 11. Próximo paso: iniciar Fase 2 (Data Core, Auth & RBAC).

## 2026-08-08 — Fase 2 (Data Core, Auth & RBAC) CLOSED

- **ADR-012**: corrige ADR-010 — Database Branching de Supabase requiere plan Pro (proyecto en FREE); migraciones se aplican directo al único proyecto post-merge, no vía preview DB.
- Schema completo: dominios `identity` (roles, profiles, user_roles con scope por `site_id`, user_preferences), `properties` (niches, sites, categories, site_settings), `catalog` mínimo (vendors, products). RLS en 10/10 tablas desde su creación.
- PR #4: auditoría independiente obligatoria (ADR-011) encontró 6 hallazgos (1 High: escalamiento de privilegios silencioso vía `site_id NULL` en `has_role()`; 3 Medium; 2 Low) — todos corregidos antes de mergear.
- Al aplicar las migraciones al proyecto Supabase real por primera vez (ADR-012), `rls_access.test.mjs` reveló 2 hallazgos que ninguna revisión de código podía haber atrapado: `service_role` sin `GRANT` de tabla explícito (F-07, High — rompía cualquier operación de backend real) y un bug de aserción de test (F-08). Corregidos en PR #5, también con auditoría independiente adjunta (GO).
- **Verificación empírica final**: 18/18 tests de acceso positivo/negativo pasan contra el proyecto real. Los 3 criterios de aceptación de Fase 2 (usuario normal no accede a datos admin, admin scope por property, RLS explícito en todas las tablas sensibles) quedan confirmados con evidencia real, no solo documentados.
- Fase 2 marcada **CLOSED**. Deferred a Fase 3: backlog 204 (route guards, requiere rutas reales de Next.js).

## 2026-08-08 — Fase 3 (Design System & Public Shell) CLOSED

- Shell público completo construido con la skill `/impeccable` (instrucción explícita del propietario funcional): design tokens OKLCH (`apps/web/src/app/globals.css`), header/footer/búsqueda responsive, templates de Home, Discover, vertical hub (`/[site]`), Search y 5 páginas legales.
- **Requisito agregado a mitad de fase**: el propietario funcional pidió que el sitio público soporte español además de inglés, y luego amplió el requisito a portugués e hindi — 4 idiomas totales. Se diseñó **ADR-013**: enrutamiento por segmento de URL (`/en`/`/es`/`/pt`/`/hi`) vía `middleware.ts`, diccionarios TypeScript tipados (`apps/web/src/lib/i18n/`) sin librería de i18n externa. Todas las rutas migradas de `app/*` a `app/[locale]/*`.
- Hallazgo corregido durante la propia migración: la etiqueta "Last reviewed" en las páginas legales quedó hardcodeada en inglés (no lo atrapa `typecheck`, solo la inspección visual por locale) — agregado `common.lastReviewedLabel` al diccionario y corregido en las 5 páginas legales × 4 idiomas.
- Verificación en navegador (mobile 375px/tablet 768px/desktop) contra los 4 locales: sin mezcla de idiomas, `<html lang>` correcto, redirección de `/` respeta cookie de idioma sobre `Accept-Language`, menú móvil y language switcher funcionales. `typecheck`/`lint` en verde.
- `docs/DESIGN_SYSTEM.md` creado documentando tokens, tipografía, accesibilidad y arquitectura de i18n.
- Fase 3 marcada **CLOSED**. Backlog 204 (Admin/User route guards), que Fase 2 había diferido "a Fase 3", se re-difiere a **Fase 4** — Fase 3 no creó rutas admin/user, solo shell público.
