# PHASE_STATUS.md

Mantenido por A9 (Project Controller). Refleja el estado real de cada fase — nunca se marca CLOSED sin evidencia archivada.

| Fase | Nombre | Estado | Evidencia |
|---|---|---|---|
| 0 | Charter & Research Lock | **CLOSED** (2026-08-07) | `docs/phases/P0_REPORT.md`, `docs/audits/P0_AUDIT.md`, `CHANGELOG.md`, ADR-002 y ADR-009 ACCEPTED |
| 1 | Repository & Delivery Foundation | **IN PROGRESS** | `docs/phases/P1_REPORT.md` — bootstrap local hecho; build de producción sin confirmar (ver riesgo de memoria); 103/104/105/109 requieren al propietario funcional |
| 2 | Data Core, Auth & RBAC | NOT STARTED | — |
| 3 | Design System & Public Shell | NOT STARTED | — |
| 4 | CMS & Product Intelligence | NOT STARTED | — |
| 5 | Monetization & Attribution | NOT STARTED | — |
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

## Fase 1 — en curso

Alcance real ejecutado hasta ahora: bootstrap **local** del monorepo (101, 102, 108, 107 parcial). Pendiente y **fuera del alcance de un agente autónomo sin credenciales**:

- **103** — Supabase environments: requiere cuenta/CLI de Supabase del propietario funcional.
- **104** — Conectar GitHub↔Vercel previews: requiere repositorio GitHub remoto y cuenta Vercel.
- **105** — Proteger `main` y checks requeridos: requiere que el repo remoto exista primero.
- **109** — Búsqueda formal de marca + registro de dominio: acción legal/de pago, requiere decisión y ejecución del propietario funcional.

Fase 1 no se marca CLOSED hasta que estos ítems tengan evidencia y pase la auditoría correspondiente (A1/A2 Architecture/A3 Security/A4 QA).
