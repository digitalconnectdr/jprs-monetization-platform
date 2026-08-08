# DESIGN_SYSTEM.md

Fuente de verdad para tokens, tipografía, componentes y el sistema de i18n del shell público (`apps/web`). Generado al cierre de Fase 3 (Design System & Public Shell). Ver `PRODUCT.md` para el contexto de marca/registro/anti-patrones que guió estas decisiones, y `docs/phases/P3_REPORT.md` para el reporte de ejecución completo.

## 1. Dónde viven los tokens

Los design tokens **no** están en `packages/ui` (existe como placeholder desde el scaffold inicial, `packages/ui/src/index.ts`, sin contenido real). Viven directamente en `apps/web/src/app/globals.css`, vía el bloque `@theme` de Tailwind CSS v4 (CSS-first, sin `tailwind.config.js`). Razón: un solo consumidor (`apps/web`) hasta ahora; mover tokens a `packages/ui` como paquete compartido tiene sentido cuando exista una segunda app (ej. admin dashboard, Fase 7) que deba compartirlos — se evalúa en ese momento, no antes (evitar abstracción prematura).

## 2. Paleta de color

Composición: seed de marca `oklch(0.600 0.130 160.0)` (verde), generado vía `impeccable/scripts/palette.mjs`. Mood buscado: "sello de notario / verde de libro contable" — evidencia y confianza editorial, no un ambiente inmersivo — por eso el fondo (`--color-bg`) es blanco puro (`oklch(1 0 0)`), no un neutro cálido tipo crema/sand (patrón "AI slop 2026" explícitamente evitado, ver `PRODUCT.md` → Anti-references).

| Token | Valor OKLCH | Uso |
|---|---|---|
| `--color-bg` | `oklch(1 0 0)` | Fondo base |
| `--color-surface` | `oklch(0.97 0.004 160)` | Secciones alternas, cards, inputs |
| `--color-surface-hover` | `oklch(0.945 0.006 160)` | Hover sobre surface |
| `--color-border` | `oklch(0.88 0.008 160)` | Bordes, separadores |
| `--color-ink` | `oklch(0.19 0.006 160)` | Texto principal |
| `--color-muted` | `oklch(0.5 0.008 160)` | Texto secundario — verificado ≥4.5:1 sobre `bg`/`surface` |
| `--color-primary` / `-hover` / `-ink` | `oklch(0.42 0.11 160)` / `0.36 0.11 160` / `1 0 0` | CTA, links activos, focus |
| `--color-accent` / `-ink` | `oklch(0.58 0.14 75)` / `1 0 0` | Acento cálido puntual (brass) |
| `--color-danger` / `-ink` | `oklch(0.55 0.19 25)` / `1 0 0` | Estados de error |

**Acento secundario por vertical** ("un solo sistema, tres acentos" — principio de diseño 4 en `PRODUCT.md`), usado como punto de color/indicador, nunca como fondo dominante:

| Vertical | Token | Valor | Razonamiento |
|---|---|---|---|
| Business Software & AI | `--color-niche-software` | `oklch(0.48 0.09 230)` (slate-blue frío) | Evita el cliché "morado = AI" |
| Travel & Smart Travel | `--color-niche-travel` | `oklch(0.55 0.13 35)` (terracota) | Cálido, distinto del verde de marca |
| Consumer Tech & Smart Home | `--color-niche-tech` | `oklch(0.5 0.1 200)` (cyan) | Distinto de software (evita confundir ambos "tech") |

Estrategia de color: **Restrained** (tinted neutrals + un acento dominante ≤10% de superficie) — consistente con el registro `brand` pero con personalidad editorial seria, no minimalismo de producto SaaS.

## 3. Tipografía

Par: **Source Serif 4** (`--font-serif`, headings) + **Public Sans** (`--font-sans`, body/UI) — contraste serif/sans deliberado, ninguno de los dos es geométrico ni pertenece a la lista reflex-reject de `impeccable`. Cargados vía `next/font/google` en `app/[locale]/layout.tsx` con `display: "swap"`.

- Escalas `--text-xs` a `--text-lg`: valores fijos en rem.
- `--text-xl`/`--text-2xl`/`--text-3xl`: `clamp()` fluido, techo máximo 3.5rem (dentro del límite de 6rem que marca `impeccable` para no "gritar").
- `h1`–`h3`: `text-wrap: balance`; párrafos largos: `text-wrap: pretty`.
- Letter-spacing en headings: `-0.01em` (dentro del piso de `-0.04em` que marca `impeccable`).
- Line length en `.prose-legal`: `max-width: 70ch`.

## 4. Spacing, radii, z-index, motion

- `--spacing-rhythm: 1.625rem` — ritmo vertical base derivado de `16px × line-height 1.65`.
- Radii: `--radius-sm/md/lg` = `0.25/0.5/0.75rem` — sutiles, sin "pill everything".
- Z-index semántico: `dropdown(20) < sticky(30) < modal-backdrop(40) < modal(50) < toast(60) < tooltip(70)` — nunca valores arbitrarios tipo `999`.
- Motion: `--duration-fast/base/slow` = `150/250/400ms`; `--ease-out-quart`/`--ease-out-expo` para transiciones (sin bounce/elastic). `prefers-reduced-motion: reduce` deshabilita duraciones/transiciones globalmente (obligatorio, no opcional — ver `PRODUCT.md` → Accessibility & Inclusion).

## 5. Accesibilidad (WCAG AA baseline)

- Skip-link (`#main-content`) visible en focus, oculto (`sr-only`) en reposo, traducido por locale (`dictionary.common.skipToContent`).
- `:focus-visible` con `outline: 2px solid var(--color-primary)` — nunca `outline: none` sin reemplazo.
- Contraste verificado: `--color-muted` sobre `--color-bg`/`--color-surface` cumple ≥4.5:1 (texto de cuerpo); nunca se usó gris claro "por elegancia".
- Todos los `aria-label` (nav primaria, nav móvil, buscador, language switcher) están en el diccionario, no hardcodeados.
- Objetivo táctil ≥44px en controles móviles (botón de menú `h-11 w-11`).

## 6. Componentes del shell

| Componente | Archivo | Notas |
|---|---|---|
| Header | `apps/web/src/components/layout/site-header.tsx` | Client component; nav + búsqueda + language switcher desktop, menú colapsable en mobile (`<768px`) |
| Footer | `apps/web/src/components/layout/site-footer.tsx` | Server component; links de verticales y legales, copyright con disclosure de afiliados |
| Language switcher | `apps/web/src/components/layout/language-switcher.tsx` | Client component, `<select>` nativo (accesible sin JS de terceros); persiste elección en cookie `locale` y navega manteniendo la ruta actual |
| Legal page wrapper | `apps/web/src/components/legal/legal-page.tsx` | Título + fecha de última revisión (traducida) + `.prose-legal` |

Anti-patrones explícitamente evitados (checklist `impeccable`): sin side-stripe borders, sin gradient text, sin glassmorphism decorativo, sin hero-metric template, sin grid de cards idénticas, sin eyebrow/kicker en cada sección, sin numeración `01/02/03` de scaffolding.

## 7. Internacionalización (i18n)

Requisito agregado a mitad de Fase 3 por el propietario funcional (no estaba en el blueprint original, que asumía audiencia US/inglés) — primero EN+ES, luego ampliado a EN+ES+PT+HI.

### 7.1 Arquitectura

- **Enrutamiento por segmento de URL**: `/en`, `/es`, `/pt`, `/hi` — todas las rutas viven bajo `app/[locale]/...`. No hay subdominios ni dominios separados por idioma.
- **`apps/web/src/middleware.ts`**: exporta `locales`, `Locale`, `defaultLocale` (`"en"`), `localeNames` (nombres nativos para el switcher). Redirige cualquier ruta sin prefijo de locale: cookie `locale` (si es válida) → si no, primer idioma soportado en `Accept-Language` → si no, `defaultLocale`.
- **Diccionarios tipados**: `apps/web/src/lib/i18n/dictionary.ts` define el type `Dictionary` (única fuente de verdad de qué strings deben existir). `en.ts`/`es.ts`/`pt.ts`/`hi.ts` implementan ese type completo — TypeScript falla el build si a un diccionario le falta un campo, así que no puede haber una traducción a medias sin que `typecheck` lo detecte.
- **`get-dictionary.ts`**: `getDictionary(locale)` retorna el diccionario correspondiente; `t(template, vars)` interpola placeholders `{brand}` (usado donde el nombre de marca aparece embebido en una oración traducida, ver ADR-013).
- **`lib/niches.ts`**: separa datos estructurales no-traducibles (`nicheStructures`: slug, accentVar, launched) de copy traducible (`dictionary.niches[slug]`) — `getNiches(dictionary)` combina ambos. Esto es intencional: cuando Fase 4 reemplace estos datos por `public.niches`/`public.sites` reales de Supabase, solo cambia la fuente de `nicheStructures`, el copy sigue viniendo del diccionario.

### 7.2 Cómo agregar contenido traducible

Cualquier string nuevo visible al usuario en el shell público debe:
1. Agregarse al type `Dictionary` (`dictionary.ts`).
2. Traducirse en los 4 archivos de locale — TypeScript falla el `typecheck` si falta alguno.
3. Nunca hardcodearse directamente en un componente/página (ver hallazgo corregido en el reporte de fase: la etiqueta "Last reviewed" en `legal-page.tsx` quedó hardcodeada en inglés durante la migración y se detectó recién al verificar visualmente cada locale en el navegador — el `typecheck` no lo atrapa porque es un string literal válido, no un campo de diccionario faltante).

### 7.3 Cómo agregar un 5to idioma

1. Agregar el código a `locales` en `middleware.ts` (+ nombre nativo en `localeNames`).
2. Crear `apps/web/src/lib/i18n/{locale}.ts` implementando el type `Dictionary` completo.
3. Registrarlo en `dictionaries` dentro de `get-dictionary.ts`.
4. `npm run typecheck --workspace=apps/web` confirma que no falta ningún campo.

### 7.4 Decisión de no usar una librería de i18n

Ver ADR-013 (`docs/DECISIONS.md`) — el catálogo de strings del shell público es pequeño y no justifica una dependencia como `next-intl` todavía. Se reevalúa si Fase 4+ (CMS/contenido editorial) necesita pluralización compleja o gestión de traducciones a escala.

## 8. Verificación realizada

Navegador (mobile 375px / tablet 768px / desktop 1280px) contra los 4 locales: Home, Discover, vertical hub (`/[site]`), Search (con y sin query), y las 5 páginas legales. Verificado: contenido sin mezcla de idiomas, `<html lang>` correcto por locale, redirección de `/` respeta cookie/`Accept-Language`, menú móvil funcional con nav + búsqueda + language switcher, `generateMetadata` produce `<title>` traducido por página. Detalle completo en `docs/phases/P3_REPORT.md`.
