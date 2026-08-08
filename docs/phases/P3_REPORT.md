# PHASE_REPORT — Fase 3: Design System & Public Shell

Builder: Claude Code (esta sesión). Fecha: 2026-08-08. **Estado: CLOSED.**

Scope y criterios de aceptación: `docs/phases/P3.md`.

## Qué se implementó

- **Design tokens** (`apps/web/src/app/globals.css`, Tailwind v4 `@theme`, OKLCH): paleta de marca + acento por vertical, tipografía (Source Serif 4 + Public Sans), spacing rhythm, radii, z-index semántico, motion. Detalle completo en `docs/DESIGN_SYSTEM.md`.
- **Shell público**: `SiteHeader`/`SiteFooter` (`apps/web/src/components/layout/`), responsive (mobile con menú colapsable, desktop con nav completa), búsqueda, y `LanguageSwitcher`.
- **Templates**: Home, Discover (índice de verticales), vertical hub (`app/[locale]/[site]/`), Search, y 5 páginas legales (About/Methodology, Editorial Policy, Affiliate Disclosure, Privacy — borrador explícito, Terms — borrador explícito).
- **Internacionalización** (agregado a mitad de fase, ver ADR-013): `apps/web/src/middleware.ts` (detección de locale por cookie/`Accept-Language`, redirección), diccionarios tipados `apps/web/src/lib/i18n/{en,es,pt,hi}.ts` sobre un type `Dictionary` compartido, `get-dictionary.ts` (lookup + interpolación `{brand}`). Todas las rutas migradas de `app/*` a `app/[locale]/*`.
- Todo trabajo de UI se construyó siguiendo el flujo `shape` → `craft` de la skill `/impeccable` (instrucción explícita del propietario funcional), con `PRODUCT.md` como contexto de marca/registro.

## Cronología real (relevante para entender las decisiones)

1. Se construyó el shell completo en inglés (asunción inicial: audiencia US, consistente con una nota entonces vigente en `packages/shared/src/branding.ts`).
2. El propietario funcional pidió explícitamente que el sitio soporte español además de inglés — se diseñó la arquitectura de diccionarios tipados y `middleware.ts` (EN/ES).
3. Antes de terminar de migrar las páginas al nuevo sistema, el propietario funcional amplió el requisito a portugués e hindi (4 idiomas totales). Se agregó `pt.ts`/`hi.ts` y se registraron en `locales`/`get-dictionary.ts` **antes** de migrar ninguna página, para no rehacer trabajo dos veces.
4. Con los 4 diccionarios completos y type-consistentes (`typecheck` limpio salvo las páginas aún no migradas — error esperado), se migraron todas las rutas de `app/*` a `app/[locale]/*`, incluyendo el layout raíz (`html lang={locale}` dinámico) y los 5 componentes/páginas legales.

## Hallazgo encontrado y corregido durante la propia migración

Al verificar visualmente cada locale en el navegador (no algo que `typecheck`/`lint` pudieran atrapar), se encontró que `legal-page.tsx` renderizaba la etiqueta **"Last reviewed:"** hardcodeada en inglés en las 5 páginas legales de los 4 idiomas — quedó fuera del diccionario porque es un string literal válido para TypeScript, no un campo de `Dictionary` faltante. Se corrigió agregando `common.lastReviewedLabel` al type `Dictionary`, traduciéndolo en los 4 locales, y pasándolo como prop explícito a `LegalPage` desde cada una de las 5 páginas legales. Verificado el fix en `/es/about` (ahora "Última revisión: agosto de 2026").

Este hallazgo confirma un patrón ya documentado en `docs/DESIGN_SYSTEM.md` §7.2: el `typecheck` garantiza que el diccionario esté *completo*, pero no que un componente efectivamente *use* el diccionario en vez de un string hardcodeado — esa verificación solo la da la inspección visual en cada idioma.

## Verificación realizada

- `npm run typecheck --workspace=apps/web` y `npm run lint --workspace=apps/web`: **limpios**, sin errores ni warnings, tras la migración completa.
- Navegador (mobile 375px / tablet 768px / desktop 1280px), contra los 4 locales (`/en`, `/es`, `/pt`, `/hi`):
  - Home: contenido completo, sin mezcla de idiomas, verificado texto completo de los 4 idiomas.
  - Discover, vertical hub (`/[locale]/software-ai`), Search (con y sin query `?q=`): verificado en al menos 2 idiomas distintos cada uno.
  - Página legal (`/es/about`): las 4 secciones + lista "qué no hacemos" con el link de afiliados intercalado en la posición correcta.
  - `<html lang>` correcto por locale (confirmado vía `window.location.href` + inspección de `<html>`).
  - Redirección de `/` respeta la cookie `locale` (fijada previamente por el language switcher) por encima de `Accept-Language` — confirmado navegando a `/` tras cambiar idioma con el switcher.
  - Menú móvil (375px): botón hamburguesa abre nav completa + búsqueda + language switcher, todo con texto localizado (verificado en español).
  - Tablet (768px): confirma el breakpoint `md` de Tailwind — layout desktop completo (no colapsado).
  - Language switcher (`<select>` nativo): cambiar de idioma navega a la misma ruta bajo el nuevo locale, preservando el path (`/hi` → `/es` en la home).

## Decisiones tomadas durante la fase

- **ADR-013**: arquitectura de i18n — enrutamiento por segmento de URL + diccionarios TypeScript tipados, sin librería externa. Detalle en `docs/DECISIONS.md`.
- Backlog 204 (Admin/User route guards), que Fase 2 había diferido "a Fase 3", se re-difiere explícitamente a **Fase 4**: Fase 3 construyó únicamente el shell público (sin autenticación de usuario visible en UI); las primeras rutas admin/user reales se crean en Fase 4 (CMS & Product Intelligence), que es donde tiene sentido aplicar los guards.
- `packages/shared/src/branding.ts` — el comentario original que fijaba `tagline` "en inglés, sitio US-focused" quedó obsoleto por ADR-013; se corrigió el comentario para reflejar que `tagline` es ahora un fallback de metadata sin contexto de locale, no la fuente del copy real (que vive en los diccionarios).

## Auditoría independiente y correcciones aplicadas

`docs/audits/P3_AUDIT.md` (agente independiente, sesión separada). Veredicto inicial: GO CON CONDICIONES — sin hallazgos Critical/High, 4 Medium (F-01 a F-04) y 4 Low (F-05 a F-08). El auditor corrió `typecheck`/`lint`/`build` de forma independiente (no asumió los resultados del Builder), calculó contraste WCAG real por conversión OKLCH→sRGB, y verificó HTML servido de un build de producción real contra varias rutas/locales.

Se corrigieron 6 de los 8 hallazgos directamente sobre el PR #7 antes de mergear: meta description localizada (F-01, agregado `metaDescription` a `Dictionary` para `home` y las 5 páginas legales en los 4 idiomas), matcher de `middleware.ts` ampliado para excluir `robots.txt`/`sitemap.xml`/`manifest.json` y más extensiones estáticas (F-03), contraste de `--color-border` corregido de 1.43:1 a ≥3.2:1 (F-04), extracción de las constantes de locale a `lib/i18n/locales.ts` para no depender de `middleware.ts` como módulo de valores (parte de F-02), traducción incompleta en `hi.ts` corregida (F-05), y cierre del menú móvil con tecla Escape + retorno de foco (F-08). Los 2 hallazgos restantes (F-06: 404 localizado; F-07: token de contraste sin consumidor real; y la migración completa de `middleware.ts`→`proxy.ts`, parte de F-02) se difieren explícitamente a Fase 4 como backlog 407/408, con razón documentada en cada caso — ninguno bloquea el cierre de esta fase. Veredicto final del auditor tras las correcciones: **GO**.

## Riesgos y deuda conocida (heredada a Fase 4+)

- `packages/ui` sigue siendo un placeholder vacío (`export {}`) — los tokens reales viven en `apps/web/src/app/globals.css`. No bloqueante mientras exista un solo consumidor; se evalúa mover tokens a `packages/ui` si Fase 7 (Admin Analytics) u otra fase agrega una segunda app.
- Backlog 305 (Mobile comparison patterns) se marca DONE parcial: los patrones de lista/comparación del shell (Discover, vertical hub) están completos, pero patrones de tabla comparativa completa (ej. "VS" side-by-side) requieren contenido de producto real, que es Fase 4.
- El diccionario de i18n cubre únicamente el shell público — contenido editorial (comparativas, guías) todavía no existe y su traducción es una decisión explícita pendiente para cuando exista (ver disparador de revisión de ADR-013).
- Backlog 204 (route guards) re-diferido a Fase 4, según arriba.
