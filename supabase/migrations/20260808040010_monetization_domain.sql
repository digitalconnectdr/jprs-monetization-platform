-- Monetization domain (PROJECT_BLUEPRINT.md §5/§7, MONETIZATION_POLICY.md §2/§4/§6):
-- ad_slots, monetization_rules, roe_scores, sponsored_campaigns, sponsorship_placements.

create table public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  slot_key text not null,
  page_type text not null check (page_type in ('informative', 'tutorial', 'review', 'comparison', 'deal', 'tool', 'auth', 'admin', 'low_value')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slot_key)
);
comment on table public.ad_slots is 'page_type incluye auth/admin/low_value (además de los tipos de contenido de PROJECT_BLUEPRINT.md §7.1) precisamente para que monetization_rules pueda prohibir ads ahí (MONETIZATION_POLICY.md §4).';

create index ad_slots_site_id_idx on public.ad_slots (site_id);

create table public.monetization_rules (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  page_type text not null check (page_type in ('informative', 'tutorial', 'review', 'comparison', 'deal', 'tool', 'auth', 'admin', 'low_value')),
  allowed_layers text[] not null default '{}',
  max_ad_density int check (max_ad_density >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, page_type),
  -- MONETIZATION_POLICY.md §4/§9: "no hay ads en páginas prohibidas por esta policy" —
  -- auth/admin/low_value nunca pueden tener 'ads' en allowed_layers. Verificable
  -- programáticamente (criterio de aceptación de la fase), no solo por convención.
  constraint monetization_rules_no_ads_on_prohibited_pages check (
    not (page_type in ('auth', 'admin', 'low_value') and 'ads' = any(allowed_layers))
  )
);
comment on table public.monetization_rules is 'Qué capas de monetización (ads/affiliate/lead/sponsor) están permitidas por page_type, por site. El CHECK constraint hace que "ads en página prohibida" sea imposible de insertar, no solo una regla documentada.';

create index monetization_rules_site_id_idx on public.monetization_rules (site_id);

create table public.roe_scores (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  ad_ev numeric(12, 4) not null default 0,
  affiliate_ev numeric(12, 4) not null default 0,
  lead_ev numeric(12, 4) not null default 0,
  sponsor_ev numeric(12, 4) not null default 0,
  total_expected_revenue numeric(12, 4) generated always as (ad_ev + affiliate_ev + lead_ev + sponsor_ev) stored,
  quality_score numeric(6, 2),
  monetization_score numeric(6, 2),
  rule_version text not null,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table public.roe_scores is 'Snapshot histórico del Revenue Optimization Engine (append-only — nunca se actualiza un score pasado, se calcula uno nuevo). quality_score y monetization_score se almacenan como columnas separadas, nunca combinadas en un solo "score" — es la representación literal del firewall editorial (MONETIZATION_POLICY.md §2: "señales independientes"). NUNCA público bajo ninguna circunstancia: exponer monetization_score, aunque sea de lectura, crea la apariencia de que el ranking público podría estar influenciado por él.';

create index roe_scores_content_item_id_idx on public.roe_scores (content_item_id, computed_at desc);

create table public.sponsored_campaigns (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  budget_amount numeric(12, 2) check (budget_amount >= 0),
  budget_currency text not null default 'USD' check (char_length(budget_currency) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.sponsored_campaigns is 'Decisión comercial/de ventas — gestionada por admin/super_admin, no por editor (a diferencia de products/content). MONETIZATION_POLICY.md §6: nunca se activa antes de tener tracción; esta tabla no aplica esa regla de negocio automáticamente, solo modela el dato.';

create index sponsored_campaigns_vendor_id_idx on public.sponsored_campaigns (vendor_id);

create table public.sponsorship_placements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsored_campaigns(id) on delete cascade,
  ad_slot_id uuid references public.ad_slots(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  disclosure_label text not null default 'Sponsored',
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- MONETIZATION_POLICY.md §6/§9: "sponsored siempre separado y etiquetado" —
  -- estructuralmente imposible tener un placement sin label no vacío.
  constraint sponsorship_placements_label_not_blank check (length(trim(disclosure_label)) > 0),
  -- Exactamente un target por placement (ad_slot O content_item, nunca ambos ni
  -- ninguno) — simplifica el aislamiento de scope: cada placement tiene un solo site
  -- que validar, no una combinación ambigua de dos.
  constraint sponsorship_placements_single_target check (
    (case when ad_slot_id is not null then 1 else 0 end) + (case when content_item_id is not null then 1 else 0 end) = 1
  )
);
comment on table public.sponsorship_placements is 'disclosure_label nunca puede quedar vacío (constraint, no solo default) — MONETIZATION_POLICY.md §6/§9.';

create index sponsorship_placements_campaign_id_idx on public.sponsorship_placements (campaign_id);
create index sponsorship_placements_ad_slot_id_idx on public.sponsorship_placements (ad_slot_id);
create index sponsorship_placements_content_item_id_idx on public.sponsorship_placements (content_item_id);

alter table public.ad_slots enable row level security;
alter table public.monetization_rules enable row level security;
alter table public.roe_scores enable row level security;
alter table public.sponsored_campaigns enable row level security;
alter table public.sponsorship_placements enable row level security;

-- ad_slots/monetization_rules: config interna de site, sin lectura pública todavía
-- (no existe renderer de ads que la consuma del lado del cliente aún).
create policy "ad_slots_admin_editor_all" on public.ad_slots
  for all
  using (public.has_role('editor', site_id) or public.is_admin_for_site(site_id))
  with check (public.has_role('editor', site_id) or public.is_admin_for_site(site_id));

create policy "monetization_rules_admin_editor_all" on public.monetization_rules
  for all
  using (public.has_role('editor', site_id) or public.is_admin_for_site(site_id))
  with check (public.has_role('editor', site_id) or public.is_admin_for_site(site_id));

-- roe_scores: super_admin únicamente, append-only (select + insert, sin update/delete
-- — coherente con el GRANT de tabla, no solo con RLS) — nunca editor, nunca público.
create policy "roe_scores_super_admin_select" on public.roe_scores
  for select
  using (public.has_role('super_admin'));

create policy "roe_scores_super_admin_insert" on public.roe_scores
  for insert
  with check (public.has_role('super_admin'));

-- sponsored_campaigns/sponsorship_placements: admin/super_admin únicamente (no
-- editor — decisión comercial). Cross-check de scope: el site del ad_slot o
-- content_item del placement debe compartir niche con el vendor de la campaña.
create policy "sponsored_campaigns_admin_all" on public.sponsored_campaigns
  for all
  using (
    exists (
      select 1 from public.vendors v
      join public.sites s on s.niche_id = v.niche_id
      where v.id = sponsored_campaigns.vendor_id and public.is_admin_for_site(s.id)
    )
  )
  with check (
    exists (
      select 1 from public.vendors v
      join public.sites s on s.niche_id = v.niche_id
      where v.id = sponsored_campaigns.vendor_id and public.is_admin_for_site(s.id)
    )
  );

create policy "sponsorship_placements_admin_all" on public.sponsorship_placements
  for all
  using (
    exists (
      select 1 from public.sponsored_campaigns c
      join public.vendors v on v.id = c.vendor_id
      left join public.ad_slots asl on asl.id = sponsorship_placements.ad_slot_id
      left join public.content_items ci on ci.id = sponsorship_placements.content_item_id
      left join public.sites s_slot on s_slot.id = asl.site_id
      left join public.sites s_item on s_item.id = ci.site_id
      where c.id = sponsorship_placements.campaign_id
        and (
          (asl.id is not null and s_slot.niche_id = v.niche_id and public.is_admin_for_site(s_slot.id))
          or (ci.id is not null and s_item.niche_id = v.niche_id and public.is_admin_for_site(s_item.id))
        )
    )
  )
  with check (
    exists (
      select 1 from public.sponsored_campaigns c
      join public.vendors v on v.id = c.vendor_id
      left join public.ad_slots asl on asl.id = sponsorship_placements.ad_slot_id
      left join public.content_items ci on ci.id = sponsorship_placements.content_item_id
      left join public.sites s_slot on s_slot.id = asl.site_id
      left join public.sites s_item on s_item.id = ci.site_id
      where c.id = sponsorship_placements.campaign_id
        and (
          (asl.id is not null and s_slot.niche_id = v.niche_id and public.is_admin_for_site(s_slot.id))
          or (ci.id is not null and s_item.niche_id = v.niche_id and public.is_admin_for_site(s_item.id))
        )
    )
  );

grant select, insert, update, delete on public.ad_slots to authenticated;
grant select, insert, update, delete on public.monetization_rules to authenticated;
grant select, insert on public.roe_scores to authenticated;
grant select, insert, update, delete on public.sponsored_campaigns to authenticated;
grant select, insert, update, delete on public.sponsorship_placements to authenticated;
