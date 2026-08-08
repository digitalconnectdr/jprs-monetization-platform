-- GRANT explícito a service_role para las tablas nuevas de Fase 4 — se hace desde el
-- día uno en esta migración (no post-merge como en Fase 2) para no repetir el
-- hallazgo F-07 de docs/audits/P2_AUDIT.md, ahora documentado como deuda conocida en
-- docs/DATA_DICTIONARY.md. "Automatically expose new tables" sigue desactivado en el
-- proyecto (decisión de Fase 1), así que toda tabla nueva necesita este GRANT
-- explícito además de RLS, sin excepción — service_role bypasea RLS pero no el GRANT
-- de tabla, que Postgres evalúa antes.

grant all on public.product_variants, public.product_features, public.product_prices, public.product_media to service_role;
grant all on public.content_items, public.content_versions, public.content_blocks, public.content_product_links, public.content_sources to service_role;
grant all on public.freshness_checks to service_role;
grant execute on function public.import_product_prices(jsonb) to service_role;
