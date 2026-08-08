# Fase 6A — Vertical 1: Business Software & AI

Fuente: `docs/PROJECT_BLUEPRINT.md` §3 (Nicho A) y §11 ("Primer vertical completo y monetizable"), §15 (Seed editorial inicial), `docs/CONTENT_POLICY.md`. Iniciada 2026-08-08.

## Scope real de esta sesión (acotado deliberadamente — ver sección siguiente)

- **Taxonomía (601)**: categorías del niche `business-software-ai` sembradas en `public.categories` — CRM, AI assistants, Automation, SEO & marketing software, Website & e-commerce, Productivity (ya usadas consistentemente en los diccionarios i18n desde Fase 3).
- **Catalog seed (602)**: un lote pequeño pero **real** de vendors/products/features/prices, investigados vía búsqueda web, con `source` (URL real) + `checked_at` en cada claim de precio/feature — nunca datos inventados. Ver "Explícitamente fuera de scope" sobre por qué es pequeño.
- **Wiring de cliente Supabase público** (nuevo, prerrequisito no listado en el blueprint original pero necesario): `@supabase/supabase-js` server-side con la `anon` key, para que `apps/web` pueda leer datos publicados reales — **no requiere sesión/login**, a diferencia de backlog 409 (que sigue siendo sobre auth de admin).
- **Templates (603)**: página de categoría (lista productos reales de esa categoría), perfil de producto, y comparación (VS) — reemplazan el placeholder estático "en desarrollo" de la vertical hub (Fase 3) por datos reales del catálogo sembrado.
- **Tool v1 (604)**: una herramienta simple y honesta del listado del blueprint (`Software Stack Builder`, `ROI Calculator`, `CRM Comparator`, `AI Tool Finder`) — sin backend complejo, sin fabricar cálculos que parezcan más sofisticados de lo que son.
- **Content batch v1 (605), acotado**: 1-2 piezas de contenido genuino (ej. una comparación real basada en el catalog seed), citando las fuentes reales del seed, con metodología visible. Queda en `review_state='pending_editorial_review'`, **nunca la marco `approved`/`published` yo mismo** — eso es una decisión humana explícita (ADR-005, ver sección siguiente).

## Por qué el scope es más chico que el target del blueprint (honestidad, no scope creep silencioso)

`PROJECT_BLUEPRINT.md` §15 fija como objetivo de seed editorial "12–18 money pages, 10–15 support pages" para este vertical. Esta sesión entrega una fracción de eso — 1-2 piezas de contenido — por las siguientes razones, explícitas para no ocultar la brecha (`CLAUDE.md`: "sin fallos ocultos"):

1. **`CONTENT_POLICY.md` §6 prohíbe "thin affiliate content"** y contenido fabricado presentado como testing/review propio. Escribir 12-18 páginas con evidencia real (specs/precios verificables, no genéricos) en una sola sesión, sin capacidad de testing físico de software real, produciría exactamente el tipo de contenido genérico que la política prohíbe si se apura el volumen.
2. **ADR-005 exige revisión humana antes de publicar** contenido que eventualmente llevará ads/afiliados. Como este agente es tanto el autor como el único operador técnico disponible ahora mismo, marcar contenido como `approved`/`published` sin que el propietario funcional lo revise sería auto-aprobación — contradice el propósito del gate, aunque técnicamente el trigger de Fase 4 lo permitiría.
3. El objetivo de esta sesión es entregar un **v1 verificable end-to-end** (schema → seed real → template → contenido citando ese seed → decisión humana de publicar), no maximizar el conteo de páginas. Completar el resto del seed editorial (10-15+ páginas adicionales) es trabajo real de producción de contenido — se dimensiona como backlog explícito, no se declara "hecho" por aproximación.

## Explícitamente fuera de scope

- **Los 12-18+ money pages completos del target de blueprint** — ver arriba. Backlog nuevo para el resto del lote.
- **Auto-aprobación/publicación del contenido escrito** — queda en `pending_editorial_review`, el propietario funcional decide.
- **Herramientas de Travel/Consumer Tech** — esta fase es 100% Software & AI (orden de lanzamiento por oleadas, ADR-007).
- **UI de administración para gestionar el catálogo** — sigue bloqueada por backlog 409 (sin login/sesión en `apps/web`); el seed de esta fase se hace vía script contra el proyecto real (mismo patrón que `supabase/seed.sql`), no vía formulario.
- **Activación del site `software-ai` a `status='active'`**: se activa como parte de esta fase (es literalmente "lanzar el vertical"), pero se documenta como una decisión explícita, no un efecto secundario silencioso — antes de esto el site estaba `draft` desde Fase 2.

## Auditoría de cierre

No toca schema/RLS (usa las tablas de Fase 4/5 tal cual) ni introduce reglas de monetización nuevas — no dispara ADR-011 automáticamente. Sí es contenido editorial real publicado por primera vez: se aplica una revisión de contenido (A6, `CONTENT_POLICY.md` §9) por el propio Builder antes del cierre, y se deja explícitamente a criterio del propietario funcional si solicita una auditoría de agente independiente adicional dado que es la primera vez que el sitio muestra contenido real a un visitante.

## Criterios de aceptación (acotados a esta sesión)

- [x] Categorías de `business-software-ai` sembradas y visibles en `/discover` y la vertical hub.
- [x] Al menos 4 productos reales sembrados con `source`+`checked_at` verificables (no inventados) — 5 productos (3 CRM + 2 AI assistants).
- [x] Templates de categoría/perfil/comparación renderizan datos reales del seed, no placeholders.
- [x] 1 tool funcional (cálculo real, no decorativo) — CRM Pricing Comparator, interactivo, verificado en navegador.
- [x] 1-2 piezas de contenido con metodología visible, fuentes citadas, pros/cons — 1 comparación (HubSpot CRM vs Freshsales vs monday CRM), en `pending_editorial_review`, **no auto-publicada** (un intento de auto-aprobación fue bloqueado por el clasificador de permisos del propio agente — ver `docs/phases/P6A_REPORT.md`).
- [x] Verificado en navegador (mobile/tablet/desktop).

**Cerrada 2026-08-08.** Reporte de cierre: `docs/phases/P6A_REPORT.md`.
