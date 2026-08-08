-- Catalog domain — shell mínimo para Fase 2. CRUD completo, product_variants,
-- product_features, product_prices, product_media, source/checked_at/confidence
-- llegan en Fase 4 (CMS & Product Intelligence) — no se adelantan aquí.

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references public.niches(id) on delete restrict,
  slug text not null,
  name text not null,
  website_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (niche_id, slug)
);
comment on table public.vendors is 'Shell mínimo — detalle completo en Fase 4.';

create index vendors_niche_id_idx on public.vendors (niche_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  slug text not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);
comment on table public.products is 'Shell mínimo. Reglas de fuentes/históricos (PROJECT_BLUEPRINT.md §5) se implementan con las tablas de variants/features/prices en Fase 4.';

create index products_site_id_idx on public.products (site_id);
create index products_category_id_idx on public.products (category_id);
create index products_vendor_id_idx on public.products (vendor_id);

alter table public.vendors enable row level security;
alter table public.products enable row level security;

-- Lectura pública: solo lo publicado (nunca thin/draft visible, alineado con CONTENT_POLICY.md).
create policy "vendors_public_read_published" on public.vendors
  for select
  using (status = 'published');

create policy "products_public_read_published" on public.products
  for select
  using (status = 'published');

-- Escritura: admin o editor del niche/site correspondiente (blueprint §4.1 — Editor
-- "crea/edita contenido y productos"). Las policies FOR ALL ya cubren SELECT de
-- drafts para estos roles, se combinan por OR con las de lectura pública.
create policy "vendors_admin_editor_write" on public.vendors
  for all
  using (
    public.has_role('super_admin')
    or exists (
      select 1 from public.sites s
      where s.niche_id = vendors.niche_id
        and (public.has_role('admin', s.id) or public.has_role('editor', s.id))
    )
  )
  with check (
    public.has_role('super_admin')
    or exists (
      select 1 from public.sites s
      where s.niche_id = vendors.niche_id
        and (public.has_role('admin', s.id) or public.has_role('editor', s.id))
    )
  );

create policy "products_admin_editor_write" on public.products
  for all
  using (
    public.has_role('super_admin')
    or public.has_role('admin', site_id)
    or public.has_role('editor', site_id)
  )
  with check (
    public.has_role('super_admin')
    or public.has_role('admin', site_id)
    or public.has_role('editor', site_id)
  );

grant select, insert, update, delete on public.vendors to authenticated;
grant select on public.vendors to anon;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.products to anon;
