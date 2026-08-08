-- Affiliate domain (PROJECT_BLUEPRINT.md §5, MONETIZATION_POLICY.md §3/§7):
-- affiliate_programs, affiliate_terms, affiliate_offers, affiliate_links, affiliate_clicks.
--
-- affiliate_terms/affiliate_offers son append-only, igual que product_prices/
-- product_features (Fase 4) — la regla de datos "comisiones... requieren series
-- temporales" (PROJECT_BLUEPRINT.md §5) aplica literalmente a comisiones de afiliados.
-- Lección de docs/audits/P4_AUDIT.md (F-05): service_role NO recibe UPDATE en estas
-- tablas desde el día uno (ver migración de GRANT).

create table public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  network text,
  program_url text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'terminated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, name)
);
comment on table public.affiliate_programs is 'Programa de afiliados de un vendor (ej. "Amazon Associates", programa directo de un SaaS). status=active requiere al menos un affiliate_terms registrado — ver trigger.';

create index affiliate_programs_vendor_id_idx on public.affiliate_programs (vendor_id);

create table public.affiliate_terms (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.affiliate_programs(id) on delete cascade,
  link_format text,
  allowed_traffic text,
  paid_search_policy text,
  trademark_bidding_allowed boolean,
  coupon_deep_link_rules text,
  source text not null,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table public.affiliate_terms is 'Append-only: los términos de un programa se registran como snapshot con checked_at, nunca se sobrescriben (MONETIZATION_POLICY.md §3: "cada programa almacena link format, allowed traffic, política de paid search, trademark bidding, coupon/deep-link rules").';

create index affiliate_terms_program_id_idx on public.affiliate_terms (program_id, checked_at desc);

create table public.affiliate_offers (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.affiliate_programs(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  commission_type text not null default 'percent' check (commission_type in ('percent', 'flat', 'tiered')),
  commission_value numeric(10, 4) not null check (commission_value >= 0),
  cookie_duration_days int check (cookie_duration_days >= 0),
  source text not null,
  checked_at timestamptz not null default now(),
  confidence text not null default 'unverified' check (confidence in ('verified', 'estimated', 'unverified')),
  created_at timestamptz not null default now()
);
comment on table public.affiliate_offers is 'Append-only, igual que affiliate_terms — historial de estructura de comisión por producto/programa.';

create index affiliate_offers_program_id_idx on public.affiliate_offers (program_id, checked_at desc);
create index affiliate_offers_product_id_idx on public.affiliate_offers (product_id, checked_at desc);

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.affiliate_programs(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  url text not null,
  link_type text not null default 'direct' check (link_type in ('direct', 'deep_link', 'coupon')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.affiliate_links is 'CRUD normal (no histórico) — la URL de salida real. product_id/content_item_id, cuando ambos están presentes, deben pertenecer al mismo site (ver policy de escritura).';

create index affiliate_links_program_id_idx on public.affiliate_links (program_id);
create index affiliate_links_product_id_idx on public.affiliate_links (product_id);
create index affiliate_links_content_item_id_idx on public.affiliate_links (content_item_id);

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  click_id text not null unique,
  affiliate_link_id uuid not null references public.affiliate_links(id) on delete cascade,
  session_id text,
  content_item_id uuid references public.content_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  referrer text,
  user_agent text,
  ip_hash text,
  clicked_at timestamptz not null default now()
);
comment on table public.affiliate_clicks is 'Ledger insert-only. click_id es la clave de idempotencia (MONETIZATION_POLICY.md §7/§9: "clics no se duplican") — insertar vía record_affiliate_click(), no INSERT directo, para que la idempotencia sea real (ON CONFLICT DO NOTHING) en vez de un error de unique violation hacia el visitante.';

create index affiliate_clicks_link_id_idx on public.affiliate_clicks (affiliate_link_id);
create index affiliate_clicks_clicked_at_idx on public.affiliate_clicks (clicked_at);

-- Trigger: un programa no puede activarse sin al menos un affiliate_terms registrado
-- (MONETIZATION_POLICY.md §9: "ningún programa de afiliados activo sin terms
-- registrados y validados").
create function public.enforce_active_program_requires_terms()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    if not exists (select 1 from public.affiliate_terms where program_id = new.id) then
      raise exception 'affiliate_program % no puede activarse sin al menos un affiliate_terms registrado', new.id;
    end if;
  end if;
  return new;
end;
$$;

create trigger affiliate_programs_enforce_active
  before insert or update on public.affiliate_programs
  for each row execute function public.enforce_active_program_requires_terms();

-- Función pública de tracking: idempotente por click_id, sin autenticación requerida
-- (un visitante anónimo hace clic en un link de afiliado). SECURITY DEFINER porque
-- anon no tiene INSERT directo en affiliate_clicks (se fuerza el paso por esta función
-- para garantizar la semántica de idempotencia real, no solo un unique constraint que
-- devolvería 409 al visitante en un doble-clic o reintento de red).
create or replace function public.record_affiliate_click(
  p_click_id text,
  p_affiliate_link_id uuid,
  p_session_id text default null,
  p_content_item_id uuid default null,
  p_product_id uuid default null,
  p_referrer text default null,
  p_user_agent text default null,
  p_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_click_id is null or length(trim(p_click_id)) = 0 then
    raise exception 'click_id requerido';
  end if;
  if not exists (select 1 from public.affiliate_links where id = p_affiliate_link_id) then
    raise exception 'affiliate_link_id no existe';
  end if;

  insert into public.affiliate_clicks (click_id, affiliate_link_id, session_id, content_item_id, product_id, referrer, user_agent, ip_hash)
  values (p_click_id, p_affiliate_link_id, p_session_id, p_content_item_id, p_product_id, p_referrer, p_user_agent, p_ip_hash)
  on conflict (click_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.affiliate_clicks where click_id = p_click_id;
  end if;

  return v_id;
end;
$$;
comment on function public.record_affiliate_click is 'Punto de entrada público (anon) para registrar un clic de afiliado, idempotente por click_id. No requiere rol — cualquier visitante puede registrar un clic real; la idempotencia evita duplicados por reintentos de red o doble-clic, no es un control de autorización.';

alter table public.affiliate_programs enable row level security;
alter table public.affiliate_terms enable row level security;
alter table public.affiliate_offers enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;

-- affiliate_programs/terms/offers/links: gestionados por editor/admin de CUALQUIER site
-- dentro del niche del vendor (mismo patrón que vendors_admin_editor_write, Fase 2).
-- Sin lectura pública — esto es información comercial interna (comisiones, terms de
-- programa), no contenido editorial; el disclosure de afiliación al usuario público
-- vive en el contenido editorial (content_blocks), no en exponer esta tabla.
create policy "affiliate_programs_admin_editor_all" on public.affiliate_programs
  for all
  using (
    exists (
      select 1 from public.vendors v
      join public.sites s on s.niche_id = v.niche_id
      where v.id = affiliate_programs.vendor_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
  )
  with check (
    exists (
      select 1 from public.vendors v
      join public.sites s on s.niche_id = v.niche_id
      where v.id = affiliate_programs.vendor_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
  );

create policy "affiliate_terms_admin_editor_select" on public.affiliate_terms
  for select
  using (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      join public.sites s on s.niche_id = v.niche_id
      where p.id = affiliate_terms.program_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
  );

create policy "affiliate_terms_admin_editor_insert" on public.affiliate_terms
  for insert
  with check (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      join public.sites s on s.niche_id = v.niche_id
      where p.id = affiliate_terms.program_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
  );

create policy "affiliate_terms_super_admin_delete" on public.affiliate_terms
  for delete
  using (public.has_role('super_admin'));

create policy "affiliate_offers_admin_editor_select" on public.affiliate_offers
  for select
  using (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      join public.sites s on s.niche_id = v.niche_id
      where p.id = affiliate_offers.program_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
  );

-- INSERT en affiliate_offers: si product_id está presente, su site debe pertenecer al
-- MISMO niche que el vendor del programa (lección de F-03, docs/audits/P4_AUDIT.md —
-- validar que ambos lados de una relación compartan scope, no solo que el llamador
-- tenga rol en uno de los dos).
create policy "affiliate_offers_admin_editor_insert" on public.affiliate_offers
  for insert
  with check (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      join public.sites s on s.niche_id = v.niche_id
      where p.id = affiliate_offers.program_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
    and (
      affiliate_offers.product_id is null
      or exists (
        select 1 from public.products pr
        join public.sites ps on ps.id = pr.site_id
        join public.affiliate_programs p2 on p2.id = affiliate_offers.program_id
        join public.vendors v2 on v2.id = p2.vendor_id
        where pr.id = affiliate_offers.product_id
          and ps.niche_id = v2.niche_id
      )
    )
  );

create policy "affiliate_offers_super_admin_delete" on public.affiliate_offers
  for delete
  using (public.has_role('super_admin'));

create policy "affiliate_links_admin_editor_all" on public.affiliate_links
  for all
  using (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      join public.sites s on s.niche_id = v.niche_id
      where p.id = affiliate_links.program_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
  )
  with check (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      join public.sites s on s.niche_id = v.niche_id
      where p.id = affiliate_links.program_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
    -- product_id y content_item_id, cuando ambos están presentes, deben compartir site
    -- (mismo tipo de check cruzado que afiliate_offers arriba).
    and (
      affiliate_links.product_id is null
      or affiliate_links.content_item_id is null
      or exists (
        select 1 from public.products pr, public.content_items ci
        where pr.id = affiliate_links.product_id
          and ci.id = affiliate_links.content_item_id
          and pr.site_id = ci.site_id
      )
    )
  );

-- affiliate_clicks: cualquiera (anon o authenticated) puede registrar un clic vía la
-- función record_affiliate_click (SECURITY DEFINER) — no hay policy de INSERT directo
-- para forzar ese camino. Lectura: solo super_admin (ver docs/phases/P5.md, decisión de
-- scope — datos financieros sin caso de uso de dashboard todavía).
create policy "affiliate_clicks_super_admin_select" on public.affiliate_clicks
  for select
  using (public.has_role('super_admin'));

grant select, insert, update, delete on public.affiliate_programs to authenticated;
grant select, insert, delete on public.affiliate_terms to authenticated;
grant select, insert, delete on public.affiliate_offers to authenticated;
grant select, insert, update, delete on public.affiliate_links to authenticated;
grant select on public.affiliate_clicks to authenticated;
grant execute on function public.record_affiliate_click(text, uuid, text, uuid, uuid, text, text, text) to anon, authenticated;
