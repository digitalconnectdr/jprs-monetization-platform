-- Fase 6C (backlog 624): las ofertas deben vencer automáticamente sin alterar
-- el ledger append-only de precios. Una fila sale conserva su evidencia histórica;
-- expires_at determina únicamente si puede exponerse al visitante anónimo.

alter table public.product_prices
  add column expires_at timestamptz;

alter table public.product_prices
  add constraint product_prices_sale_expiry_check
  check (
    (price_type = 'sale' and expires_at is not null)
    or (price_type <> 'sale' and expires_at is null)
  );

comment on column public.product_prices.expires_at is
  'Fin verificable y obligatorio para price_type=sale; queda vacío para todo otro tipo. Las filas vencidas se conservan como historial pero RLS no las expone a anon.';

-- La política anterior exponía todos los precios de productos published. Mantener
-- el filtro en RLS, además del filtro de consulta de la app, evita que un cliente
-- anónimo pueda recuperar una oferta vencida directamente por PostgREST.
drop policy "product_prices_public_read" on public.product_prices;

create policy "product_prices_public_read_current" on public.product_prices
  for select
  using (
    (price_type <> 'sale' or expires_at > now())
    and exists (
      select 1
      from public.products p
      where p.id = product_prices.product_id
        and p.status = 'published'
    )
  );

-- La vía de importación masiva es parte del contrato de product_prices. Debe
-- preservar expires_at para que una oferta válida no sea descartada por la nueva
-- constraint, sin abrir un bypass para filas sale sin vencimiento.
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
  v_expires_at timestamptz;
  v_site_id uuid;
  v_authorized boolean;
  v_new_id uuid;
  v_not_found_or_unauthorized constant text := 'product_id no existe o no tiene autorización para este site';
begin
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
      v_product_id := nullif(r ->> 'product_id', '')::uuid;
      v_variant_id := nullif(r ->> 'variant_id', '')::uuid;
      v_vendor_id := nullif(r ->> 'vendor_id', '')::uuid;
      v_price_type := coalesce(r ->> 'price_type', 'list');
      v_amount := (r ->> 'amount')::numeric;
      v_currency := coalesce(r ->> 'currency', 'USD');
      v_source := r ->> 'source';
      v_confidence := coalesce(r ->> 'confidence', 'unverified');
      v_expires_at := nullif(r ->> 'expires_at', '')::timestamptz;

      if v_product_id is null then
        row_index := idx; status := 'rejected'; reason := 'product_id requerido'; price_id := null;
        return next;
        continue;
      end if;

      select site_id into v_site_id from public.products where id = v_product_id;
      v_authorized := v_site_id is not null and (public.has_role('editor', v_site_id) or public.is_admin_for_site(v_site_id));
      if not v_authorized then
        row_index := idx; status := 'rejected'; reason := v_not_found_or_unauthorized; price_id := null;
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

      if (v_price_type = 'sale' and v_expires_at is null)
        or (v_price_type <> 'sale' and v_expires_at is not null) then
        row_index := idx; status := 'rejected'; reason := 'expires_at es obligatorio solo para price_type=sale'; price_id := null;
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

      insert into public.product_prices (product_id, variant_id, vendor_id, price_type, amount, currency, source, confidence, expires_at)
      values (v_product_id, v_variant_id, v_vendor_id, v_price_type, v_amount, v_currency, v_source, v_confidence, v_expires_at)
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
