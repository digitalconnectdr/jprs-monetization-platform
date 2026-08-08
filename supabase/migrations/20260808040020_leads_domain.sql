-- Leads domain (PROJECT_BLUEPRINT.md §5, MONETIZATION_POLICY.md §5):
-- lead_forms, lead_submissions, lead_routes, lead_revenue.
--
-- lead_submissions contiene PII de usuarios reales — MONETIZATION_POLICY.md §5:
-- "minimización, retención con política definida, protegida por RLS". Lectura
-- restringida a super_admin (ver docs/phases/P5.md, decisión de scope), nunca
-- expuesta a editor/admin de site ni, por supuesto, a anon/público.

create table public.lead_forms (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  slug text not null,
  name text not null,
  fields jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);
comment on table public.lead_forms is 'Definición del formulario (fields jsonb = schema de campos) — MONETIZATION_POLICY.md §5: "solo se activan formularios en verticales/categorías donde exista evidencia de alto valor por lead calificado" (decisión editorial, no forzada por esta tabla).';

create index lead_forms_site_id_idx on public.lead_forms (site_id);

create table public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  lead_form_id uuid not null references public.lead_forms(id) on delete cascade,
  submitted_data jsonb not null,
  session_id text,
  status text not null default 'new' check (status in ('new', 'routed', 'qualified', 'rejected')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table public.lead_submissions is 'PII real de usuarios (submitted_data). Insert público (cualquiera puede enviar un formulario), lectura solo super_admin — ver docs/phases/P5.md.';

create index lead_submissions_form_id_idx on public.lead_submissions (lead_form_id, submitted_at desc);

create table public.lead_routes (
  id uuid primary key default gen_random_uuid(),
  lead_form_id uuid not null references public.lead_forms(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  routing_rule jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.lead_routes is 'A qué vendor(s) se enrutan los leads de un form, y bajo qué regla (routing_rule). Config interna, no contiene PII de leads individuales.';

create index lead_routes_form_id_idx on public.lead_routes (lead_form_id);
create index lead_routes_vendor_id_idx on public.lead_routes (vendor_id);

create table public.lead_revenue (
  id uuid primary key default gen_random_uuid(),
  lead_submission_id uuid not null references public.lead_submissions(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  source text not null,
  checked_at timestamptz not null default now(),
  confidence text not null default 'unverified' check (confidence in ('verified', 'estimated', 'unverified')),
  created_at timestamptz not null default now()
);
comment on table public.lead_revenue is 'Append-only, igual patrón que product_prices/affiliate_offers — el valor de un lead puede reportarse más de una vez a medida que el vendor lo califica/paga.';

create index lead_revenue_submission_id_idx on public.lead_revenue (lead_submission_id, checked_at desc);

alter table public.lead_forms enable row level security;
alter table public.lead_submissions enable row level security;
alter table public.lead_routes enable row level security;
alter table public.lead_revenue enable row level security;

create policy "lead_forms_public_read_published" on public.lead_forms
  for select
  using (status = 'published');

create policy "lead_forms_admin_editor_write" on public.lead_forms
  for all
  using (public.has_role('editor', site_id) or public.is_admin_for_site(site_id))
  with check (public.has_role('editor', site_id) or public.is_admin_for_site(site_id));

-- Cualquiera (anon o authenticated) puede enviar un lead a un form published — sin esto
-- nadie podría usar el formulario. Nunca hay policy de SELECT/UPDATE/DELETE para
-- anon/authenticated: es intencional, la confirmación de envío se maneja del lado del
-- cliente en el momento del POST (PostgREST con Prefer: return=representation), no
-- releyendo la fila después.
create policy "lead_submissions_public_insert" on public.lead_submissions
  for insert
  with check (
    exists (select 1 from public.lead_forms f where f.id = lead_submissions.lead_form_id and f.status = 'published')
  );

create policy "lead_submissions_super_admin_select" on public.lead_submissions
  for select
  using (public.has_role('super_admin'));

-- lead_routes: editor/admin del site del form, con cross-check de que el vendor
-- pertenezca al mismo niche que ese site (lección de F-03, docs/audits/P4_AUDIT.md).
create policy "lead_routes_admin_editor_all" on public.lead_routes
  for all
  using (
    exists (
      select 1 from public.lead_forms f
      join public.sites s on s.id = f.site_id
      join public.vendors v on v.id = lead_routes.vendor_id
      where f.id = lead_routes.lead_form_id
        and v.niche_id = s.niche_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
  )
  with check (
    exists (
      select 1 from public.lead_forms f
      join public.sites s on s.id = f.site_id
      join public.vendors v on v.id = lead_routes.vendor_id
      where f.id = lead_routes.lead_form_id
        and v.niche_id = s.niche_id
        and (public.has_role('editor', s.id) or public.is_admin_for_site(s.id))
    )
  );

create policy "lead_revenue_super_admin_select" on public.lead_revenue
  for select
  using (public.has_role('super_admin'));

create policy "lead_revenue_super_admin_insert" on public.lead_revenue
  for insert
  with check (public.has_role('super_admin'));

grant select on public.lead_forms to anon;
grant select, insert, update, delete on public.lead_forms to authenticated;
grant insert on public.lead_submissions to anon, authenticated;
grant select on public.lead_submissions to authenticated;
grant select, insert, update, delete on public.lead_routes to authenticated;
grant select, insert on public.lead_revenue to authenticated;
