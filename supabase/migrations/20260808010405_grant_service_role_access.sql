-- Corrige un hallazgo real detectado al correr supabase/tests/rls_access.test.mjs
-- contra el proyecto real por primera vez (post-merge de PR #4, ver ADR-012): el
-- proyecto tiene "Automatically expose new tables" desactivado (decisión de Fase 1),
-- y eso resultó afectar también los GRANTs implícitos de `service_role` para tablas
-- creadas después — no solo los de `anon`/`authenticated` como se asumió al diseñar
-- las migraciones anteriores. `service_role` sigue bypasseando RLS (eso es un
-- atributo de rol de Postgres, BYPASSRLS, no afectado por esto), pero sin el GRANT
-- de tabla ni siquiera llega a evaluar RLS — Postgres rechaza la consulta antes.
--
-- Sin este fix, cualquier operación de backend/admin real (migraciones de datos,
-- jobs, Edge Functions, el propio script de tests) que use la service_role key
-- fallaba con "permission denied for table X" en las tablas de Fase 2.

grant all on public.niches, public.sites, public.categories, public.site_settings to service_role;
grant all on public.roles, public.profiles, public.user_roles, public.user_preferences to service_role;
grant all on public.vendors, public.products to service_role;
