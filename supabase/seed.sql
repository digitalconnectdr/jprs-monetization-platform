-- Seed controlado, idempotente (safe to re-run — insert ... on conflict do nothing).
-- No sobrescribir históricos: precios/comisiones/métricas son series temporales (ver
-- docs/PROJECT_BLUEPRINT.md §5). Catálogo real (vendors/products) llega en Fase 4 — no se
-- siembra aquí.

-- Roles RBAC (PROJECT_BLUEPRINT.md §5.1)
insert into public.roles (name, description) values
  ('super_admin', 'Configuración global, integraciones, roles, monetización, auditorías, todos los verticales.'),
  ('admin', 'Productos, contenidos, campañas, nichos, analytics, usuarios según scope.'),
  ('editor', 'Crear/editar contenido y productos; no ve secretos ni configuración crítica.'),
  ('analyst', 'Solo lectura de analytics/exportes.'),
  ('user', 'Cuenta personal, favoritos, comparaciones, alertas, preferencias y newsletter.'),
  ('vendor', 'Gestionar perfil reclamado, promos y analytics limitados. (Futuro)')
on conflict (name) do nothing;

-- Niches (los 3 verticales MVP, PROJECT_BLUEPRINT.md §3)
insert into public.niches (slug, name, description, status) values
  ('business-software-ai', 'Business Software & AI', 'CRM, AI assistants, automation, SEO/marketing software, website/e-commerce, productivity.', 'active'),
  ('travel-smart-travel', 'Travel & Smart Travel', 'Hoteles, destinos, itinerarios, eSIM/conectividad, equipaje, travel tech, movilidad local.', 'active'),
  ('consumer-tech-smart-home', 'Consumer Tech & Smart Home', 'Smart home, networking, audio, monitors, accessories, home office, creator gear.', 'active')
on conflict (slug) do nothing;

-- Sites: 1 por niche en MVP (orden de lanzamiento por oleadas — todos 'draft' hasta
-- su respectiva Fase 6A/6B/6C; el orden de lanzamiento real se controla ahí, no aquí).
insert into public.sites (niche_id, slug, name, status)
select id, 'software-ai', 'Software & AI', 'draft' from public.niches where slug = 'business-software-ai'
on conflict (slug) do nothing;

insert into public.sites (niche_id, slug, name, status)
select id, 'travel', 'Travel', 'draft' from public.niches where slug = 'travel-smart-travel'
on conflict (slug) do nothing;

insert into public.sites (niche_id, slug, name, status)
select id, 'consumer-tech', 'Consumer Tech', 'draft' from public.niches where slug = 'consumer-tech-smart-home'
on conflict (slug) do nothing;

-- Categorías de business-software-ai (Fase 6A, backlog 601) — mismas 6 subcategorías
-- usadas consistentemente en los diccionarios i18n desde Fase 3
-- (apps/web/src/lib/i18n/*.ts, niches["business-software-ai"].categories).
insert into public.categories (niche_id, slug, name)
select id, slug, name from public.niches, (values
  ('crm', 'CRM'),
  ('ai-assistants', 'AI Assistants'),
  ('automation', 'Automation'),
  ('seo-marketing', 'SEO & Marketing Software'),
  ('website-ecommerce', 'Website & E-commerce'),
  ('productivity', 'Productivity')
) as cat(slug, name)
where niches.slug = 'business-software-ai'
on conflict (niche_id, slug) do nothing;

-- Categorías de travel-smart-travel (Fase 6B, backlog 611) — mismas 6 subcategorías
-- usadas consistentemente en los diccionarios i18n desde Fase 3. Nota: el blueprint
-- original (§3) lista 7 subcategorías incluyendo "movilidad local"; se siembra la
-- taxonomía real de 6 ya congelada en los diccionarios, no la del blueprint original
-- (mismo criterio aplicado a business-software-ai en Fase 6A).
insert into public.categories (niche_id, slug, name)
select id, slug, name from public.niches, (values
  ('hotels', 'Hotels'),
  ('destinations', 'Destinations'),
  ('itineraries', 'Itineraries'),
  ('esim-connectivity', 'eSIM & connectivity'),
  ('luggage', 'Luggage'),
  ('travel-tech', 'Travel tech')
) as cat(slug, name)
where niches.slug = 'travel-smart-travel'
on conflict (niche_id, slug) do nothing;

-- Categorías de consumer-tech-smart-home (Fase 6C, backlog 621). El blueprint
-- define siete; `creator-gear` se incorpora ahora al shell multiidioma en lugar
-- de silenciarlo por el listado incompleto que había quedado en Fase 3.
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
