# Decidero (nombre provisional) — Monetization Intelligence Platform

Plataforma multi-vertical de descubrimiento, comparación y monetización (ads + affiliate + leads, progresivamente sponsored/vendor/data), construida sobre un núcleo único multi-property.

Nombre comercial: **Decidero** — **provisional**, ver `docs/DECISIONS.md` ADR-009. Se eligió tras un screening informal de conflictos (sin marca formal aún) para poder avanzar; puede cambiar antes del lanzamiento. `jprs-monetization-platform` sigue siendo el slug técnico del repositorio/carpeta y de todos los proyectos de infraestructura (GitHub, Supabase, Vercel) — deliberadamente independiente del nombre comercial, para que un rebranding no requiera renombrar nada.

## Estado actual

**Fase 0 (Charter & Research Lock): CLOSED.** **Fase 1 (Repository & Delivery Foundation): auditada, cerrando.**

Monorepo funcional con Next.js + TypeScript, conectado a GitHub, Supabase y Vercel. CI en verde, `main` protegida, secretos fuera del repo. No hay lógica de producto todavía — eso empieza en Fase 2.

- Repo remoto: [`digitalconnectdr/jprs-monetization-platform`](https://github.com/digitalconnectdr/jprs-monetization-platform)
- Base de datos: Supabase (`jprs-monetization-platform`, US East), un solo proyecto con Database Branching (ADR-010)
- Hosting: Vercel, conectado vía GitHub, deploy de producción activo

## Estructura actual

```
apps/
└─ web/                        # Next.js 16 + TypeScript (App Router), Root Directory en Vercel
   ├─ src/app/                 # layout.tsx, page.tsx, globals.css
   ├─ eslint.config.mjs
   ├─ next.config.mjs
   └─ .env.local.example       # plantilla de variables Supabase (sin secretos)
packages/
├─ shared/src/branding.ts      # Único punto de configuración del nombre de marca (ADR-009)
├─ ui/ · db/ · analytics/ · monetization/ · content/ · seo/   # Placeholders, lógica real por fase
supabase/
├─ migrations/ · functions/ · tests/
└─ seed.sql
.github/
├─ ISSUE_TEMPLATE/ · PULL_REQUEST_TEMPLATE.md
└─ workflows/ci.yml            # lint + typecheck + build, Actions pinneadas por SHA
docs/
├─ PROJECT_BLUEPRINT.md        # Versión resumida/operativa del blueprint completo — fuente de verdad
├─ PROJECT_CHARTER.md          # Propósito, scope de los 3 verticales, límites editoriales
├─ MONETIZATION_POLICY.md      # Reglas de ads/affiliate/leads/sponsored como requisitos técnicos
├─ CONTENT_POLICY.md           # Reglas editoriales, componentes de confianza, freshness
├─ KPI_TREE.md                 # Árbol de KPIs, fórmulas, gates económicos 10K/100K/1M
├─ MASTER_BACKLOG.md           # Backlog completo por fase, con IDs (nunca se reutilizan)
├─ DECISIONS.md                # ADRs (Architecture Decision Records), append-only
├─ PHASE_STATUS.md             # Estado real de cada fase
├─ phases/                     # P0_REPORT.md, P1_REPORT.md — reportes de cierre por fase
└─ audits/                     # P0_AUDIT.md, P1_AUDIT.md — auditorías independientes
AGENTS.md                      # Reglas mínimas del repo para Codex
CLAUDE.md                      # Reglas mínimas del repo para Claude Code
CHANGELOG.md                   # Historial de cambios por fase
```

## Comandos

```bash
npm install        # instala todo el monorepo
npm run dev         # arranca apps/web en local
npm run typecheck   # todos los workspaces
npm run lint        # todos los workspaces
npm run build        # todos los workspaces
```

## Próximos pasos (según `docs/PHASE_STATUS.md`)

1. Cerrar Fase 1 formalmente una vez confirmado el preview de Vercel en un PR real.
2. Iniciar **Fase 2 — Data Core, Auth & RBAC**: schema base, RLS, roles, migrations, tests de autorización. Zona de mayor riesgo del proyecto — requiere auditoría de seguridad obligatoria antes de cerrar (ver `docs/DECISIONS.md` ADR-011 sobre el control de compensación de revisión de PRs).
3. **Deuda diferida, no bloqueante**: backlog 109 (búsqueda formal de marca + registro de dominio) — debe resolverse antes de Fase 11 (MVP Launch).

## Principio de ejecución

Fases cerradas: **planificar → implementar → probar → auditar → corregir → cerrar → actualizar pendientes**. Una fase a la vez — no se entrega el blueprint completo a un agente con instrucción "hazlo todo". El autor de un cambio nunca es su único auditor (ver ADR-006 y ADR-011 en `docs/DECISIONS.md`). Ver `AGENTS.md` / `CLAUDE.md` para las reglas operativas mínimas.
