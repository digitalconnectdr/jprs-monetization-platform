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
| `npm run build` (`next build`) | ❌ localmente / **✅ en GitHub Actions**. Localmente falla de forma reproducible con `FATAL ERROR: Committing semi space failed / JavaScript heap out of memory`, en Turbopack y en webpack, en Bash y en PowerShell nativo (con y sin sandbox del agente), incluso subiendo `NODE_OPTIONS=--max-old-space-size`. El pagefile de la máquina tiene 48GB asignados, así que no era falta de memoria virtual del sistema — el patrón apuntaba a interferencia de software de seguridad/antivirus interceptando llamadas de asignación de memoria en esta máquina específica. **Confirmado**: el primer run de CI (`gh run list`, run `31225151278`, disparado por el push a `main`) terminó `conclusion=success` — lint, typecheck y build pasan limpio en los runners de GitHub Actions. La causa era 100% local a esta máquina, no un defecto de código. |

## Hallazgo adicional corregido durante el bootstrap

Next.js 16 genera automáticamente `apps/web/AGENTS.md` y `apps/web/CLAUDE.md` (guía de la API de Next.js 16 para agentes AI, regenerados en cada `next dev`/`next build`) — colisionan de nombre con los `AGENTS.md`/`CLAUDE.md` del proyecto en la raíz. Se agregaron a `.gitignore` (`apps/*/AGENTS.md`, `apps/*/CLAUDE.md`) y se documentó la distinción en los archivos raíz para que no se confundan.

## Repositorio remoto

Repo creado por el propietario funcional en `https://github.com/digitalconnectdr/jprs-monetization-platform`. Push inicial (commit `59a4536`) hecho el 2026-08-07 usando la sesión de `gh` CLI ya autenticada en la máquina (cuenta `digitalconnectdr`, scopes `repo`+`workflow`) — no fue necesario manejar ningún token en la conversación. CI se disparó automáticamente por el push; ver resultado arriba.

## Branch protection (backlog 105)

Aplicada 2026-08-07 con confirmación explícita del propietario funcional: PR obligatorio antes de mergear a `main`, check `build` (de `.github/workflows/ci.yml`) requerido en verde, rama debe estar actualizada (`strict: true`), sin force-push ni borrado de `main`. Sin mínimo de aprobaciones de PR (0) — se puede subir a 1+ más adelante si se suma otra cuenta revisora.

## Qué falta para cerrar Fase 1

No se marca CLOSED todavía. Pendiente:

1. **Backlog 103** — Supabase environments (dev/staging/prod): requiere cuenta/CLI de Supabase del propietario funcional.
2. **Backlog 104** — Conectar GitHub↔Vercel previews: requiere cuenta Vercel (conexión OAuth manual del propietario funcional).
3. **Backlog 109** — Búsqueda formal de marca + registro de dominio: acción legal/de pago del propietario funcional.
4. Auditoría de cierre de fase (A1/A2 Architecture/A3 Security/A4 QA).

## Riesgos y deuda conocida

- El `package-lock.json` generado no está commiteado todavía (no se ha hecho ningún commit git — se dejó así intencionalmente para que el propietario funcional revise el estado antes del primer commit).
- Versiones de `next`/`react`/`eslint-config-next` fijadas a `"latest"` en los `package.json` — deben congelarse a versiones exactas (`^X.Y.Z`) en el primer commit real, para reproducibilidad (`latest` es aceptable solo para el bootstrap inicial).
- No hay tests todavía (unit/integration/E2E) — no hay lógica de producto que probar aún; se agregan a partir de Fase 2.
