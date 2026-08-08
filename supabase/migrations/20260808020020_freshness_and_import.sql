-- Operations domain (freshness) + bulk import validation (PROJECT_BLUEPRINT.md §5,
-- backlog 406/405). Sin cron/Edge Function todavía (Fase 9 dispara los checks) y sin
-- endpoint HTTP de import (requiere la misma auth de admin que la UI, diferida — ver
-- docs/phases/P4.md "Explícitamente fuera de scope"). Aquí solo el dato y la función SQL.

create table public.freshness_checks (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('product_price', 'product_feature', 'content_item')),
  entity_id uuid not null,
  last_checked_at timestamptz not null default now(),
  next_check_due_at timestamptz not null,
  status text not null default 'fresh' check (status in ('fresh', 'due', 'stale')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.freshness_checks is 'Cola de qué entidad necesita revisión y cuándo. Herramienta interna de operaciones — nunca pública. El job que la puebla/consume automáticamente es Fase 9.';

create index freshness_checks_entity_idx on public.freshness_checks (entity_type, entity_id);
create index freshness_checks_due_idx on public.freshness_checks (next_check_due_at) where status <> 'fresh';

alter table public.freshness_checks enable row level security;

create policy "freshness_checks_admin_all" on public.freshness_checks
  for all
  using (public.has_role('super_admin'))
  with check (public.has_role('super_admin'));

grant select, insert, update, delete on public.freshness_checks to authenticated;

-- Bulk import validation (backlog 405): valida cada fila del lote y rechaza las
-- inválidas sin abortar las válidas. SECURITY DEFINER porque hace INSERT directo en
-- product_prices (que no tiene policy de UPDATE, pero sí de INSERT vía RLS normal) —
-- se usa aquí para poder devolver un reporte fila-por-fila en una sola llamada, pero
-- la autorización NO se delega a RLS: se valida explícitamente adentro con
-- has_role/is_admin_for_site usando auth.uid() del llamador, exactamente igual que si
-- RLS estuviera activo. Sin esto, SECURITY DEFINER sería una escalada de privilegios.
create or replace function public.import_product_prices(rows jsonb)
returns table (row_index int, status text, reason text, price_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
  idx int := 0;
  v_product_id uuid;
  v_variant_id uuid;
  v_vendor_id uuid;
  v_price_type text;
  v_amount numeric;
  v_currency text;
  v_source text;
  v_confidence text;
  v_site_id uuid;
  v_new_id uuid;
begin
  if jsonb_typeof(rows) is distinct from 'array' then
    raise exception 'rows debe ser un array JSON';
  end if;

  for r in select * from jsonb_array_elements(rows)
  loop
    idx := idx + 1;
    begin
      v_product_id := nullif(r ->> 'product_id', '')::uuid;
      v_variant_id := nullif(r ->> 'variant_id', '')::uuid;
      v_vendor_id := nullif(r ->> 'vendor_id', '')::uuid;
      v_price_type := coalesce(r ->> 'price_type', 'list');
      v_amount := (r ->> 'amount')::numeric;
      v_currency := coalesce(r ->> 'currency', 'USD');
      v_source := r ->> 'source';
      v_confidence := coalesce(r ->> 'confidence', 'verified');

      if v_product_id is null then
        row_index := idx; status := 'rejected'; reason := 'product_id requerido'; price_id := null;
        return next;
        continue;
      end if;

      select site_id into v_site_id from public.products where id = v_product_id;
      if v_site_id is null then
        row_index := idx; status := 'rejected'; reason := 'product_id no existe'; price_id := null;
        return next;
        continue;
      end if;

      if not (public.has_role('editor', v_site_id) or public.is_admin_for_site(v_site_id)) then
        row_index := idx; status := 'rejected'; reason := 'sin autorización para escribir precios de este site'; price_id := null;
        return next;
        continue;
      end if;

      if v_amount is null or v_amount < 0 then
        row_index := idx; status := 'rejected'; reason := 'amount inválido (requiere >= 0)'; price_id := null;
        return next;
        continue;
      end if;

      if char_length(v_currency) <> 3 then
        row_index := idx; status := 'rejected'; reason := 'currency debe ser código de 3 letras'; price_id := null;
        return next;
        continue;
      end if;

      if v_price_type not in ('list', 'sale', 'subscription_monthly', 'subscription_yearly', 'starting_at') then
        row_index := idx; status := 'rejected'; reason := 'price_type inválido'; price_id := null;
        return next;
        continue;
      end if;

      if v_source is null or length(trim(v_source)) = 0 then
        row_index := idx; status := 'rejected'; reason := 'source requerido'; price_id := null;
        return next;
        continue;
      end if;

      if v_confidence not in ('verified', 'estimated', 'unverified') then
        row_index := idx; status := 'rejected'; reason := 'confidence inválido'; price_id := null;
        return next;
        continue;
      end if;

      insert into public.product_prices (product_id, variant_id, vendor_id, price_type, amount, currency, source, confidence)
      values (v_product_id, v_variant_id, v_vendor_id, v_price_type, v_amount, v_currency, v_source, v_confidence)
      returning id into v_new_id;

      row_index := idx; status := 'accepted'; reason := null; price_id := v_new_id;
      return next;
    exception when others then
      row_index := idx; status := 'rejected'; reason := sqlerrm; price_id := null;
      return next;
    end;
  end loop;
end;
$$;
comment on function public.import_product_prices is 'Bulk import con validación fila-por-fila (backlog 405) — rechaza filas inválidas sin abortar el lote. Autorización manual dentro de la función (ver comentario arriba); SECURITY DEFINER no bypasea el chequeo de rol.';

grant execute on function public.import_product_prices(jsonb) to authenticated;
