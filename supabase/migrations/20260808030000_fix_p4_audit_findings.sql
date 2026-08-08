-- Corrige los hallazgos de docs/audits/P4_AUDIT.md (auditoría independiente
-- obligatoria por ADR-011, dado que Fase 4 toca schema/RLS). Veredicto original:
-- NO-GO — 1 Critical + 2 High confirmados empíricamente contra el proyecto real.
--
-- Las migraciones de Fase 4 (20260808020000-020030) ya estaban aplicadas al único
-- proyecto Supabase real (ADR-012, sin ambiente separado) cuando se encontraron estos
-- hallazgos, así que quedaban explotables en producción — se corrigen en una
-- migración nueva en vez de editar las ya aplicadas (este proyecto no tiene forma de
-- "deshacer" una migración ya corrida).

-- F-01 (Critical): el trigger nunca validaba que la content_version referenciada por
-- current_version_id perteneciera al MISMO content_item — permitía publicar
-- cualquier content_item (con su propio contenido nunca revisado) apuntando a la
-- versión aprobada de OTRO content_item cualquiera. Confirmado empíricamente por el
-- auditor con una sola sesión "editor".
create or replace function public.enforce_publish_requires_approved_version()
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
    select review_state into v_review_state
    from public.content_versions
    where id = new.current_version_id and content_item_id = new.id;
    if not found or v_review_state is distinct from 'approved' then
      raise exception 'content_item % no puede publicarse: current_version_id % no es una versión propia con review_state=approved', new.id, new.current_version_id;
    end if;
  end if;
  return new;
end;
$$;

-- Defensa en profundidad adicional recomendada por el auditor: blindar la invariante
-- "current_version_id, si existe, pertenece a este content_item" a nivel de schema,
-- no solo de trigger — una FK compuesta no puede verificar review_state (eso sigue
-- siendo trabajo del trigger), pero sí que content_item_id coincida siempre.
--
-- Esta FK compuesta reemplaza a la FK original de una sola columna
-- (content_items_current_version_fk, ON DELETE SET NULL): además de blindar la
-- invariante, resuelve F-06 como efecto secundario — sin ON DELETE explícito, el
-- default es NO ACTION, así que borrar una content_version que sigue siendo
-- current_version_id de un item falla con un error de integridad referencial claro,
-- en vez del error de trigger confuso que producía el SET NULL implícito.
alter table public.content_items drop constraint content_items_current_version_fk;

alter table public.content_versions
  add constraint content_versions_id_item_unique unique (id, content_item_id);

alter table public.content_items
  add constraint content_items_current_version_matches_item
  foreign key (current_version_id, id) references public.content_versions (id, content_item_id);

-- F-02 (High): content_product_links_public_read no validaba que el producto
-- vinculado estuviera published — exponía a anon la existencia de productos draft de
-- cualquier site en cuanto el content_item que los referencia se publicaba.
drop policy "content_product_links_public_read" on public.content_product_links;
create policy "content_product_links_public_read" on public.content_product_links
  for select
  using (
    exists (select 1 from public.content_items ci where ci.id = content_product_links.content_item_id and ci.status = 'published')
    and exists (select 1 from public.products p where p.id = content_product_links.product_id and p.status = 'published')
  );

-- F-03 (High): las policies de escritura no validaban que product_id perteneciera al
-- mismo site_id que el content_item — un editor de un site podía vincular productos
-- de cualquier otro site. Vincular productos cross-site no es un caso de uso
-- documentado (ver docs/phases/P4.md); se bloquea explícitamente.
drop policy "content_product_links_admin_editor_all" on public.content_product_links;
create policy "content_product_links_admin_editor_all" on public.content_product_links
  for all
  using (
    exists (
      select 1 from public.content_items ci
      join public.products p on p.id = content_product_links.product_id
      where ci.id = content_product_links.content_item_id
        and p.site_id = ci.site_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  )
  with check (
    exists (
      select 1 from public.content_items ci
      join public.products p on p.id = content_product_links.product_id
      where ci.id = content_product_links.content_item_id
        and p.site_id = ci.site_id
        and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
    )
  );

-- F-04 (Medium) + F-07 (Low) + F-08 (Low): import_product_prices resolvía la
-- existencia de product_id ANTES de chequear autorización, permitiendo a cualquier
-- authenticated (sin ningún rol) usar el mensaje de error como oráculo de existencia
-- de productos draft de sites ajenos. Se unifica el mensaje de rechazo para los dos
-- casos (no existe / sin autorización) — ya no son distinguibles. De paso: límite de
-- tamaño de lote (F-07) y default de confidence a 'unverified' (F-08, un dato sin
-- confidence declarado no debe asumirse verificado).
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

      if v_product_id is null then
        row_index := idx; status := 'rejected'; reason := 'product_id requerido'; price_id := null;
        return next;
        continue;
      end if;

      -- F-04: se resuelve site_id Y se chequea autorización en el mismo paso, sin
      -- revelar en el mensaje si la causa fue "no existe" o "sin rol" — antes eran
      -- mensajes distinguibles y servían de oráculo de existencia de product_id.
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

-- F-08 (Low): mismo cambio de default en las columnas base — un INSERT directo (no
-- vía import_product_prices) que omita confidence tampoco debe asumirse "verified".
alter table public.product_features alter column confidence set default 'unverified';
alter table public.product_prices alter column confidence set default 'unverified';

-- F-05 (Low): la garantía append-only ("nadie puede sobrescribir un precio/feature
-- histórico") se documentó como absoluta pero no cubría a service_role, que recibió
-- GRANT ALL (incluye UPDATE) en 20260808020030_grant_service_role_p4.sql.
-- service_role bypassa RLS por diseño de Postgres/Supabase — eso no cambia — pero no
-- necesita privilegio de tabla UPDATE para su uso real (jobs/backend/migraciones), así
-- que se revoca explícitamente para que una fuga/uso indebido de la service_role key
-- no pueda alterar histórico por accidente ni a propósito.
revoke update on public.product_prices, public.product_features from service_role;

-- F-06 (Low): resuelto arriba como efecto secundario de reemplazar
-- content_items_current_version_fk por la FK compuesta (ver comentario en esa sección).
