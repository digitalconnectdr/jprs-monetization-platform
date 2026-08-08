-- Corrige los hallazgos de docs/audits/P5_AUDIT.md (auditoría independiente
-- obligatoria por ADR-011, A3+A7 — Fase 5 toca schema/RLS y monetización/afiliados).
-- Veredicto original: GO CON CONDICIONES — 1 High + 1 Low.
--
-- Las migraciones de Fase 5 ya estaban aplicadas al único proyecto Supabase real
-- (ADR-012, sin ambiente separado) cuando se encontró el hallazgo High, así que quedaba
-- explotable en producción — se corrige en una migración nueva, no editando la ya
-- aplicada (20260808040050_fix_niche_scope_rls.sql).

-- F-01 (High): site_niche_id/has_role_in_niche son SECURITY DEFINER sin ningún chequeo
-- de autorización interno. PostgreSQL otorga EXECUTE a PUBLIC por defecto al crear una
-- función — el GRANT explícito a authenticated/service_role en la migración original
-- era cosmético, PUBLIC (que incluye anon) ya tenía el privilegio desde el CREATE
-- FUNCTION. Confirmado empíricamente por el auditor: cualquier visitante sin sesión
-- podía llamar rpc/site_niche_id con cualquier UUID de site y obtener su niche_id real,
-- incluyendo sites en draft que ninguna policy expone a anon.
--
-- Revocar de PUBLIC es seguro: ninguna tabla cuyas policies usan estas dos funciones
-- tiene una policy de lectura pública coexistente (affiliate_programs/terms/offers/
-- links, lead_routes son todas admin/editor-only) — anon pasa de recibir "0 filas"
-- (RLS silenciosa) a "permission denied" (bloqueo explícito) en esas tablas, sin
-- afectar ningún camino legítimo de anon/authenticated con el GRANT ya existente.
revoke execute on function public.site_niche_id(uuid) from public;
revoke execute on function public.has_role_in_niche(text, uuid) from public;

-- F-02 (Low): el CHECK constraint de monetization_rules comparaba 'ads' con igualdad
-- de string exacta — 'Ads'/'ADS'/' ads' evadían el bloqueo en page_type prohibidos.
-- Postgres no permite subqueries (ni EXISTS+unnest) dentro de un CHECK constraint, así
-- que en vez de normalizar mayúsculas/espacios en el propio constraint, se restringe
-- allowed_layers a un vocabulario fijo de valores exactos en minúscula — una vez que
-- solo 'ads'/'affiliate'/'lead'/'sponsor' (sin variantes) pueden existir en la columna,
-- la comparación de igualdad original ('ads' = any(allowed_layers)) vuelve a ser
-- confiable, porque ninguna variante como 'Ads' puede llegar a insertarse siquiera.
alter table public.monetization_rules add constraint monetization_rules_allowed_layers_vocabulary check (
  allowed_layers <@ array['ads', 'affiliate', 'lead', 'sponsor']::text[]
);
