# Fase 6B — Vertical 2: Travel & Smart Travel

Fuente: `docs/PROJECT_BLUEPRINT.md` §3 (Nicho B) y §11, §15 (seed editorial), `docs/CONTENT_POLICY.md`. Iniciada 2026-08-08, siguiendo el orden de oleadas (ADR-007: Software/AI → Travel → Consumer Tech).

## Scope real de esta sesión (acotado deliberadamente — mismo patrón que Fase 6A)

- **Taxonomía (611)**: las 6 categorías del niche `travel-smart-travel` ya usadas en los diccionarios i18n desde Fase 3 (Hotels, Destinations, Itineraries, eSIM & connectivity, Luggage, Travel tech) se siembran en `public.categories`. Nota: `PROJECT_BLUEPRINT.md` §3 lista 7 subcategorías para este nicho (incluye "movilidad local"), pero los diccionarios i18n (fuente ya congelada desde Fase 3) solo tienen 6 — se siembra la taxonomía real (6), no la del blueprint original, igual que hizo Fase 6A con `business-software-ai`.
- **Catalog seed (611/612, parcial)**: **1 de las 6 categorías** — `eSIM & connectivity` — con 3 vendors/productos reales (Airalo, Holafly, Nomad), investigados vía `WebFetch` directo contra las páginas oficiales de cada uno (los 3 fetches directos tuvieron éxito, a diferencia de Fase 6A donde 2 vendors bloquearon el fetch). Cada precio/feature lleva `source` (URL real) + `checked_at`, `confidence='verified'` en todos los casos.
- **Templates (612)**: reutiliza los templates genéricos de categoría/perfil/comparación construidos en Fase 6A (`[site]/[category]/page.tsx`, `[category]/[product]/page.tsx`) — no son específicos de Software & AI, ya estaban diseñados para cualquier niche. Se corrige un defecto real encontrado al extender a este vertical: el sufijo de precio estaba hardcodeado a `/month` (asumía `subscription_monthly`), lo cual sería una afirmación falsa para planes eSIM (`price_type='starting_at'`, no son suscripciones mensuales) — se generaliza por `price_type` antes de sembrar datos no-mensuales.
- **Tool v1 (613)**: `eSIM Data Plan Comparator` (del listado del blueprint: Trip Cost Planner, Destination Matcher, Hotel Comparison, Packing Planner — ninguno encaja con el catálogo real sembrado; se elige una herramienta nueva y honesta, coherente con el dato real disponible, en vez de forzar "Hotel Comparison" sin datos de hoteles reales).
- **Content batch v1 (614), acotado**: 1 pieza de contenido genuino (comparación Airalo vs Holafly vs Nomad, citando el seed real), `review_state='pending_editorial_review'` — **no se auto-aprueba** (ADR-005, mismo patrón que backlog 606 de Fase 6A, que sigue sin resolver).

## Por qué el scope es más chico que el target del blueprint

`PROJECT_BLUEPRINT.md` §15 fija 10-15 money/support pages para este vertical. Esta sesión entrega 1 categoría de 6 y 1 pieza de contenido, por las mismas razones documentadas en `docs/phases/P6A.md` (§6 `CONTENT_POLICY.md` no-thin-content, ADR-005 revisión humana) más una razón nueva específica de este vertical:

1. **Datos de precio dinámico no encajan en el modelo append-only actual.** Hoteles/vuelos tienen precios que cambian por fecha/disponibilidad en tiempo real — el schema de `product_prices` (Fase 4) fue diseñado para precios de catálogo relativamente estables (SaaS, productos físicos), no para tarifas dinámicas. Sembrar "el precio de un hotel" como si fuera un hecho estable de catálogo sería engañoso. Por eso esta fase no toca la categoría `Hotels` — queda explícitamente fuera, no es un olvido.
2. **Equipaje (`Luggage`) fue investigado pero descartado por inconsistencia de fuente**: Away bloqueó el fetch (404 en las URLs de producto probadas) y Samsonite mostró precios contradictorios para el mismo producto según color/promo activa ($129.99–$219.99 para el mismo SKU en la misma sesión de búsqueda) — sembrar ese dato como "el" precio verificado sería inventar precisión que la fuente no tiene. Se prefirió una categoría (`eSIM & connectivity`) donde los 3 vendors dieron datos limpios y consistentes vía fetch directo, en vez de forzar una segunda categoría con datos dudosos.
3. Mismo principio que Fase 6A: el objetivo es un **v1 verificable end-to-end**, no maximizar conteo de páginas. El resto del catálogo (Hotels, Destinations, Itineraries, Luggage, Travel tech) y el resto del lote editorial quedan como backlog explícito.

## Explícitamente fuera de scope

- **Categorías Hotels, Destinations, Itineraries, Luggage, Travel tech** — ver razones arriba. Backlog nuevo para completarlas.
- **Seasonality rules (615)** — requiere datos estacionales reales (temporadas alta/baja por destino) que no existen en el seed actual; no se fabrica.
- **Auto-aprobación/publicación del contenido escrito** — igual que Fase 6A, queda en `pending_editorial_review`.
- **UI de administración** — sigue bloqueada por backlog 409.
- **Activación del site `travel` a `status='active'`**: se activa como parte de esta fase (lanzamiento del vertical), documentado explícitamente, no efecto secundario silencioso.

## Auditoría de cierre

No toca schema/RLS (usa tablas de Fase 4/5 tal cual, solo agrega filas) ni introduce reglas de monetización nuevas — no dispara ADR-011 automáticamente. Sí corrige un defecto de template (sufijo `/month` hardcodeado) que afecta a Fase 6A también de forma retroactiva (el catálogo de Software & AI es 100% `subscription_monthly`, así que no tenía manifestación visible ahí, pero el bug ya existía). Revisión de contenido (A6, `CONTENT_POLICY.md` §9) por el propio Builder antes del cierre; auditoría de agente independiente adicional queda a criterio del propietario funcional.

## Criterios de aceptación (acotados a esta sesión)

- [x] Categorías de `travel-smart-travel` sembradas y visibles en `/discover` y la vertical hub.
- [x] Al menos 3 productos reales sembrados en `eSIM & connectivity` con `source`+`checked_at` verificables, `confidence='verified'` en todos.
- [x] Sufijo de precio en templates generalizado por `price_type` (no hardcodeado a `/month`).
- [x] Templates de categoría/perfil renderizan datos reales del seed de Travel.
- [x] 1 tool funcional (eSIM Data Plan Comparator), interactivo, verificado en navegador.
- [x] 1 pieza de contenido con metodología visible, fuentes citadas, en `pending_editorial_review`, no auto-publicada.
- [x] Verificado en navegador (mobile/desktop; ver `docs/phases/P6B_REPORT.md` para el detalle exacto de rutas probadas).

**Cerrada 2026-08-08.** Reporte de cierre: `docs/phases/P6B_REPORT.md`.
