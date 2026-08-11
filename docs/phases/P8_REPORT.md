# Fase 8 — Reporte de cierre

Growth/Search/Distribution — fundación SEO/GEO/AEO. Scope: `docs/phases/P8.md`. Cerrada 2026-08-11, a pedido explícito del propietario funcional de que cada página se revise para maximizar cómo la ven buscadores y LLMs.

## Qué se entregó

- **801 (metadata/canonical/robots)**: `app/robots.ts` (Next.js nativo, `Allow: /` + referencia al sitemap). Las 16 páginas existentes del shell público obtienen `description` real (reutilizando copy editorial ya existente en los diccionarios, o compuesta a partir de datos reales del catálogo — nunca texto inventado nuevo), `alternates.canonical` y `alternates.languages` (hreflang para los 5 locales + `x-default`).
- **802 (sitemaps)**: `app/sitemap.ts` (dinámico) — 8 rutas estáticas del shell + hub/categorías/tools/deals de las 3 verticales lanzadas + todo producto `published` + todo contenido `published` (hoy: ninguno, los 3 artículos siguen en `pending_editorial_review` — confirmado que el sitemap los excluye correctamente, consistente con ADR-005). **47 URLs** verificadas en el sitemap generado.
- **803 (structured data)**: `packages/seo` (placeholder vacío desde Fase 1, primera vez con contenido real) — `Organization`/`WebSite` JSON-LD sitewide (layout raíz), `Product` JSON-LD en perfiles de producto (precio/moneda reales del último `product_prices`, sin `availability` ni `aggregateRating` inventados — no existen esas señales en el schema todavía), `BreadcrumbList` JSON-LD en categoría/producto/guía/deals.
- **804 (internal linking/breadcrumbs)**: nuevo componente `Breadcrumb` (`apps/web/src/components/breadcrumb.tsx`) — una sola fuente de datos para el breadcrumb visible Y el `BreadcrumbList` JSON-LD, en vez de mantener la jerarquía dos veces. Reemplaza el link "← Volver" que existía al final de categoría/producto (menos descubrible, solo un nivel) por un breadcrumb completo (Home → Vertical → Categoría → Producto) visible arriba de cada página.
- **`/search` marcado `noindex, follow`**: hallazgo real durante la revisión — la búsqueda no ejecuta ninguna consulta real contra el catálogo todavía (siempre muestra "sin resultados"), así que indexar `/search?q=*` generaría contenido delgado sin valor único por query. Se revierte cuando exista búsqueda real.
- **Base URL sin hardcodear dominio**: `packages/seo/src/site-url.ts` resuelve `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` (variable automática de Vercel) → `localhost:3000`, nunca un string literal — cuando backlog 109 (dominio propio) se resuelva, es un cambio de una variable de entorno, no una búsqueda y reemplazo por el código.

## Verificación (HTML real, no solo que la página cargue)

- `curl http://localhost:3000/robots.txt` → `Allow: /` + referencia al sitemap.
- `curl http://localhost:3000/sitemap.xml` → 47 `<loc>` con `hreflang` por cada uno de los 5 locales + `x-default`.
- Perfil de producto (`eero 7`, EN): `<title>`, `<meta name="description">`, `<link rel="canonical">`, 6 `<link rel="alternate" hreflang="...">`, y 4 bloques JSON-LD (`Organization`, `WebSite`, `Product` con precio real `$169.99 USD`, `BreadcrumbList` de 4 niveles) — confirmados en el HTML servido, no solo en el código.
- Misma página de categoría en `es`: título/descripción/canonical localizados correctamente, breadcrumb en español ("Inicio" en vez de "Home").
- Breadcrumb visible verificado en navegador (desktop + mobile 375px) y sus 3 links (`href`) confirmados correctos vía inspección del DOM.
- `/search` confirmado con `<meta name="robots" content="noindex, follow">`.
- `typecheck`/`lint` en verde en todo el monorepo.

## Práctica hacia adelante (lo que pidió el propietario funcional, más allá de esta sesión)

De aquí en adelante, toda página nueva debe evaluarse contra esta misma checklist antes de darse por completa:
1. `description` real (nunca genérica ni inventada) en `generateMetadata`.
2. `alternates.canonical` + `alternates.languages` vía `buildAlternates()` de `@platform/seo`.
3. `BreadcrumbList` si la página tiene una jerarquía real de navegación — vía el componente `Breadcrumb`.
4. `Product`/otro schema.org aplicable si la página representa una entidad real del catálogo — vía los builders de `@platform/seo`.
5. Confirmar que la ruta queda incluida en `app/sitemap.ts` si es pública e indexable, o marcada `noindex` explícitamente si no lo es (con la razón documentada, como con `/search`).

## Explícitamente fuera de scope (documentado desde el inicio en `docs/phases/P8.md`)

- **805/806** (newsletter, social content workflow) — canales de distribución, no señales de descubribilidad.
- **`llms.txt`** — estándar emergente sin consenso, se evalúa después.
- **Verificación en Google Search Console/Bing Webmaster Tools** — requiere que el propietario funcional registre la propiedad.
- **Article/Review schema en contenido editorial** — los 3 artículos siguen sin publicar; se agrega cuando haya contenido real publicado que lo justifique.

## Backlog resultante

- **807** (nuevo): cuando exista búsqueda real contra el catálogo, quitar el `noindex` de `/search` y evaluar si amerita su propio sitemap de queries populares.
- **808** (nuevo): `Article`/`Review` JSON-LD para contenido editorial publicado — depende de que se resuelva backlog 606/616/626 (aprobación humana) primero.
- Backlog 109 (dominio propio) sigue siendo la dependencia real para que las URLs canónicas/sitemap/hreflang dejen de apuntar al dominio `.vercel.app` — el código ya está listo para el cambio (una variable de entorno).
