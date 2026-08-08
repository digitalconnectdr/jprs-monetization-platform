-- Corrige un bug real encontrado durante el testing de Fase 5 (antes de la auditoría):
-- las policies de affiliate_programs/terms/offers/links y lead_routes resolvían el
-- niche del vendor/lead_form haciendo JOIN directo contra `sites` dentro de la propia
-- policy — pero esa subconsulta corre con los privilegios del rol que llama (RLS
-- normal), no con bypass. `sites` solo tiene lectura pública para sites `active`
-- (`sites_public_read_active`) y lectura propia para `admin`/`super_admin`
-- (`sites_admin_select`) — un `editor` no tiene NINGUNA policy de lectura sobre un
-- site en estado `draft` (el estado por defecto hasta que su vertical se activa en
-- Fase 6A/6B/6C). Resultado: cualquier policy que unía `sites` para un chequeo de
-- `editor` fallaba silenciosamente con "row-level security policy violation", incluso
-- para el propio editor de ese site.
--
-- `is_admin_for_niche` (Fase 2) ya evita este problema porque es SECURITY DEFINER — su
-- subconsulta interna a `sites` no está sujeta a la RLS del rol que llama. Se agrega el
-- equivalente genérico por nombre de rol, y se reescriben las policies afectadas para
-- usarlo en vez de un JOIN directo a `sites`.

create function public.has_role_in_niche(role_name text, p_niche_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.sites s
    where s.niche_id = p_niche_id
      and public.has_role(role_name, s.id)
  );
$$;
comment on function public.has_role_in_niche is 'Equivalente a is_admin_for_niche pero para cualquier rol (no solo admin) — SECURITY DEFINER para no depender de que el rol que llama tenga lectura RLS sobre sites (editor no la tiene para sites en draft).';

-- Mismo problema, forma distinta: resolver el niche_id de un site (para comparar
-- contra el niche_id de un vendor) requiere leer `sites`, lo cual también está sujeto
-- a la RLS del rol que llama. Se expone como función en vez de exponer sites
-- directamente — solo devuelve el niche_id, nada más de la fila.
create function public.site_niche_id(p_site_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select niche_id from public.sites where id = p_site_id;
$$;
comment on function public.site_niche_id is 'SECURITY DEFINER: resuelve el niche_id de un site sin depender de que el rol que llama tenga lectura RLS sobre la fila de sites (editor no la tiene para sites en draft) — usado en cross-checks de scope (affiliate_offers, lead_routes).';

grant execute on function public.site_niche_id(uuid) to authenticated, service_role;

-- affiliate_programs
drop policy "affiliate_programs_admin_editor_all" on public.affiliate_programs;
create policy "affiliate_programs_admin_editor_all" on public.affiliate_programs
  for all
  using (
    exists (
      select 1 from public.vendors v
      where v.id = affiliate_programs.vendor_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
  )
  with check (
    exists (
      select 1 from public.vendors v
      where v.id = affiliate_programs.vendor_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
  );

-- affiliate_terms
drop policy "affiliate_terms_admin_editor_select" on public.affiliate_terms;
create policy "affiliate_terms_admin_editor_select" on public.affiliate_terms
  for select
  using (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      where p.id = affiliate_terms.program_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
  );

drop policy "affiliate_terms_admin_editor_insert" on public.affiliate_terms;
create policy "affiliate_terms_admin_editor_insert" on public.affiliate_terms
  for insert
  with check (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      where p.id = affiliate_terms.program_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
  );

-- affiliate_offers
drop policy "affiliate_offers_admin_editor_select" on public.affiliate_offers;
create policy "affiliate_offers_admin_editor_select" on public.affiliate_offers
  for select
  using (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      where p.id = affiliate_offers.program_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
  );

drop policy "affiliate_offers_admin_editor_insert" on public.affiliate_offers;
create policy "affiliate_offers_admin_editor_insert" on public.affiliate_offers
  for insert
  with check (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      where p.id = affiliate_offers.program_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
    and (
      affiliate_offers.product_id is null
      or exists (
        select 1 from public.products pr
        join public.affiliate_programs p2 on p2.id = affiliate_offers.program_id
        join public.vendors v2 on v2.id = p2.vendor_id
        where pr.id = affiliate_offers.product_id
          and public.site_niche_id(pr.site_id) = v2.niche_id
      )
    )
  );

-- affiliate_links
drop policy "affiliate_links_admin_editor_all" on public.affiliate_links;
create policy "affiliate_links_admin_editor_all" on public.affiliate_links
  for all
  using (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      where p.id = affiliate_links.program_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
  )
  with check (
    exists (
      select 1 from public.affiliate_programs p
      join public.vendors v on v.id = p.vendor_id
      where p.id = affiliate_links.program_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
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

-- lead_routes
drop policy "lead_routes_admin_editor_all" on public.lead_routes;
create policy "lead_routes_admin_editor_all" on public.lead_routes
  for all
  using (
    exists (
      select 1 from public.lead_forms f
      join public.vendors v on v.id = lead_routes.vendor_id
      where f.id = lead_routes.lead_form_id
        and public.site_niche_id(f.site_id) = v.niche_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
  )
  with check (
    exists (
      select 1 from public.lead_forms f
      join public.vendors v on v.id = lead_routes.vendor_id
      where f.id = lead_routes.lead_form_id
        and public.site_niche_id(f.site_id) = v.niche_id
        and (public.has_role_in_niche('editor', v.niche_id) or public.is_admin_for_niche(v.niche_id))
    )
  );

-- sponsored_campaigns/sponsorship_placements: funcionaban en los tests (admin-only)
-- solo por una coincidencia del MVP (1 site por niche — sites_admin_select le permite
-- a un admin leer SU PROPIO site en draft, que resulta ser el único site del niche).
-- Se endurece igual, usando is_admin_for_niche (ya SECURITY DEFINER) y site_niche_id
-- en vez de un JOIN directo a sites — deja de depender de esa coincidencia.
drop policy "sponsored_campaigns_admin_all" on public.sponsored_campaigns;
create policy "sponsored_campaigns_admin_all" on public.sponsored_campaigns
  for all
  using (
    exists (select 1 from public.vendors v where v.id = sponsored_campaigns.vendor_id and public.is_admin_for_niche(v.niche_id))
  )
  with check (
    exists (select 1 from public.vendors v where v.id = sponsored_campaigns.vendor_id and public.is_admin_for_niche(v.niche_id))
  );

drop policy "sponsorship_placements_admin_all" on public.sponsorship_placements;
create policy "sponsorship_placements_admin_all" on public.sponsorship_placements
  for all
  using (
    exists (
      select 1 from public.sponsored_campaigns c
      join public.vendors v on v.id = c.vendor_id
      left join public.ad_slots asl on asl.id = sponsorship_placements.ad_slot_id
      left join public.content_items ci on ci.id = sponsorship_placements.content_item_id
      where c.id = sponsorship_placements.campaign_id
        and public.is_admin_for_niche(v.niche_id)
        and (
          (asl.id is not null and public.site_niche_id(asl.site_id) = v.niche_id)
          or (ci.id is not null and public.site_niche_id(ci.site_id) = v.niche_id)
        )
    )
  )
  with check (
    exists (
      select 1 from public.sponsored_campaigns c
      join public.vendors v on v.id = c.vendor_id
      left join public.ad_slots asl on asl.id = sponsorship_placements.ad_slot_id
      left join public.content_items ci on ci.id = sponsorship_placements.content_item_id
      where c.id = sponsorship_placements.campaign_id
        and public.is_admin_for_niche(v.niche_id)
        and (
          (asl.id is not null and public.site_niche_id(asl.site_id) = v.niche_id)
          or (ci.id is not null and public.site_niche_id(ci.site_id) = v.niche_id)
        )
    )
  );

grant execute on function public.has_role_in_niche(text, uuid) to authenticated, service_role;
