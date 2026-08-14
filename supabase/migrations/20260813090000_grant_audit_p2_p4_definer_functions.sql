-- Backlog 411: revisión sistemática de GRANT/REVOKE EXECUTE en funciones
-- SECURITY DEFINER de Fases 2/4 (has_role, is_admin_for_site, is_admin_for_niche,
-- import_product_prices). Motivada por el hallazgo real de backlog 409/706:
-- revenue_events tenía una policy RLS correcta pero le faltaba el GRANT SELECT a
-- authenticated, invisible hasta que existió una sesión autenticada real.
--
-- Hallazgo de esta revisión: ninguna de esas 4 funciones tenía nunca un REVOKE
-- EXECUTE FROM PUBLIC explícito — dependían del privilegio implícito que Postgres
-- otorga a PUBLIC en CREATE FUNCTION. A diferencia de site_niche_id/has_role_in_niche
-- (Fase 5, F-01 de docs/audits/P5_AUDIT.md) o compute_structural_roe_scores (Fase 7),
-- que sí siguen el patrón explícito, estas quedaron fuera. Una revisión independiente
-- (agente separado, ver docs/phases/) encontró un quinto caso de la misma categoría
-- fuera del rango original de Fases 2/4: import_revenue_events (Fase 5), con
-- exactamente el mismo patrón que import_product_prices (RPC independiente, no
-- referenciada en ninguna policy, con chequeo de autorización interno) — se incluye
-- aquí también en vez de abrir un backlog nuevo para un hallazgo idéntico.
--
-- Verificado ANTES de tocar nada (no explotable, pero con una trampa real si se
-- revoca sin cuidado): has_role/is_admin_for_site/is_admin_for_niche se referencian
-- dentro de policies RLS "FOR ALL" combinadas por OR con policies de lectura pública
-- (ej. catalog_minimal.sql: products_public_read_published OR
-- products_admin_editor_write) sobre tablas donde `anon` tiene GRANT SELECT directo
-- (vendors, products, product_variants/features/prices/media, content_items y su
-- cadena, lead_forms, niches, sites, categories — el cliente público de packages/db
-- usa la anon key). Postgres evalúa el operando derecho de un OR de policy para las
-- filas donde el izquierdo es falso (ej. filas draft) — eso SÍ invoca la función
-- incluso para `anon`. Revocar sin volver a otorgar a `anon` habría roto el sitio
-- público entero (permission denied en cada fila no publicada evaluada).
--
-- Por eso se revoca de PUBLIC y se vuelve a otorgar exactamente al mismo conjunto de
-- roles que ya tenían acceso implícito (anon, authenticated, service_role) — mismo
-- comportamiento efectivo, ahora explícito y auditable, sin reducir ni ampliar acceso.
revoke execute on function public.has_role(text, uuid) from public;
grant execute on function public.has_role(text, uuid) to anon, authenticated, service_role;

revoke execute on function public.is_admin_for_site(uuid) from public;
grant execute on function public.is_admin_for_site(uuid) to anon, authenticated, service_role;

revoke execute on function public.is_admin_for_niche(uuid) from public;
grant execute on function public.is_admin_for_niche(uuid) to anon, authenticated, service_role;

-- import_product_prices e import_revenue_events, a diferencia de las 3 anteriores, NO
-- se referencian dentro de ninguna policy RLS — son funciones RPC de importación
-- masiva independientes, cada una con su propio chequeo de autorización interno
-- (import_product_prices: has_role/is_admin_for_site del caller por fila, comentario
-- original "SECURITY DEFINER no bypasea el chequeo de rol"; import_revenue_events:
-- has_role('super_admin') una sola vez al inicio). anon nunca logra escribir nada en
-- ninguna de las dos sin sesión, pero sí podía invocarlas hoy con hasta 500 filas por
-- llamada sin ser autorizado — sondeo/DoS anónimo de bajo riesgo, no una
-- vulnerabilidad de datos. Revocar de PUBLIC (ambas ya tienen GRANT explícito a
-- authenticated y service_role de migraciones previas, que un REVOKE FROM PUBLIC no
-- toca) cierra esa superficie sin afectar a ningún caller legítimo.
revoke execute on function public.import_product_prices(jsonb) from public;
revoke execute on function public.import_revenue_events(jsonb) from public;
