-- Seed editorial de Consumer Tech & Smart Home (Fase 6C, backlog 621/622/625).
-- Slice acotado a Networking: el objetivo es validar catálogo -> template -> finder
-- con evidencia de fabricante, no afirmar pruebas físicas ni inventar cobertura.
-- Investigación comprobada 2026-08-09 contra fuentes oficiales. Cada precio y
-- especificación registra source y checked_at con la fecha de comprobación archivada.
--
-- No idempotente: igual que los seeds P6A/P6B, se aplica una vez tras el merge y
-- la revisión. Features/precios son append-only por diseño y re-ejecutarlo duplicaría
-- snapshots históricos.

begin;

-- La taxonomía de la vertical viaja con su seed específico. `seed.sql` sigue
-- inicializando el core, pero este bloque evita activar un vertical vacío si el
-- operador aplica únicamente el artefacto de Fase 6C.
insert into public.categories (niche_id, slug, name)
select id, slug, name from public.niches, (values
  ('smart-home', 'Smart home'),
  ('networking', 'Networking'),
  ('audio', 'Audio'),
  ('monitors', 'Monitors'),
  ('accessories', 'Accessories'),
  ('home-office', 'Home office'),
  ('creator-gear', 'Creator gear')
) as cat(slug, name)
where niches.slug = 'consumer-tech-smart-home'
on conflict (niche_id, slug) do nothing;

-- Vendors
insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'eero', 'eero', 'https://eero.com', 'published'
from public.niches where slug = 'consumer-tech-smart-home';

insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'google', 'Google', 'https://store.google.com', 'published'
from public.niches where slug = 'consumer-tech-smart-home';

insert into public.vendors (niche_id, slug, name, website_url, status)
select id, 'tp-link', 'TP-Link', 'https://www.tp-link.com', 'published'
from public.niches where slug = 'consumer-tech-smart-home';

-- Products (Networking)
insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'eero-7', 'eero 7', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'consumer-tech' and c.slug = 'networking' and c.niche_id = s.niche_id and v.slug = 'eero' and v.niche_id = s.niche_id;

insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'nest-wifi-pro', 'Google Nest Wifi Pro', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'consumer-tech' and c.slug = 'networking' and c.niche_id = s.niche_id and v.slug = 'google' and v.niche_id = s.niche_id;

insert into public.products (site_id, category_id, vendor_id, slug, name, status)
select s.id, c.id, v.id, 'deco-be63', 'TP-Link Deco BE63 (2-pack)', 'published'
from public.sites s, public.categories c, public.vendors v
where s.slug = 'consumer-tech' and c.slug = 'networking' and c.niche_id = s.niche_id and v.slug = 'tp-link' and v.niche_id = s.niche_id;

-- Prices. TP-Link's official technical page does not make a current price claim;
-- deliberately no price row is created for it rather than copying an unstable reseller price.
-- The source capture only preserves the verification day, so its timestamp is normalized
-- to noon UTC rather than pretending to know a more precise inspection time.
insert into public.product_prices (product_id, price_type, amount, currency, source, confidence, checked_at)
select id, 'list', 169.99, 'USD', 'https://eero.com/shop/eero-7', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'eero-7';

insert into public.product_prices (product_id, price_type, amount, currency, source, confidence, checked_at)
select id, 'starting_at', 199.99, 'USD', 'https://store.google.com/us/product/nest_wifi_pro_specs?hl=en-US', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'nest-wifi-pro';

-- eero 7: official product page (Wi-Fi 7, two 2.5 GbE ports, 2,000 sq ft / 120+ devices,
-- and Thread/Zigbee/Matter controller functionality).
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'wifi_standard', 'Wi-Fi 7', 'https://eero.com/shop/eero-7', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'eero-7';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'multi_gig_ethernet', 'Yes — two auto-sensing 2.5 GbE ports', 'https://eero.com/shop/eero-7', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'eero-7';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'smart_home_hub', 'Yes — Thread, Zigbee, and Matter controller', 'https://eero.com/shop/eero-7', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'eero-7';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'coverage', 'Up to 2,000 sq ft and 120+ devices per router', 'https://eero.com/shop/eero-7', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'eero-7';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'mesh_compatibility', 'Compatible with all eero generations', 'https://eero.com/shop/eero-7', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'eero-7';

-- Google Nest Wifi Pro: official specs page (Wi-Fi 6E, two 1 Gbps ports, Matter/Thread,
-- 2,200 sq ft and up to 100 devices per router). It cannot mesh with prior Nest/Google Wifi.
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'wifi_standard', 'Wi-Fi 6E', 'https://store.google.com/us/product/nest_wifi_pro_specs?hl=en-US', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'nest-wifi-pro';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'multi_gig_ethernet', 'No — two 1 Gbps Ethernet ports', 'https://store.google.com/us/product/nest_wifi_pro_specs?hl=en-US', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'nest-wifi-pro';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'smart_home_hub', 'Yes — Matter and built-in Thread border router', 'https://store.google.com/us/product/nest_wifi_pro_specs?hl=en-US', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'nest-wifi-pro';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'coverage', 'Up to 2,200 sq ft and up to 100 connected devices per router', 'https://store.google.com/us/product/nest_wifi_pro_specs?hl=en-US', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'nest-wifi-pro';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'mesh_compatibility', 'Cannot combine in a mesh with previous-generation Nest Wifi or Google Wifi', 'https://store.google.com/us/product/nest_wifi_pro_specs?hl=en-US', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'nest-wifi-pro';

-- TP-Link Deco BE63: official product page (Wi-Fi 7, four 2.5 Gbps ports per unit,
-- optional Ethernet backhaul). Its source does not claim an integrated Matter/Thread/Zigbee hub.
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'wifi_standard', 'Wi-Fi 7', 'https://www.tp-link.com/us/deco-mesh-wifi/product-family/deco-be63/', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'deco-be63';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'multi_gig_ethernet', 'Yes — four 2.5 Gbps WAN/LAN ports per Deco unit', 'https://www.tp-link.com/us/deco-mesh-wifi/product-family/deco-be63/', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'deco-be63';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'smart_home_hub', 'No integrated Matter, Thread, or Zigbee hub claimed on the source', 'https://www.tp-link.com/us/deco-mesh-wifi/product-family/deco-be63/', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'deco-be63';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'wired_backhaul', 'Optional Ethernet backhaul supported', 'https://www.tp-link.com/us/deco-mesh-wifi/product-family/deco-be63/', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'deco-be63';
insert into public.product_features (product_id, feature_key, feature_value, source, confidence, checked_at)
select id, 'wireless_bands', 'Tri-band: 2.4 GHz, 5 GHz, and 6 GHz', 'https://www.tp-link.com/us/deco-mesh-wifi/product-family/deco-be63/', 'verified', timestamptz '2026-08-09 12:00:00+00'
from public.products where slug = 'deco-be63';

-- Draft editorial comparison (625). It intentionally remains in review: no current_version,
-- no approved state and no public exposure until the owner supplies a human decision.
insert into public.content_items (site_id, category_id, content_type, slug, title, status)
select s.id, c.id, 'vs', 'eero-7-vs-nest-wifi-pro-vs-deco-be63',
  'eero 7 vs Nest Wifi Pro vs Deco BE63: a specs-based mesh Wi-Fi comparison', 'in_review'
from public.sites s, public.categories c
where s.slug = 'consumer-tech' and c.slug = 'networking' and c.niche_id = s.niche_id;

insert into public.content_versions (content_item_id, version_number, body, review_state)
select ci.id, 1,
  jsonb_build_object(
    'methodology', 'Specification comparison only. We did not perform hands-on coverage, reliability, or throughput testing.',
    'scope', 'Wi-Fi generation, Ethernet ports, smart-home hub claims, and manufacturer-published pricing where available.'
  ),
  'pending_editorial_review'
from public.content_items ci
where ci.slug = 'eero-7-vs-nest-wifi-pro-vs-deco-be63'
  and ci.site_id = (select id from public.sites where slug = 'consumer-tech');

insert into public.content_blocks (content_version_id, block_type, block_data, sort_order)
select cv.id, 'intro', jsonb_build_object(
  'text', 'This is a comparison of manufacturer-published specifications, not a hands-on test. Coverage, throughput, and reliability will vary with your connection, home layout, devices, and placement.'
), 0
from public.content_versions cv
join public.content_items ci on ci.id = cv.content_item_id
where ci.slug = 'eero-7-vs-nest-wifi-pro-vs-deco-be63' and cv.version_number = 1;

insert into public.content_blocks (content_version_id, block_type, block_data, sort_order)
select cv.id, 'conclusion', jsonb_build_object(
  'text', 'Choose based on the requirements you can verify: Wi-Fi 7 and multi-gig ports are published for eero 7 and Deco BE63; Google publishes Matter and Thread support for Nest Wifi Pro. These are feature differences, not an editorial ranking.'
), 1
from public.content_versions cv
join public.content_items ci on ci.id = cv.content_item_id
where ci.slug = 'eero-7-vs-nest-wifi-pro-vs-deco-be63' and cv.version_number = 1;

insert into public.content_product_links (content_item_id, product_id, role, sort_order)
select ci.id, p.id, 'mentioned', case p.slug when 'eero-7' then 0 when 'nest-wifi-pro' then 1 else 2 end
from public.content_items ci
join public.products p on p.slug in ('eero-7', 'nest-wifi-pro', 'deco-be63')
where ci.slug = 'eero-7-vs-nest-wifi-pro-vs-deco-be63'
  and ci.site_id = p.site_id;

insert into public.content_sources (content_version_id, source_url, source_label)
select cv.id, source_url, source_label
from public.content_versions cv
join public.content_items ci on ci.id = cv.content_item_id
cross join (values
  ('https://eero.com/shop/eero-7', 'eero 7 official product page'),
  ('https://store.google.com/us/product/nest_wifi_pro_specs?hl=en-US', 'Google Nest Wifi Pro official specifications'),
  ('https://www.tp-link.com/us/deco-mesh-wifi/product-family/deco-be63/', 'TP-Link Deco BE63 official product page')
) as sources(source_url, source_label)
where ci.slug = 'eero-7-vs-nest-wifi-pro-vs-deco-be63' and cv.version_number = 1;

-- Nunca activar la vertical si el seed no produjo el catálogo mínimo esperado.
do $$
declare
  v_site_id uuid;
  v_networking_category_id uuid;
  v_product_count int;
begin
  select id into v_site_id from public.sites where slug = 'consumer-tech';
  if v_site_id is null then
    raise exception 'P6C requiere el site consumer-tech de seed.sql antes de aplicar este seed';
  end if;

  select c.id into v_networking_category_id
  from public.categories c
  join public.sites s on s.niche_id = c.niche_id
  where s.id = v_site_id and c.slug = 'networking';
  if v_networking_category_id is null then
    raise exception 'P6C no encontró la categoría networking para consumer-tech';
  end if;

  select count(*) into v_product_count
  from public.products
  where site_id = v_site_id
    and category_id = v_networking_category_id
    and slug in ('eero-7', 'nest-wifi-pro', 'deco-be63');
  if v_product_count <> 3 then
    raise exception 'P6C esperaba 3 productos de networking antes de activar consumer-tech; encontró %', v_product_count;
  end if;
end;
$$;

-- Explicit vertical launch decision for this phase; not an accidental consequence of the seed.
update public.sites set status = 'active', updated_at = now() where slug = 'consumer-tech';

commit;
