-- Enriquecimiento del catálogo de Fase 6A (Software & AI), post-cierre, a pedido
-- explícito del propietario funcional: "las comparaciones son muy sencillas... como
-- podemos hacer esa comparacion mucho mejor... para atraer visitas". Agrega dimensiones
-- reales nuevas (billing_model, marketplace_integrations, seat_minimum, api_access,
-- team_plan) a los 5 productos ya sembrados en Fase 6A — investigadas vía WebFetch/
-- WebSearch el 2026-08-08. product_features es append-only: esto SUMA filas, no
-- modifica las existentes.
--
-- Nota de precisión (misma disciplina que llevó a descartar Luggage en Fase 6B):
-- se agregó `marketplace_integrations` solo para HubSpot porque es el único de los 3
-- CRMs cuya página oficial publica un número exacto ("2,000+ apps"). Freshsales y
-- monday.com tienen marketplace de apps pero ninguna página oficial fetcheada publicó
-- un conteo total — no se inventa un número para llenar la columna.

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'billing_model', 'Monthly or annual, no forced commitment — annual drops the price ~65% ($7/seat/mo vs $20/seat/mo billed monthly)', 'https://www.hubspot.com/pricing/crm', 'verified' from public.products where slug = 'hubspot-crm';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'marketplace_integrations', '2,000+ apps in the HubSpot App Marketplace', 'https://www.hubspot.com/products/crm', 'verified' from public.products where slug = 'hubspot-crm';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'billing_model', 'Annual billing required to get the listed $9/user/month rate (20% discount vs. paying monthly)', 'https://www.freshworks.com/crm/pricing/', 'verified' from public.products where slug = 'freshsales';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'seat_minimum', '3 seats minimum on Basic', 'https://monday.com/pricing', 'verified' from public.products where slug = 'monday-crm';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'billing_model', 'Annual billing required to get the listed $12/seat/month rate (up to 33% cheaper than paying monthly)', 'https://monday.com/pricing', 'verified' from public.products where slug = 'monday-crm';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'api_access', 'Not included — the OpenAI API is billed and metered separately from the ChatGPT Plus subscription', 'https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus', 'estimated' from public.products where slug = 'chatgpt';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'team_plan', 'ChatGPT Business (formerly Team): $20/seat/month billed annually, $25/seat/month billed monthly, 2-seat minimum', 'https://help.openai.com/en/articles/8792828-what-is-chatgpt-business', 'estimated' from public.products where slug = 'chatgpt';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'api_access', 'Not included — the Claude API is a separate product line with its own pricing', 'https://claude.com/pricing', 'verified' from public.products where slug = 'claude';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'team_plan', 'Team plan for 2-150 people: Standard seats $20/seat/month billed annually; Premium seats (5x usage) $100/seat/month billed annually', 'https://claude.com/pricing', 'verified' from public.products where slug = 'claude';
