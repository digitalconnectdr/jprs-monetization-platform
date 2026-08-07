# PHASE_REPORT — Fase 1: Repository & Delivery Foundation (parcial)

Builder: Claude Code (esta sesión). Fecha: 2026-08-07. **Estado: IN PROGRESS**, no CLOSED — ver "Qué falta" abajo.

## Qué cambió

Bootstrap **local** del monorepo (npm workspaces, sin Turborepo/pnpm por simplicidad en esta etapa):

- `git init`, rama `main`.
- `package.json` raíz con workspaces (`apps/*`, `packages/*`), `tsconfig.base.json`, `.gitignore`, `.nvmrc` (Node 22).
- `apps/web`: Next.js 16.3.0 + TypeScript, App Router mínimo (`layout.tsx`, `page.tsx`), usa `@platform/shared` para el nombre de marca (ver ADR-009).
- `packages/{ui,db,analytics,monetization,content,seo,shared}`: placeholders con `package.json`/`tsconfig.json`/`src/index.ts`, cada uno con un comentario indicando en qué fase se implementa su lógica real. `packages/shared/src/branding.ts` es el punto único de configuración de marca (backlog 108).
- `supabase/{migrations,functions,tests}` (carpetas vacías con `.gitkeep`) y `seed.sql` placeholder.
- `.github/ISSUE_TEMPLATE/{bug_report,phase_task}.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/ci.yml` (lint/typecheck/build — no puede ejecutarse hasta que exista el repo remoto).

## Verificación local

| Check | Resultado |
|---|---|
| `npm install` | ✅ (354 paquetes, 0 vulnerabilidades) — falló primero en el shell Bash del agente por límite de memoria del sandbox; funcionó en PowerShell nativo |
| `npm run typecheck` (todos los workspaces) | ✅ |
| `npm run lint` | ✅ — requirió corregir `apps/web/eslint.config.mjs`: había usado el patrón de ESLint de Next.js 15 (`FlatCompat`/`@eslint/eslintrc`), que Next.js 16 rompe (`next lint` fue eliminado en v16). Corregido al patrón documentado en `node_modules/next/dist/docs/.../03-eslint.md` (`eslint-config-next/core-web-vitals` + `/typescript` como exports directos) |
| `npm run dev` | ✅ — arranca en 4.4s, sirve `http://localhost:3311` |
| `npm run build` (`next build`) | ❌ — falla de forma reproducible con `FATAL ERROR: Committing semi space failed / JavaScript heap out of memory`, en Turbopack y en webpack, en Bash y en PowerShell nativo (con y sin sandbox del agente), incluso subiendo `NODE_OPTIONS=--max-old-space-size`. El pagefile de la máquina tiene 48GB asignados, así que no es falta de memoria virtual del sistema — el patrón (falla casi inmediata al intentar comprometer una región de memoria minúscula) apunta a interferencia de software de seguridad/antivirus interceptando llamadas de asignación de memoria en esta máquina específica (se observó un crash de AMSI en PowerShell por una causa relacionada durante la misma sesión). **No se pudo confirmar un build de producción exitoso en este entorno.** |

## Hallazgo adicional corregido durante el bootstrap

Next.js 16 genera automáticamente `apps/web/AGENTS.md` y `apps/web/CLAUDE.md` (guía de la API de Next.js 16 para agentes AI, regenerados en cada `next dev`/`next build`) — colisionan de nombre con los `AGENTS.md`/`CLAUDE.md` del proyecto en la raíz. Se agregaron a `.gitignore` (`apps/*/AGENTS.md`, `apps/*/CLAUDE.md`) y se documentó la distinción en los archivos raíz para que no se confundan.

## Qué falta para cerrar Fase 1

No se marca CLOSED todavía. Pendiente:

1. **Confirmar el build de producción en un entorno sin la restricción de memoria observada** — recomendado: dejar que lo confirme el workflow de CI (`.github/workflows/ci.yml`) una vez exista el repo remoto, ya que los runners de GitHub Actions no deberían tener esta limitación. Alternativa: que el propietario funcional corra `npm run build` en su propia máquina/terminal fuera de esta sesión.
2. **Backlog 103** — Supabase environments (dev/staging/prod): requiere cuenta/CLI de Supabase del propietario funcional.
3. **Backlog 104** — Conectar GitHub↔Vercel previews: requiere repositorio GitHub remoto y cuenta Vercel.
4. **Backlog 105** — Proteger `main` y checks requeridos: requiere que el repo remoto exista primero.
5. **Backlog 109** — Búsqueda formal de marca + registro de dominio: acción legal/de pago del propietario funcional.
6. Auditoría de cierre de fase (A1/A2 Architecture/A3 Security/A4 QA) — no ejecutada todavía; no tiene sentido auditar arquitectura/seguridad de un bootstrap que aún no corrió en CI.

## Riesgos y deuda conocida

- El `package-lock.json` generado no está commiteado todavía (no se ha hecho ningún commit git — se dejó así intencionalmente para que el propietario funcional revise el estado antes del primer commit).
- Versiones de `next`/`react`/`eslint-config-next` fijadas a `"latest"` en los `package.json` — deben congelarse a versiones exactas (`^X.Y.Z`) en el primer commit real, para reproducibilidad (`latest` es aceptable solo para el bootstrap inicial).
- No hay tests todavía (unit/integration/E2E) — no hay lógica de producto que probar aún; se agregan a partir de Fase 2.
