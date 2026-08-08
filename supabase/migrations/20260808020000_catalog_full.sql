-- Catalog domain — completa el shell mínimo de Fase 2 (vendors/products) con
-- variants/features/prices/media (PROJECT_BLUEPRINT.md §5).
--
-- Regla de datos no negociable: todo precio/feature requiere source + checked_at +
-- confidence, y "no se sobrescribe histórico — precios, comisiones y métricas
-- requieren series temporales" (§5). product_prices y product_features son por
-- diseño append-only: no existe policy de UPDATE para nadie (ni admin/super_admin) —
-- cada cambio es una fila nueva, la garantía es de authorization, no de convención.

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  slug text not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, slug)
);
comment on table public.product_variants is 'Variantes de un producto (ej. tamaño/plan/tier). Mismo modelo de status que products.';

create index product_variants_product_id_idx on public.product_variants (product_id);

create table public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  feature_key text not null,
  feature_value text not null,
  source text not null,
  checked_at timestamptz not null default now(),
  confidence text not null default 'verified' check (confidence in ('verified', 'estimated', 'unverified')),
  created_at timestamptz not null default now()
);
comment on table public.product_features is 'Append-only: un cambio de feature es una fila nueva con checked_at más reciente, nunca un UPDATE de la fila anterior — "no se sobrescribe histórico" (PROJECT_BLUEPRINT.md §5).';

create index product_features_lookup_idx on public.product_features (product_id, variant_id, feature_key, checked_at desc);

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  price_type text not null default 'list' check (price_type in ('list', 'sale', 'subscription_monthly', 'subscription_yearly', 'starting_at')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  source text not null,
  checked_at timestamptz not null default now(),
  confidence text not null default 'verified' check (confidence in ('verified', 'estimated', 'unverified')),
  created_at timestamptz not null default now()
);
comment on table public.product_prices is 'Append-only, igual que product_features. El precio "actual" es la fila con mayor checked_at para (product_id, variant_id, price_type) — nunca se actualiza una fila existente.';

create index product_prices_lookup_idx on public.product_prices (product_id, variant_id, price_type, checked_at desc);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.product_media is 'Assets de producto. A diferencia de features/prices, SÍ es editable (gestión de assets, no histórico de hechos) — CRUD completo para editor/admin.';

create index product_media_product_id_idx on public.product_media (product_id);

alter table public.product_variants enable row level security;
alter table public.product_features enable row level security;
alter table public.product_prices enable row level security;
alter table public.product_media enable row level security;

-- product_variants: mismo patrón que products (Fase 2) — lectura pública solo published,
-- escritura editor/admin del site del producto padre.
create policy "product_variants_public_read_published" on public.product_variants
  for select
  using (
    status = 'published'
    and exists (select 1 from public.products p where p.id = product_variants.product_id and p.status = 'published')
  );

create policy "product_variants_admin_editor_write" on public.product_variants
  for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and (public.has_role('editor', p.site_id) or public.is_admin_for_site(p.site_id))
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and (public.has_role('editor', p.site_id) or public.is_admin_for_site(p.site_id))
    )
  );

-- product_features / product_prices: lectura pública si el producto padre está published
-- (los datos "en borrador" de un producto no publicado tampoco se exponen). Escritura:
-- solo INSERT y SELECT para editor/admin — deliberadamente SIN policy de UPDATE (nadie,
-- ni siquiera super_admin, puede editar una fila histórica) y DELETE reservado a
-- super_admin únicamente, para corregir un dato erróneo en casos extremos.
create policy "product_features_public_read" on public.product_features
  for select
  using (
    exists (select 1 from public.products p where p.id = product_features.product_id and p.status = 'published')
  );

create policy "product_features_admin_editor_select" on public.product_features
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_features.product_id
        and (public.has_role('editor', p.site_id) or public.is_admin_for_site(p.site_id))
    )
  );

create policy "product_features_admin_editor_insert" on public.product_features
  for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_features.product_id
        and (public.has_role('editor', p.site_id) or public.is_admin_for_site(p.site_id))
    )
  );

create policy "product_features_super_admin_delete" on public.product_features
  for delete
  using (public.has_role('super_admin'));

create policy "product_prices_public_read" on public.product_prices
  for select
  using (
    exists (select 1 from public.products p where p.id = product_prices.product_id and p.status = 'published')
  );

create policy "product_prices_admin_editor_select" on public.product_prices
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_prices.product_id
        and (public.has_role('editor', p.site_id) or public.is_admin_for_site(p.site_id))
    )
  );

create policy "product_prices_admin_editor_insert" on public.product_prices
  for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_prices.product_id
        and (public.has_role('editor', p.site_id) or public.is_admin_for_site(p.site_id))
    )
  );

create policy "product_prices_super_admin_delete" on public.product_prices
  for delete
  using (public.has_role('super_admin'));

-- product_media: CRUD completo (gestión de assets, no histórico).
create policy "product_media_public_read_published" on public.product_media
  for select
  using (
    status = 'published'
    and exists (select 1 from public.products p where p.id = product_media.product_id and p.status = 'published')
  );

create policy "product_media_admin_editor_write" on public.product_media
  for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_media.product_id
        and (public.has_role('editor', p.site_id) or public.is_admin_for_site(p.site_id))
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_media.product_id
        and (public.has_role('editor', p.site_id) or public.is_admin_for_site(p.site_id))
    )
  );

grant select, insert, update, delete on public.product_variants to authenticated;
grant select on public.product_variants to anon;
grant select, insert, delete on public.product_features to authenticated;
grant select on public.product_features to anon;
grant select, insert, delete on public.product_prices to authenticated;
grant select on public.product_prices to anon;
grant select, insert, update, delete on public.product_media to authenticated;
grant select on public.product_media to anon;
