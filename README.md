# Decidero (nombre provisional) — Monetization Intelligence Platform

Plataforma multi-vertical de descubrimiento, comparación y monetización (ads + affiliate + leads, progresivamente sponsored/vendor/data), construida sobre un núcleo único multi-property.

Nombre comercial: **Decidero** — **provisional**, ver `docs/DECISIONS.md` ADR-009. Se eligió tras un screening informal de conflictos (sin marca formal aún) para poder avanzar; puede cambiar antes del lanzamiento. `jprs-monetization-platform` sigue siendo el slug técnico del repositorio/carpeta — deliberadamente independiente del nombre comercial, para que un rebranding no requiera renombrar el repo.

## Estado actual

**Fase 0 — Charter & Research Lock: documentación completa y auditada, pendiente de aprobación humana.**

No hay código de producto todavía. Este repositorio contiene la documentación operativa de Fase 0, generada a partir de `JPRS_Monetization_Intelligence_Platform_Blueprint_v1.docx` (v1.0, 7 de agosto de 2026) y revisada por una auditoría independiente (`docs/audits/P0_AUDIT.md`) que encontró y corrigió 7 hallazgos (ninguno queda abierto).

## Estructura actual

```
docs/
├─ PROJECT_BLUEPRINT.md      # Versión resumida/operativa del blueprint completo — fuente de verdad
├─ PROJECT_CHARTER.md        # Propósito, scope de los 3 verticales, límites editoriales
├─ MONETIZATION_POLICY.md    # Reglas de ads/affiliate/leads/sponsored como requisitos técnicos
├─ CONTENT_POLICY.md         # Reglas editoriales, componentes de confianza, freshness
├─ KPI_TREE.md               # Árbol de KPIs, fórmulas, gates económicos 10K/100K/1M
├─ MASTER_BACKLOG.md         # Backlog completo por fase, con IDs (nunca se reutilizan)
├─ DECISIONS.md              # ADRs (Architecture Decision Records), append-only
├─ PHASE_STATUS.md           # Estado real de cada fase — qué falta para cerrar Fase 0
├─ phases/P0_REPORT.md       # Reporte de cierre del Builder para Fase 0
└─ audits/P0_AUDIT.md        # Auditoría independiente de Fase 0 (hallazgos + resolución)
AGENTS.md                    # Reglas mínimas del repo para Codex
CLAUDE.md                    # Reglas mínimas del repo para Claude Code
CHANGELOG.md                 # Historial de cambios por fase
```

## Próximos pasos (según `docs/PHASE_STATUS.md`)

1. **Aprobación humana de Fase 0**: revisar y aprobar `PROJECT_CHARTER.md`, `MONETIZATION_POLICY.md`, `CONTENT_POLICY.md`, `KPI_TREE.md`, `DECISIONS.md`.
2. **Confirmar ADR-002** (Next.js + TypeScript) → cambiar su estado a ACCEPTED en `DECISIONS.md`. Es bloqueante explícito para Fase 1. ADR-009 (nombre comercial "Decidero") ya está aceptado como provisional — pendiente búsqueda formal de marca y registro de dominio (backlog ID 109) antes de Fase 11.
3. Marcar Fase 0 como **CLOSED** en `docs/PHASE_STATUS.md` y `docs/MASTER_BACKLOG.md` (ítems 001–006).
4. Crear repositorio GitHub (vacío, `main` protegida una vez exista CI) e iniciar **Fase 1 — Repository & Delivery Foundation** (bootstrap del monorepo Next.js/Supabase/Vercel).

## Principio de ejecución

Fases cerradas: **planificar → implementar → probar → auditar → corregir → cerrar → actualizar pendientes**. Una fase a la vez — no se entrega el blueprint completo a un agente con instrucción "hazlo todo". Ver `AGENTS.md` / `CLAUDE.md` para las reglas operativas mínimas.
