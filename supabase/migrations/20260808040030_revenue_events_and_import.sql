-- revenue_events (dominio analytics, parcial — solo lo necesario para reconciliación
-- de Fase 5, PROJECT_BLUEPRINT.md §11 "revenue events"; el resto de analytics es
-- Fase 7) + import_revenue_events (backlog 507, reconciliación de comisiones/reversals).

create table public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null check (event_type in ('affiliate_commission', 'affiliate_reversal', 'ad_revenue', 'lead_revenue', 'sponsorship')),
  site_id uuid references public.sites(id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'USD' check (char_length(currency) = 3),
  source_table text,
  source_id uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table public.revenue_events is 'Ledger append-only de reconciliación de ingresos. event_id es la clave de idempotencia (MONETIZATION_POLICY.md §7/§9: "revenue reconcilia con import de prueba") — un mismo evento reportado dos veces por un import no debe duplicarse. amount puede ser negativo (event_type=affiliate_reversal).';

create index revenue_events_site_id_idx on public.revenue_events (site_id, occurred_at desc);
create index revenue_events_type_idx on public.revenue_events (event_type, occurred_at desc);

alter table public.revenue_events enable row level security;

create policy "revenue_events_super_admin_select" on public.revenue_events
  for select
  using (public.has_role('super_admin'));

create policy "revenue_events_super_admin_insert" on public.revenue_events
  for insert
  with check (public.has_role('super_admin'));

create policy "revenue_events_super_admin_delete" on public.revenue_events
  for delete
  using (public.has_role('super_admin'));

-- import_revenue_events: a diferencia de import_product_prices (Fase 4), el chequeo de
-- autorización es uniforme para TODAS las filas (super_admin o nada) y corre UNA vez,
-- antes de tocar cualquier fila — por diseño no puede repetir el hallazgo F-04
-- (docs/audits/P4_AUDIT.md, oráculo de existencia vía mensajes de rechazo
-- distinguibles por fila), porque no hay nada que resolver por fila antes de saber si
-- el llamador puede llamar la función en absoluto.
create or replace function public.import_revenue_events(rows jsonb)
returns table (row_index int, status text, reason text, event_row_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
  idx int := 0;
  v_event_id text;
  v_event_type text;
  v_site_id uuid;
  v_amount numeric;
  v_currency text;
  v_source_table text;
  v_source_id uuid;
  v_occurred_at timestamptz;
  v_new_id uuid;
begin
  if not public.has_role('super_admin') then
    raise exception 'solo super_admin puede importar revenue_events';
  end if;

  if jsonb_typeof(rows) is distinct from 'array' then
    raise exception 'rows debe ser un array JSON';
  end if;

  if jsonb_array_length(rows) > 500 then
    raise exception 'lote demasiado grande (% filas, máximo 500 por llamada)', jsonb_array_length(rows);
  end if;

  for r in select * from jsonb_array_elements(rows)
  loop
    idx := idx + 1;
    begin
      v_event_id := r ->> 'event_id';
      v_event_type := r ->> 'event_type';
      v_site_id := nullif(r ->> 'site_id', '')::uuid;
      v_amount := (r ->> 'amount')::numeric;
      v_currency := coalesce(r ->> 'currency', 'USD');
      v_source_table := r ->> 'source_table';
      v_source_id := nullif(r ->> 'source_id', '')::uuid;
      v_occurred_at := coalesce((r ->> 'occurred_at')::timestamptz, now());

      if v_event_id is null or length(trim(v_event_id)) = 0 then
        row_index := idx; status := 'rejected'; reason := 'event_id requerido'; event_row_id := null;
        return next;
        continue;
      end if;

      if v_event_type not in ('affiliate_commission', 'affiliate_reversal', 'ad_revenue', 'lead_revenue', 'sponsorship') then
        row_index := idx; status := 'rejected'; reason := 'event_type inválido'; event_row_id := null;
        return next;
        continue;
      end if;

      if v_amount is null then
        row_index := idx; status := 'rejected'; reason := 'amount requerido'; event_row_id := null;
        return next;
        continue;
      end if;

      if char_length(v_currency) <> 3 then
        row_index := idx; status := 'rejected'; reason := 'currency debe ser código de 3 letras'; event_row_id := null;
        return next;
        continue;
      end if;

      insert into public.revenue_events (event_id, event_type, site_id, amount, currency, source_table, source_id, occurred_at)
      values (v_event_id, v_event_type, v_site_id, v_amount, v_currency, v_source_table, v_source_id, v_occurred_at)
      on conflict (event_id) do nothing
      returning id into v_new_id;

      if v_new_id is null then
        row_index := idx; status := 'duplicate'; reason := 'event_id ya existía — no se duplicó'; event_row_id := (select id from public.revenue_events where event_id = v_event_id);
        return next;
      else
        row_index := idx; status := 'accepted'; reason := null; event_row_id := v_new_id;
        return next;
      end if;
    exception when others then
      row_index := idx; status := 'rejected'; reason := sqlerrm; event_row_id := null;
      return next;
    end;
  end loop;
end;
$$;
comment on function public.import_revenue_events is 'Reconciliación de comisiones/reversals (backlog 507). Idempotente por event_id (ON CONFLICT DO NOTHING) — reimportar el mismo reporte de un afiliado no duplica ingresos.';

grant execute on function public.import_revenue_events(jsonb) to authenticated;
