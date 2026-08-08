-- Identity domain: roles, profiles, user_roles (RBAC), user_preferences.
-- Define también los helpers de autorización public.has_role()/public.is_admin_for_site()/
-- public.is_admin_for_niche() usados por el resto del schema (incluidas las policies de
-- escritura de niches/sites/categories/site_settings, definidas en properties_domain.sql
-- sin ellas por orden de dependencia).

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);
comment on table public.roles is 'Roles RBAC del blueprint (PROJECT_BLUEPRINT.md §5): super_admin, admin, editor, analyst, user, vendor.';

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Extiende auth.users. Se crea automáticamente vía trigger handle_new_user al registrarse.';

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  site_id uuid references public.sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (user_id, role_id, site_id)
);
comment on table public.user_roles is 'Asignación de roles. site_id NULL = scope global (ej. super_admin); site_id no nulo = scope por property — esto es lo que hace que "Admin scope funcione por property" (criterio de aceptación de Fase 2).';

create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_site_id_idx on public.user_roles (site_id);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'en',
  newsletter_opt_in boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
comment on table public.user_preferences is 'Preferencias de cuenta: locale, newsletter, y jsonb extensible para futuras fases.';

-- Trigger: crear profile + preferences automáticamente al registrarse.
-- security definer: corre con privilegios elevados porque en el momento del insert
-- en auth.users todavía no hay sesión autenticada que satisfaga RLS normal.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper de autorización: ¿auth.uid() tiene role_name, global o scoped a p_site_id?
-- security definer + search_path fijo: evita recursión de RLS al consultar user_roles
-- desde dentro de una policy de user_roles, y evita search_path hijacking.
create function public.has_role(role_name text, p_site_id uuid default null)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
      and (ur.site_id is null or ur.site_id = p_site_id)
  );
$$;
comment on function public.has_role is 'true si auth.uid() tiene role_name asignado globalmente (site_id null) o específicamente para p_site_id.';

create function public.is_admin_for_site(p_site_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_role('super_admin') or public.has_role('admin', p_site_id);
$$;
comment on function public.is_admin_for_site is 'true si auth.uid() es super_admin (cualquier site) o admin del site p_site_id específico.';

create function public.is_admin_for_niche(p_niche_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_role('super_admin')
    or exists (
      select 1 from public.sites s
      where s.niche_id = p_niche_id
        and public.has_role('admin', s.id)
    );
$$;
comment on function public.is_admin_for_niche is 'true si auth.uid() es super_admin, o admin de al menos un site dentro del niche p_niche_id.';

-- RLS
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_preferences enable row level security;

create policy "roles_authenticated_read" on public.roles
  for select
  to authenticated
  using (true);

create policy "profiles_self_read" on public.profiles
  for select
  using (id = auth.uid() or public.has_role('super_admin'));

create policy "profiles_self_update" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "user_roles_self_read" on public.user_roles
  for select
  using (user_id = auth.uid() or public.has_role('super_admin'));

create policy "user_roles_super_admin_write" on public.user_roles
  for all
  using (public.has_role('super_admin'))
  with check (public.has_role('super_admin'));

create policy "user_preferences_self_all" on public.user_preferences
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policies de escritura administrativa diferidas de properties_domain.sql
-- (dependían de public.has_role/is_admin_for_site/is_admin_for_niche, definidos arriba).

create policy "niches_super_admin_write" on public.niches
  for all
  using (public.has_role('super_admin'))
  with check (public.has_role('super_admin'));

create policy "sites_admin_write" on public.sites
  for all
  using (public.is_admin_for_site(id))
  with check (public.is_admin_for_site(id));

create policy "categories_admin_write" on public.categories
  for all
  using (public.is_admin_for_niche(niche_id))
  with check (public.is_admin_for_niche(niche_id));

create policy "site_settings_admin_all" on public.site_settings
  for all
  using (public.is_admin_for_site(site_id))
  with check (public.is_admin_for_site(site_id));

-- Grants de tabla
grant select on public.roles to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant insert, update, delete on public.niches to authenticated;
grant insert, update, delete on public.sites to authenticated;
grant insert, update, delete on public.categories to authenticated;
