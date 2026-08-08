-- Seed editorial real del vertical Business Software & AI (Fase 6A, backlog 602).
-- A diferencia de supabase/seed.sql (datos foundational, cualquier fase), este archivo
-- es contenido de catálogo específico de la vertical, investigado vía búsqueda web
-- contra las páginas oficiales de cada vendor el 2026-08-08. Cada precio/feature lleva
-- su `source` (URL real) y `checked_at` — nunca datos inventados (CONTENT_POLICY.md §3).
--
-- confidence='verified' donde se pudo leer la página oficial directamente (WebFetch
-- exitoso); confidence='estimated' donde la cifra viene corroborada por múltiples
-- fuentes secundarias que citan la página oficial, pero el fetch directo del agente
-- fue bloqueado por protección anti-bot (ej. OpenAI) — la URL sigue siendo la fuente
-- oficial real, verificable por un humano en el navegador.
--
-- No idempotente por diseño simple (a diferencia de seed.sql): pensado para correrse
-- una vez contra un proyecto limpio. Re-ejecutarlo crearía vendors/products duplicados
-- (unique constraint por slug lo evitaría a nivel de vendors/products, pero product_prices/
-- product_features son append-only y NO tienen unique constraint — correrlo dos veces
-- duplicaría filas de precio/feature). Aplicado una sola vez al proyecto real vía script
-- (ver docs/phases/P6A_REPORT.md) — el catálogo real de administración de contenido
-- llega cuando exista UI de admin (backlog 409).

-- Vendors
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'hubspot', 'HubSpot', 'https://www.hubspot.com', 'published' from public.niches where slug = 'business-software-ai';
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'freshworks', 'Freshworks', 'https://www.freshworks.com', 'published' from public.niches where slug = 'business-software-ai';
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'monday', 'monday.com', 'https://monday.com', 'published' from public.niches where slug = 'business-software-ai';
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'openai', 'OpenAI', 'https://openai.com', 'published' from public.niches where slug = 'business-software-ai';
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'anthropic', 'Anthropic', 'https://www.anthropic.com', 'published' from public.niches where slug = 'business-software-ai';

-- Products (CRM)
insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'hubspot-crm', 'HubSpot CRM', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'software-ai' and c.slug = 'crm' and c.niche_id = s.niche_id and v.slug = 'hubspot';

insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'freshsales', 'Freshsales', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'software-ai' and c.slug = 'crm' and c.niche_id = s.niche_id and v.slug = 'freshworks';

insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'monday-crm', 'monday CRM', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'software-ai' and c.slug = 'crm' and c.niche_id = s.niche_id and v.slug = 'monday';

-- Products (AI Assistants)
insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'chatgpt', 'ChatGPT', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'software-ai' and c.slug = 'ai-assistants' and c.niche_id = s.niche_id and v.slug = 'openai';

insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'claude', 'Claude', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'software-ai' and c.slug = 'ai-assistants' and c.niche_id = s.niche_id and v.slug = 'anthropic';

-- Prices (entry-level paid tier de cada producto, USD/mes por seat o usuario)
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence)
select id, 'subscription_monthly', 20.00, 'USD', 'https://www.hubspot.com/pricing/crm', 'verified' from public.products where slug = 'hubspot-crm';
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence)
select id, 'subscription_monthly', 9.00, 'USD', 'https://www.freshworks.com/crm/pricing/', 'verified' from public.products where slug = 'freshsales';
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence)
select id, 'subscription_monthly', 12.00, 'USD', 'https://monday.com/pricing', 'verified' from public.products where slug = 'monday-crm';
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence)
select id, 'subscription_monthly', 20.00, 'USD', 'https://openai.com/chatgpt/pricing/', 'estimated' from public.products where slug = 'chatgpt';
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence)
select id, 'subscription_monthly', 20.00, 'USD', 'https://claude.com/pricing', 'verified' from public.products where slug = 'claude';

-- Features (1-2 claims verificables por producto). Valores en INGLÉS a propósito: el
-- schema de catalog (Fase 4) no soporta feature_value por locale (una sola fila
-- global, no una por idioma) — mantener el dato crudo en inglés evita mezclar idiomas
-- dentro de una página ya traducida (el resto del shell público sí es multi-idioma vía
-- diccionarios, ver docs/DESIGN_SYSTEM.md §7; el catálogo real todavía no lo es).
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'free_tier', 'Yes — up to 2 users, 1,000 contacts', 'https://www.hubspot.com/pricing/crm', 'verified' from public.products where slug = 'hubspot-crm';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'entry_plan_name', 'Starter', 'https://www.hubspot.com/pricing/crm', 'verified' from public.products where slug = 'hubspot-crm';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'free_tier', 'No — 21-day free trial only', 'https://www.freshworks.com/crm/pricing/', 'verified' from public.products where slug = 'freshsales';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'entry_plan_name', 'Growth', 'https://www.freshworks.com/crm/pricing/', 'verified' from public.products where slug = 'freshsales';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'entry_plan_name', 'Basic', 'https://monday.com/pricing', 'verified' from public.products where slug = 'monday-crm';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'entry_plan_contacts_limit', '1,000 active contacts and deals', 'https://monday.com/pricing', 'verified' from public.products where slug = 'monday-crm';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'free_tier', 'Yes — with usage limits', 'https://openai.com/chatgpt/pricing/', 'estimated' from public.products where slug = 'chatgpt';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'entry_paid_plan_name', 'Plus', 'https://openai.com/chatgpt/pricing/', 'estimated' from public.products where slug = 'chatgpt';

insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'free_tier', 'Yes — with usage limits', 'https://claude.com/pricing', 'verified' from public.products where slug = 'claude';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence)
select id, 'annual_discount', 'Pro drops to $17/month with annual billing (vs. $20/month monthly)', 'https://claude.com/pricing', 'verified' from public.products where slug = 'claude';
