-- Analytics domain v1 (Fase 7, backlog 701). Event taxonomy mínima de
-- KPI_TREE.md §3 (page_view, product_impression, affiliate_click, comparison_add,
-- save_product, lead_start, lead_submit, conversion, ad_revenue_daily,
-- newsletter_signup). Una sola tabla genérica en vez de 9 tablas específicas —
-- decisión de v1: los campos varían por tipo pero son pocos y encajan en jsonb;
-- se separa en tablas dedicadas si el volumen o las queries lo justifican después.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_type text not null check (event_type in (
    'page_view', 'product_impression', 'affiliate_click', 'comparison_add',
    'save_product', 'lead_start', 'lead_submit', 'conversion',
    'ad_revenue_daily', 'newsletter_signup'
  )),
  site_id uuid references public.sites(id) on delete set null,
  session_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (event_id)
);
comment on table public.analytics_events is 'Ledger insert-only de eventos de producto (CLAUDE.md: "Eventos analíticos requieren event_id idempotente"). Insertar vía record_analytics_event(), no INSERT directo — mismo patrón que affiliate_clicks (record_affiliate_click) para que la idempotencia sea real (ON CONFLICT DO NOTHING), no un 409 hacia el visitante en un reintento de red.';

create index analytics_events_type_occurred_idx on public.analytics_events (event_type, occurred_at desc);
create index analytics_events_site_id_idx on public.analytics_events (site_id, occurred_at desc);

alter table public.analytics_events enable row level security;

-- Sin policy de INSERT directo — anon/authenticated solo pueden escribir a través
-- de record_analytics_event() (SECURITY DEFINER). Lectura: analyst/admin/super_admin,
-- igual que el resto de tablas de negocio internas (nunca público — son datos de
-- comportamiento de visitantes, no catálogo).
create policy "analytics_events_admin_analyst_select" on public.analytics_events
  for select
  using (
    public.has_role('super_admin')
    or (site_id is not null and (public.has_role('analyst', site_id) or public.is_admin_for_site(site_id)))
  );

-- Función pública de ingesta: idempotente por event_id, sin autenticación requerida
-- (el shell público emite page_view/etc. desde el navegador de cualquier visitante).
create or replace function public.record_analytics_event(
  p_event_id text,
  p_event_type text,
  p_site_id uuid default null,
  p_session_id text default null,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_event_id is null or length(trim(p_event_id)) = 0 then
    raise exception 'event_id requerido';
  end if;

  if p_event_type not in (
    'page_view', 'product_impression', 'affiliate_click', 'comparison_add',
    'save_product', 'lead_start', 'lead_submit', 'conversion',
    'ad_revenue_daily', 'newsletter_signup'
  ) then
    raise exception 'event_type inválido: %', p_event_type;
  end if;

  insert into public.analytics_events (event_id, event_type, site_id, session_id, payload)
  values (p_event_id, p_event_type, p_site_id, p_session_id, coalesce(p_payload, '{}'::jsonb))
  on conflict (event_id) do nothing
  returning id into v_id;

  return v_id;
end;
$$;
comment on function public.record_analytics_event is 'Punto de entrada público (anon) para registrar un evento de analytics, idempotente por event_id. No requiere rol, igual que record_affiliate_click — la idempotencia evita doble conteo por reintentos de red, no es un control de autorización.';

-- record_affiliate_click (Fase 5) quedó intencionalmente sin REVOKE de PUBLIC porque
-- su propósito ES ser llamable por anon — mismo caso aquí, no se revoca.
grant execute on function public.record_analytics_event(text, text, uuid, text, jsonb) to anon, authenticated, service_role;
grant select on public.analytics_events to authenticated;
grant select, insert, delete on public.analytics_events to service_role;

-- ROE v1 estructural (backlog 705): a diferencia de la fórmula completa de
-- PROJECT_BLUEPRINT.md §7 (requiere P(click)/P(conversion) reales — no existen sin
-- tráfico), esta función mide completitud/frescura de los datos que ya sembramos
-- para cada content_item con productos vinculados. Es una señal honesta de "qué tan
-- listo para monetizar bien está este contenido", no el ROE real. NO se calcula
-- monetization_score (requiere señales de afiliados que tampoco existen todavía).
create or replace function public.compute_structural_roe_scores()
returns setof public.roe_scores
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_price_ratio numeric;
  v_feature_ratio numeric;
  v_freshness_ratio numeric;
  v_quality numeric;
  v_row public.roe_scores;
begin
  for r in
    select
      ci.id as content_item_id,
      count(distinct cpl.product_id) as product_count,
      count(distinct pp.product_id) as products_with_price,
      count(distinct pf.product_id) as products_with_feature,
      count(*) filter (where pf.checked_at > now() - interval '90 days') as fresh_feature_count,
      count(pf.id) as total_feature_count
    from public.content_items ci
    join public.content_product_links cpl on cpl.content_item_id = ci.id
    left join lateral (
      select distinct on (product_id) product_id, checked_at
      from public.product_prices
      where product_id = cpl.product_id
      order by product_id, checked_at desc
    ) pp on true
    left join public.product_features pf on pf.product_id = cpl.product_id
    group by ci.id
  loop
    v_price_ratio := case when r.product_count = 0 then 0 else r.products_with_price::numeric / r.product_count end;
    v_feature_ratio := case when r.product_count = 0 then 0 else r.products_with_feature::numeric / r.product_count end;
    v_freshness_ratio := case when r.total_feature_count = 0 then 0 else r.fresh_feature_count::numeric / r.total_feature_count end;

    -- Ponderación simple y documentada, no una fórmula de negocio validada: precio
    -- presente pesa más (es lo primero que un visitante compara), luego cobertura de
    -- features, luego frescura. Escala 0-100 para que sea legible sin conocer la fórmula.
    v_quality := round((v_price_ratio * 50 + v_feature_ratio * 30 + v_freshness_ratio * 20)::numeric, 2);

    insert into public.roe_scores (content_item_id, quality_score, rule_version)
    values (r.content_item_id, v_quality, 'structural_readiness_v1')
    returning * into v_row;

    return next v_row;
  end loop;
end;
$$;
comment on function public.compute_structural_roe_scores is 'ROE v1 estructural (backlog 705): quality_score = completitud/frescura de datos de catálogo por content_item, NO tráfico real (no existe todavía). monetization_score y ad_ev/affiliate_ev/lead_ev/sponsor_ev quedan en su default (0/null) — calcularlos requiere señales de afiliados/tráfico reales. rule_version=structural_readiness_v1 distingue esto del ROE real del blueprint.';

revoke execute on function public.compute_structural_roe_scores() from public;
grant execute on function public.compute_structural_roe_scores() to service_role;
