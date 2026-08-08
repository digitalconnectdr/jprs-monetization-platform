-- Seed editorial real del vertical Travel & Smart Travel (Fase 6B, backlog 611/612).
-- Igual que supabase/seed_p6a_software_ai.sql: contenido de catálogo específico de la
-- vertical, investigado vía WebFetch directo contra las páginas oficiales de cada
-- vendor el 2026-08-08. Cada precio/feature lleva su `source` (URL real) y
-- `checked_at` — nunca datos inventados (CONTENT_POLICY.md §3).
--
-- Acotado a 1 de las 6 categorías del niche: `eSIM & connectivity`. Ver
-- docs/phases/P6B.md "Por qué el scope es más chico..." — Hotels/Destinations quedan
-- fuera porque el schema de product_prices (Fase 4) asume precios de catálogo
-- relativamente estables, no tarifas dinámicas por fecha/disponibilidad; Luggage fue
-- investigado (Away, Samsonite) pero descartado por fuentes inconsistentes (Away
-- bloqueó el fetch, Samsonite mostró 3 precios distintos para el mismo SKU en la misma
-- sesión de búsqueda según color/promo activa).
--
-- confidence='verified' en las 3 filas de precio: los 3 fetches directos (a diferencia
-- de Fase 6A, donde OpenAI y Pipedrive bloquearon el fetch) tuvieron éxito contra la
-- página oficial de cada vendor.
--
-- No idempotente por diseño simple, igual que seed_p6a_software_ai.sql — aplicado una
-- sola vez al proyecto real vía script (ver docs/phases/P6B_REPORT.md).

-- Vendors
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'airalo', 'Airalo', 'https://www.airalo.com', 'published' from public.niches where slug = 'travel-smart-travel';
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'holafly', 'Holafly', 'https://esim.holafly.com', 'published' from public.niches where slug = 'travel-smart-travel';
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'nomad', 'Nomad', 'https://www.nomadesim.com', 'published' from public.niches where slug = 'travel-smart-travel';

-- Products (eSIM & connectivity — planes regionales de Europa, el destino más
-- comparable entre los 3 vendors al momento de la investigación)
insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'airalo-europe-esim', 'Airalo Europe eSIM', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'travel' and c.slug = 'esim-connectivity' and c.niche_id = s.niche_id and v.slug = 'airalo';

insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'holafly-europe-esim', 'Holafly Europe eSIM', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'travel' and c.slug = 'esim-connectivity' and c.niche_id = s.niche_id and v.slug = 'holafly';

insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'nomad-europe-esim', 'Nomad Europe eSIM', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'travel' and c.slug = 'esim-connectivity' and c.niche_id = s.niche_id and v.slug = 'nomad';

-- Prices (plan de entrada más barato de cada vendor para cobertura Europa, USD).
-- price_type='starting_at' — NO son suscripciones mensuales (a diferencia del seed de
-- Fase 6A), son paquetes prepago de validez fija. Ver apps/web/src/lib/catalog-price.ts
-- (Fase 6B) para el sufijo de UI correcto según price_type.
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence)
select id, 'starting_at', 11.50, 'USD', 'https://www.airalo.com/europe-esim', 'verified' from public.products where slug = 'airalo-europe-esim';
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence)
select id, 'starting_at', 11.90, 'USD', 'https://esim.holafly.com/esim-europe/', 'verified' from public.products where slug = 'holafly-europe-esim';
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence)
select id, 'starting_at', 5.50, 'USD', 'https://www.nomadesim.com/europe-eSIM', 'verified' from public.products where slug = 'nomad-europe-esim';

-- Features
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'entry_plan', '3 days, unlimited data — $11.50', 'https://www.airalo.com/europe-esim', 'verified' from public.products where slug = 'airalo-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'data_model', 'Unlimited data per day, tiered by validity length (3-30 days)', 'https://www.airalo.com/europe-esim', 'verified' from public.products where slug = 'airalo-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'largest_plan', '30 days, unlimited data — $71.00', 'https://www.airalo.com/europe-esim', 'verified' from public.products where slug = 'airalo-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'coverage', '41 countries/networks in Europe', 'https://www.airalo.com/europe-esim', 'verified' from public.products where slug = 'airalo-europe-esim';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'entry_plan', '3 days, unlimited data — $11.90', 'https://esim.holafly.com/esim-europe/', 'verified' from public.products where slug = 'holafly-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'data_model', 'Unlimited data per day, tiered by validity length (3-30 days)', 'https://esim.holafly.com/esim-europe/', 'verified' from public.products where slug = 'holafly-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'largest_plan', '30 days, unlimited data — $73.90', 'https://esim.holafly.com/esim-europe/', 'verified' from public.products where slug = 'holafly-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'coverage', '33 European countries, includes 1GB/month backup data ("Always On") in 150+ countries', 'https://esim.holafly.com/esim-europe/', 'verified' from public.products where slug = 'holafly-europe-esim';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'entry_plan', '1 GB, 7 days — $5.50', 'https://www.nomadesim.com/europe-eSIM', 'verified' from public.products where slug = 'nomad-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'data_model', 'Fixed data allowance in GB per plan — not unlimited', 'https://www.nomadesim.com/europe-eSIM', 'verified' from public.products where slug = 'nomad-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'largest_plan', '50 GB, 30 days — $35.00 (sale price at time of check)', 'https://www.nomadesim.com/europe-eSIM', 'verified' from public.products where slug = 'nomad-europe-esim';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'coverage', '35-36 European countries', 'https://www.nomadesim.com/europe-eSIM', 'verified' from public.products where slug = 'nomad-europe-esim';
