-- Content domain (PROJECT_BLUEPRINT.md §5): content_items, content_versions,
-- content_blocks, content_product_links, content_sources.
--
-- Enforcement técnico de ADR-005 (no auto-publicación sin revisión humana): un
-- content_item solo puede pasar a status='published' si current_version_id apunta
-- a una content_version con review_state='approved' — trigger, no solo convención
-- de UI (que todavía no existe, ver docs/phases/P4.md "Explícitamente fuera de scope").

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  content_type text not null check (content_type in ('best_x', 'vs', 'alternatives', 'review', 'buying_guide', 'tool', 'landing', 'support')),
  slug text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  current_version_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);
comment on table public.content_items is 'Unidad publicable (Best X, VS, Review, etc.). current_version_id apunta a la content_version live — ver trigger enforce_publish_requires_approved_version.';

create index content_items_site_id_idx on public.content_items (site_id);
create index content_items_category_id_idx on public.content_items (category_id);

create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  version_number int not null,
  body jsonb not null default '{}'::jsonb,
  review_state text not null default 'draft' check (review_state in ('draft', 'pending_editorial_review', 'pending_monetization_review', 'approved', 'rejected')),
  author_id uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (content_item_id, version_number)
);
comment on table public.content_versions is 'Cada edición es una versión nueva. review_state sigue el pipeline de PROJECT_BLUEPRINT.md §15 (Draft → Fact Check → Editorial/UX Review → Monetization Policy Review → Publish), colapsado a un campo de estado — la separación fina entre "fact check" y "editorial review" es proceso humano, no estados DB distintos en esta fase.';

create index content_versions_content_item_id_idx on public.content_versions (content_item_id);

alter table public.content_items
  add constraint content_items_current_version_fk
  foreign key (current_version_id) references public.content_versions(id) on delete set null;

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  content_version_id uuid not null references public.content_versions(id) on delete cascade,
  block_type text not null,
  block_data jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
comment on table public.content_blocks is 'Contenido estructurado por versión (ej. intro, comparison_table, pros_cons, faq) — el renderer del frontend interpreta block_type.';

create index content_blocks_version_id_idx on public.content_blocks (content_version_id, sort_order);

create table public.content_product_links (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  role text not null default 'mentioned' check (role in ('primary', 'alternative', 'mentioned')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (content_item_id, product_id)
);
comment on table public.content_product_links is 'Qué productos menciona/compara cada content_item — base para "Comparison Add" analytics (Fase 7) y para saber qué contenido referencia un producto.';

create index content_product_links_content_item_idx on public.content_product_links (content_item_id);
create index content_product_links_product_idx on public.content_product_links (product_id);

create table public.content_sources (
  id uuid primary key default gen_random_uuid(),
  content_version_id uuid not null references public.content_versions(id) on delete cascade,
  source_url text not null,
  source_label text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table public.content_sources is 'Fuentes citadas por versión (PROJECT_BLUEPRINT.md §6.3 "Fuentes cuando se afirmen precios, especificaciones o condiciones").';

create index content_sources_version_idx on public.content_sources (content_version_id);

-- Trigger: bloquea que un content_item pase a 'published' sin una versión aprobada.
create function public.enforce_publish_requires_approved_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review_state text;
begin
  if new.status = 'published' then
    if new.current_version_id is null then
      raise exception 'content_item % no puede publicarse sin current_version_id', new.id;
    end if;
    select review_state into v_review_state from public.content_versions where id = new.current_version_id;
    if v_review_state is distinct from 'approved' then
      raise exception 'content_item % no puede publicarse: current_version_id % tiene review_state=% (requiere approved)', new.id, new.current_version_id, v_review_state;
    end if;
  end if;
  return new;
end;
$$;

create trigger content_items_enforce_publish
  before insert or update on public.content_items
  for each row execute function public.enforce_publish_requires_approved_version();

alter table public.content_items enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_blocks enable row level security;
alter table public.content_product_links enable row level security;
alter table public.content_sources enable row level security;

-- Lectura pública: solo published, mismo patrón que products/vendors (Fase 2).
create policy "content_items_public_read_published" on public.content_items
  for select
  using (status = 'published');

create policy "content_items_admin_editor_write" on public.content_items
  for all
  using (public.has_role('editor', site_id) or public.is_admin_for_site(site_id))
  with check (public.has_role('editor', site_id) or public.is_admin_for_site(site_id));

-- content_versions: público solo puede leer la versión que está actualmente live de un
-- content_item published (no cualquier versión — un draft de un item publicado sigue
-- siendo un draft). Editor/admin del site ven/escriben todas las versiones de su site.
create policy "content_versions_public_read_live" on public.content_versions
  for select
  using (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_versions.content_item_id
        and ci.status = 'published'
        and ci.current_version_id = content_versions.id
    )
  );

create policy "content_versions_admin_editor_all" on public.content_versions
  for all
  using (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_versions.content_item_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  )
  with check (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_versions.content_item_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  );

create policy "content_blocks_public_read_live" on public.content_blocks
  for select
  using (
    exists (
      select 1 from public.content_items ci
      join public.content_versions cv on cv.id = ci.current_version_id
      where cv.id = content_blocks.content_version_id
        and ci.status = 'published'
    )
  );

create policy "content_blocks_admin_editor_all" on public.content_blocks
  for all
  using (
    exists (
      select 1 from public.content_versions cv
      join public.content_items ci on ci.id = cv.content_item_id
      where cv.id = content_blocks.content_version_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  )
  with check (
    exists (
      select 1 from public.content_versions cv
      join public.content_items ci on ci.id = cv.content_item_id
      where cv.id = content_blocks.content_version_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  );

create policy "content_product_links_public_read" on public.content_product_links
  for select
  using (
    exists (select 1 from public.content_items ci where ci.id = content_product_links.content_item_id and ci.status = 'published')
  );

create policy "content_product_links_admin_editor_all" on public.content_product_links
  for all
  using (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_product_links.content_item_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  )
  with check (
    exists (
      select 1 from public.content_items ci
      where ci.id = content_product_links.content_item_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  );

create policy "content_sources_public_read_live" on public.content_sources
  for select
  using (
    exists (
      select 1 from public.content_items ci
      where ci.current_version_id = content_sources.content_version_id
        and ci.status = 'published'
    )
  );

create policy "content_sources_admin_editor_all" on public.content_sources
  for all
  using (
    exists (
      select 1 from public.content_versions cv
      join public.content_items ci on ci.id = cv.content_item_id
      where cv.id = content_sources.content_version_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  )
  with check (
    exists (
      select 1 from public.content_versions cv
      join public.content_items ci on ci.id = cv.content_item_id
      where cv.id = content_sources.content_version_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  );

grant select, insert, update, delete on public.content_items to authenticated;
grant select on public.content_items to anon;
grant select, insert, update, delete on public.content_versions to authenticated;
grant select on public.content_versions to anon;
grant select, insert, update, delete on public.content_blocks to authenticated;
grant select on public.content_blocks to anon;
grant select, insert, update, delete on public.content_product_links to authenticated;
grant select on public.content_product_links to anon;
grant select, insert, update, delete on public.content_sources to authenticated;
grant select on public.content_sources to anon;
