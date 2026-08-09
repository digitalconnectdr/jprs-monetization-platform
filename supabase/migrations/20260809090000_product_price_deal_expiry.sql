-- Fase 6C (backlog 624): las ofertas deben vencer automáticamente sin alterar
-- el ledger append-only de precios. Una fila sale conserva su evidencia histórica;
-- expires_at determina únicamente si puede exponerse al visitante anónimo.

alter table public.product_prices
  add column expires_at timestamptz;

alter table public.product_prices
  add constraint product_prices_sale_expiry_check
  check (expires_at is null or price_type = 'sale');

comment on column public.product_prices.expires_at is
  'Fin verificable de una oferta. Solo se admite para price_type=sale; las filas vencidas se conservan como historial pero RLS no las expone a anon.';

-- La política anterior exponía todos los precios de productos published. Mantener
-- el filtro en RLS, además del filtro de consulta de la app, evita que un cliente
-- anónimo pueda recuperar una oferta vencida directamente por PostgREST.
drop policy "product_prices_public_read" on public.product_prices;

create policy "product_prices_public_read_current" on public.product_prices
  for select
  using (
    (expires_at is null or expires_at > now())
    and exists (
      select 1
      from public.products p
      where p.id = product_prices.product_id
        and p.status = 'published'
    )
  );
