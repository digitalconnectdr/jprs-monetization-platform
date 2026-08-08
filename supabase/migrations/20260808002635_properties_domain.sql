-- Properties domain: niches (verticales), sites (propiedades desplegables), categories, site_settings.
-- Ver docs/PROJECT_BLUEPRINT.md sección 3 (Los tres nichos iniciales) y sección 5 (Modelo de datos y RBAC).
--
-- Nota: el proyecto Supabase se creó con "Automatically expose new tables" desactivado
-- (decisión de seguridad, ver docs/phases/P1_REPORT.md), así que cada tabla necesita
-- GRANTs explícitos a anon/authenticated además de RLS — RLS solo restringe filas,
-- no alcanza sin el privilegio de tabla subyacente.

create extension if not exists "pgcrypto";

create table public.niches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive', 'planned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.niches is 'Verticales del blueprint: Business Software & AI, Travel & Smart Travel, Consumer Tech & Smart Home (y futuros).';

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references public.niches(id) on delete restrict,
  slug text not null unique,
  name text not null,
  domain text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.sites is 'Propiedad desplegable (site_id se usa en el resto del schema). MVP: 1 site por niche; la arquitectura permite más sin cambiar el modelo.';

create index sites_niche_id_idx on public.sites (niche_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references public.niches(id) on delete cascade,
  parent_category_id uuid references public.categories(id) on delete set null,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (niche_id, slug)
);
comment on table public.categories is 'Subcategorías por nicho (ej. CRM, AI assistants para Software/AI).';

create index categories_niche_id_idx on public.categories (niche_id);
create index categories_parent_idx on public.categories (parent_category_id);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (site_id, key)
);
comment on table public.site_settings is 'Configuración flexible por site. Puede incluir datos no públicos — nunca expuesto a anon, solo a roles administrativos (ver identity_domain.sql).';

-- RLS: se habilita ya. Las políticas de escritura administrativas se agregan en
-- identity_domain.sql, que es donde se define el helper public.has_role() —
-- hasta entonces, sin políticas de escritura, nadie salvo service_role puede escribir
-- (comportamiento seguro por defecto: fail-closed, no fail-open).
alter table public.niches enable row level security;
alter table public.sites enable row level security;
alter table public.categories enable row level security;
alter table public.site_settings enable row level security;

create policy "niches_public_read_active" on public.niches
  for select
  using (status = 'active');

create policy "sites_public_read_active" on public.sites
  for select
  using (status = 'active');

create policy "categories_public_read" on public.categories
  for select
  using (
    exists (
      select 1 from public.niches n
      where n.id = categories.niche_id and n.status = 'active'
    )
  );

-- site_settings no tiene policy de lectura pública intencionalmente — solo admins (ver identity_domain.sql).

-- Grants de tabla (requeridos porque "Automatically expose new tables" está desactivado)
grant select on public.niches to anon, authenticated;
grant select on public.sites to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
-- niches/sites/categories: insert/update/delete se otorgan a authenticated en identity_domain.sql,
-- junto con las policies de escritura administrativa (mismo motivo de orden que las policies).
