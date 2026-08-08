# Fase 6B — Reporte de cierre

Vertical 2: Travel & Smart Travel. Scope: `docs/phases/P6B.md`. Cerrada 2026-08-08.

## Qué se entregó

- **611 (taxonomía)**: 6 categorías de `travel-smart-travel` sembradas en `public.categories` (Hotels, Destinations, Itineraries, eSIM & connectivity, Luggage, Travel tech) — visibles en `/discover` y en la vertical hub.
- **611/612 (catalog seed, parcial — 1 de 6 categorías)**: 3 vendors/productos reales en `eSIM & connectivity` (Airalo, Holafly, Nomad, planes de Europa), investigados vía `WebFetch` directo contra la página oficial de cada uno el 2026-08-08. `confidence='verified'` en las 3 filas de precio y las 12 filas de features — los 3 fetches directos tuvieron éxito (a diferencia de Fase 6A, donde 2 de 5 vendors bloquearon el fetch).
- **612 (templates)**: reutiliza los templates genéricos de categoría/perfil/comparación de Fase 6A sin cambios estructurales — confirma que ese trabajo efectivamente era reusable entre verticales, como se documentó en su momento.
- **613 (tool v1)**: `eSIM Data Plan Comparator` (`/[locale]/travel/tools/esim-comparator`) — interactivo, verificado con toggle real de checkboxes vía `javascript_tool` (misma técnica que Fase 6A; los clicks por coordenada del `computer` tool siguen siendo poco confiables en este entorno).
- **614 (content batch v1, parcial — 1 pieza)**: "Airalo vs Holafly vs Nomad: Best eSIM for Europe Travel" — comparación real citando las 3 fuentes del seed, `review_state='pending_editorial_review'`, **no auto-publicada** (mismo gate de ADR-005 que backlog 606 de Fase 6A, que sigue sin resolver).
- Site `travel` activado (`draft` → `active`).

## Defecto real encontrado y corregido (no específico de Travel, retroactivo a Fase 6A)

El sufijo de precio en los templates de catálogo (`[category]/page.tsx`, `[category]/[product]/page.tsx`, y el `ComparisonTableBlock` del renderer de guías) estaba **hardcodeado a `/month`**, asumiendo que todo `product_prices.price_type` era `subscription_monthly`. Eso era invisible en Fase 6A porque su catálogo (CRM, ChatGPT, Claude) es 100% suscripciones mensuales — pero habría mostrado "$11.50/month" para un plan eSIM prepago de 3 días, una afirmación factualmente falsa.

Corregido antes de sembrar el catálogo de Travel:
- Nuevo `apps/web/src/lib/catalog-price.ts` (`priceSuffix(dictionary, priceType)`) — devuelve `/month` solo para `subscription_monthly`, `/year` para `subscription_yearly`, cadena vacía para el resto (`list`, `sale`, `starting_at`).
- `dictionary.ts` + los 5 locales: nuevo campo `catalog.perYear`.
- `ComparisonTableBlock` (usado por `guides/[slug]/page.tsx`) generalizado: antes tenía hardcodeado el path `/${site}/crm/${slug}` y la feature key `entry_plan_name` — ahora recibe `categorySlug` y `entryPlanFeatureKey` desde `block_data`, con default (`crm`/`entry_plan_name`) que preserva el comportamiento exacto del contenido ya sembrado en Fase 6A sin necesidad de migrar esos datos.
- Verificado sin regresión: la categoría CRM de Fase 6A sigue mostrando `$20.00/month` correctamente después del cambio (ver captura de verificación en navegador de esta sesión).

## Por qué el catálogo real solo cubre 1 de 6 categorías

Documentado con más detalle en `docs/phases/P6B.md`, resumen:
1. **Hoteles/vuelos tienen precio dinámico** (por fecha/disponibilidad) — el modelo de `product_prices` (Fase 4) fue diseñado para catálogo relativamente estable, no tarifas en tiempo real. Sembrar "el precio" de un hotel como hecho de catálogo estable sería engañoso, así que la categoría `Hotels` queda deliberadamente vacía.
2. **`Luggage` fue investigado y descartado por datos inconsistentes**: `WebFetch` a Away (`awaytravel.com`, dos rutas de producto probadas) devolvió 404 ambas veces; Samsonite mostró 3 precios distintos ($129.99 / $149.99 / $159.99 / $219.99 según color/promo) para el mismo SKU (Freeform Carry-On Spinner) en la misma búsqueda — sembrar cualquiera de esos como "el" precio verificado habría sido una precisión falsa. Se prefirió una categoría con datos limpios (eSIM) en vez de forzar una segunda categoría con fuente dudosa.
3. Mismo criterio que Fase 6A: **v1 verificable end-to-end**, no maximizar conteo de páginas.

## Auditoría

No se disparó ADR-011 (no toca schema/RLS, no agrega reglas de monetización nuevas — solo agrega filas a tablas de Fase 4/5 y corrige un bug de presentación en el frontend). Autorevisión de contenido (A6, `CONTENT_POLICY.md` §9) aplicada antes del cierre: el borrador no reclama testing físico de las eSIM (se declara explícitamente en el bloque intro que es una comparación de precios/planes publicados, no una review de red/velocidad real), cita las 3 fuentes reales, y no determina ranking por comisión de afiliado (no hay afiliación conectada todavía — mismo estado que backlog 608 de Fase 6A).

## Verificado en navegador

`/en/travel`, `/en/travel/esim-connectivity`, `/en/travel/esim-connectivity/airalo-europe-esim`, `/en/travel/tools/esim-comparator` (interactividad confirmada), `/en/discover` (Travel ahora con categorías reales, Consumer Tech sigue en placeholder). Confirmado que `/en/travel/guides/airalo-vs-holafly-vs-nomad-europe-esim` devuelve 404 público (contenido no aprobado, ADR-005 sostenido). Verificado también en viewport mobile (375px) sin regresión de contenido. Regresión de Fase 6A verificada: `/en/software-ai/crm` y el CRM Pricing Comparator siguen mostrando `/month` correctamente tras el cambio de `priceSuffix`.

## Backlog resultante

- **606** (Fase 6A, sigue abierto): decisión humana sobre el artículo de CRM.
- **616** (nuevo): decisión humana sobre el artículo de eSIM de esta fase — mismo patrón, no se auto-aprueba.
- **617** (nuevo): completar el resto del catálogo de Travel (Hotels, Destinations, Itineraries, Luggage, Travel tech) — Hotels requiere resolver primero el problema de precio dinámico (posible: no sembrar como `product_prices`, o un modelo de rango/"desde"; decisión de producto, no solo técnica).
- **618** (nuevo): conectar `affiliate_links` reales — mismo motivo que 608 (requiere aprobación real de programas de afiliados, fuera del alcance de un agente autónomo).
- **615** (ya existía, Seasonality rules): sigue TODO — requiere datos estacionales reales por destino que no existen todavía.
