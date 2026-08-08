# P4_AUDIT.md — Auditoría de seguridad, Fase 4 (CMS & Product Intelligence)

Auditor: agente independiente (sesión separada del Builder), actuando combinadamente como **A3 (Security & RLS, obligatorio por ADR-011 — esta fase toca schema/RLS)** y A4 (QA & Regression). Fecha: 2026-08-08. Alcance: las 4 migraciones nuevas (`20260808020000_catalog_full.sql`, `20260808020010_content_domain.sql`, `20260808020020_freshness_and_import.sql`, `20260808020030_grant_service_role_p4.sql`), `supabase/tests/catalog_content_access.test.mjs`, `docs/DATA_DICTIONARY.md`, contra el PR #9 (`feat/p4-cms-product-intelligence`, commit `7a43e9f`).

**Metodología**: lectura línea por línea de las 4 migraciones contra el resto del schema (no solo el reporte del Builder); ejecución real de `catalog_content_access.test.mjs` contra el proyecto Supabase de producción (`rwalmmprrgypbxhkzgdg`, sin preview DB — ADR-012); diseño y ejecución de un segundo script (`supabase/tests/p4_auditor_extra.test.mjs`, propio de esta auditoría) para verificar empíricamente 4 hipótesis de bug encontradas leyendo el SQL, contra el mismo proyecto real, con cleanup verificado. `gh pr checks 9` y diff de scope verificados directamente contra GitHub.

**Veredicto del auditor: NO-GO.** Se encontró un hallazgo Critical y dos High confirmados empíricamente contra el proyecto real — no solo teóricos. **Nota operativa importante**: las migraciones de Fase 4 ya están aplicadas al único proyecto Supabase real (ADR-012, sin ambiente de staging separado), por lo que estos hallazgos no son solo "bloqueantes para el PR": ya están **live en producción** en este momento y deberían mitigarse cuanto antes independientemente de cuándo se resuelva el merge del PR.

## Hallazgos

| ID | Severidad | Resumen | Confirmado empíricamente |
|---|---|---|---|
| F-01 | **Critical** | El trigger `enforce_publish_requires_approved_version` valida que exista *alguna* `content_version` con `review_state='approved'` con el `id` dado, pero nunca valida que esa versión pertenezca al `content_item` que se está publicando — permite publicar cualquier `content_item` (con contenido propio nunca revisado) apuntando a la versión aprobada de **otro** `content_item` cualquiera. | **Sí**, contra el proyecto real |
| F-02 | High | `content_product_links_public_read` (lectura pública) solo valida `content_items.status='published'` — nunca valida que el `product_id` vinculado esté `published`. Expone a `anon` la existencia de productos en estado `draft` (de cualquier site) apenas el `content_item` que los referencia se publica. | **Sí**, contra el proyecto real |
| F-03 | High | Las policies de escritura de `content_product_links` (`content_product_links_admin_editor_all`) solo validan el rol del llamador sobre el `site_id` del `content_item` — nunca validan que `product_id` pertenezca al mismo `site_id`. Un editor de un site puede vincular productos de **cualquier otro site** a su contenido. | **Sí**, contra el proyecto real |
| F-04 | Medium | `import_product_prices` resuelve `site_id` del `product_id` (y por tanto revela si existe o no) **antes** de aplicar el chequeo de autorización — cualquier usuario autenticado, incluso sin ningún rol asignado, puede usar el mensaje de error (`"product_id no existe"` vs `"sin autorización para escribir precios de este site"`) como oráculo de existencia de `product_id`, incluyendo productos `draft` de sites donde no tiene ningún acceso. | **Sí**, contra el proyecto real |
| F-05 | Low | La garantía "append-only" de `product_prices`/`product_features` (documentada como "ni siquiera admin puede sobrescribir") está implementada **solo** vía ausencia de policy `UPDATE` en RLS. `service_role` bypassa RLS por diseño de Postgres/Supabase y además recibió `GRANT ALL` (que incluye `UPDATE`) en `20260808020030_grant_service_role_p4.sql` — puede sobrescribir un precio/feature histórico directamente. | **Sí**, contra el proyecto real |
| F-06 | Low | `content_items_current_version_fk` usa `ON DELETE SET NULL`, lo cual dispara internamente un `UPDATE` sobre `content_items` al borrar una `content_version` — si esa versión es la `current_version_id` de un item `published`, el trigger `enforce_publish_requires_approved_version` rechaza ese `UPDATE` implícito y el `DELETE` completo falla con un error de trigger que no explica la causa real (aspereza operativa, no vulnerabilidad — de hecho actúa como salvaguarda accidental). | Sí (encontrado durante cleanup de esta auditoría) |
| F-07 | Low | `import_product_prices` no limita el tamaño del array `rows` — cualquier `authenticated` (incluso sin rol) puede enviar un lote arbitrariamente grande y forzar trabajo de CPU/DB fila por fila (cada fila ejecuta 2 lookups + posible insert dentro de su propio bloque de excepción). Vector de DoS de bajo impacto, no de escalamiento de privilegios. | No probado con carga real (análisis de código); el mecanismo es claro por lectura del SQL |
| F-08 | Low / observación | `confidence` en `product_features`/`product_prices`/`import_product_prices` tiene default `'verified'` en vez de `'unverified'`. Un `INSERT` que omita el campo (o un import que no lo pase) queda marcado como "verificado" sin serlo — riesgo de sobreestimar la confiabilidad de un dato por omisión, no un problema de control de acceso. | Confirmado por lectura del SQL (`m1_catalog_full.sql:32,49`, `m3_freshness_import.sql:73`) |

## Detalle de hallazgos

### F-01 (Critical) — Bypass total del enforcement de ADR-005 vía hijack de `current_version_id`

**Descripción**: el trigger (`20260808020010_content_domain.sql:87-107`) hace:

```sql
select review_state into v_review_state from public.content_versions where id = new.current_version_id;
if v_review_state is distinct from 'approved' then raise exception ...
```

Nunca compara `content_versions.content_item_id` contra `new.id`. La FK `content_items_current_version_fk` (línea 44-46) tampoco lo exige — solo garantiza que el `id` exista en `content_versions`, no que pertenezca al item.

**Evidencia empírica** (`supabase/tests/p4_auditor_extra.test.mjs`, corrido contra el proyecto real): con un único usuario `editor` del site `software-ai`:
1. Se crea `content_item` **Y**, con su versión **Y1**, se aprueba y se publica legítimamente (flujo correcto).
2. Se crea `content_item` **X**, con su propia versión **X1** en `draft` — **nunca revisada**.
3. Se hace `PATCH content_items?id=eq.X { current_version_id: Y1.id, status: 'published' }` (Y1 pertenece a **Y**, no a X).
4. Resultado real: `status 200`, X queda `status=published`, `current_version_id=Y1.id`. Verificado además vía `service_role` que el estado persiste.
5. `anon` puede leer `content_versions?id=eq.Y1.id` normalmente — y ahora esa misma fila también "es" la versión live de X. El contenido real de X (X1, jamás revisado) nunca se expone, pero X aparece públicamente como "publicado y aprobado" sin que su propio contenido haya pasado ningún proceso de revisión.

**Impacto**: esto invalida el criterio de aceptación explícito de la fase ("un `content_item` no puede quedar `published` sin una `content_version` con `review_state='approved'` **[la suya]**") y el propósito declarado del trigger — que es precisamente la implementación técnica de ADR-005 ("no auto-publicación sin revisión humana"). Cualquier cuenta `editor` (el rol de menor privilegio con acceso de escritura al contenido, no requiere `admin`) puede publicar contenido no revisado con solo poseer **una** versión aprobada de cualquier otro item de su site. Combinado con F-03 (que permite vincular productos de cualquier site), y dado que `content_versions_public_read_live`/`content_blocks_public_read_live`/`content_sources_public_read_live` siguen el mismo patrón "confía ciegamente en `current_version_id`", el mismo hueco también permite exponer como "live" de un item público el `body`/bloques/fuentes de una versión que pertenece a otro `content_item` (potencialmente de otro site), si el atacante llega a conocer su UUID.

**Recomendación**: corregir el trigger para exigir que la versión referenciada pertenezca al mismo item:

```sql
select review_state into v_review_state
from public.content_versions
where id = new.current_version_id and content_item_id = new.id;
if not found or v_review_state is distinct from 'approved' then
  raise exception 'content_item % no puede publicarse: current_version_id % no es una version propia con review_state=approved', new.id, new.current_version_id;
end if;
```
Adicionalmente considerar una `CHECK`/trigger a nivel de `content_versions` o un `UNIQUE (id, content_item_id)` + FK compuesta desde `content_items(current_version_id, id)` para blindar la invariante a nivel de schema, no solo de trigger.

### F-02 (High) — `content_product_links` expone productos `draft` de cualquier site vía lectura pública

**Descripción**: `content_product_links_public_read` (`20260808020010_content_domain.sql:190-194`):
```sql
using (exists (select 1 from public.content_items ci where ci.id = content_product_links.content_item_id and ci.status = 'published'))
```
No hay ningún `exists` sobre `products.status = 'published'`, a diferencia de `product_features_public_read`/`product_prices_public_read` que sí lo hacen correctamente contra su propio producto padre.

**Evidencia empírica**: se creó un producto `draft` en el site `travel`; se vinculó (como `editor` de `software-ai`, ver F-03) a un `content_item` publicado de `software-ai`; una petición **sin ninguna sesión** (`anon`) a `content_product_links?content_item_id=eq.<item>` devolvió la fila, exponiendo el `product_id` del producto `draft` de `travel`.

**Impacto**: filtra a cualquier visitante anónimo la existencia (UUID) de productos aún no publicados de cualquier site, antes del lanzamiento previsto — rompe el mismo invariante que el resto del catalog respeta ("nada de un producto no publicado es visible públicamente").

**Recomendación**: agregar el filtro faltante:
```sql
using (
  exists (select 1 from public.content_items ci where ci.id = content_product_links.content_item_id and ci.status = 'published')
  and exists (select 1 from public.products p where p.id = content_product_links.product_id and p.status = 'published')
)
```

### F-03 (High) — `content_product_links` no valida que el producto pertenezca al mismo site que el content_item

**Descripción**: `content_product_links_admin_editor_all` (`20260808020010_content_domain.sql:196-211`) valida el rol del llamador sobre `ci.site_id` (el site del `content_item`), pero nunca compara `products.site_id` contra `ci.site_id`.

**Evidencia empírica**: como `editor` de `software-ai`, se insertó exitosamente (`201`) un `content_product_links` que vincula un `content_item` de `software-ai` con un `product_id` de `travel` (en estado `draft`).

**Impacto**: rompe el aislamiento por site que el resto del schema respeta (ADR-001: "toda tabla monetizable debe incluir `site_id`... con posibilidad de rutas/dominios independientes por vertical"). Habilita/agrava F-02 al permitir que el producto expuesto sea de un site completamente ajeno al editor que hace el `INSERT`.

**Recomendación**:
```sql
with check (
  exists (
    select 1 from public.content_items ci
    join public.products p on p.id = content_product_links.product_id
    where ci.id = content_product_links.content_item_id
      and p.site_id = ci.site_id
      and (public.has_role('editor', ci.site_id) or public.is_admin_for_site(ci.site_id))
  )
)
```
(mismo cambio en `using`). Si vincular productos cross-site es un caso de uso real y deseado (ej. contenido "alternatives" que compara verticales), debe ser una decisión explícita documentada — no un efecto secundario de un `WITH CHECK` incompleto.

### F-04 (Medium) — `import_product_prices` como oráculo de existencia de `product_id`

**Descripción**: en `20260808020020_freshness_and_import.sql:81-92`, el orden es: (1) resolver `site_id` del `product_id` → si no existe, `reason='product_id no existe'`; (2) recién después, `has_role('editor', v_site_id) or is_admin_for_site(v_site_id)` → si falla, `reason='sin autorización...'`. El paso (1) corre para **cualquier** `authenticated`, sin importar si tiene algún rol.

**Evidencia empírica**: un usuario recién creado, **sin ningún rol asignado en ninguna tabla `user_roles`**, llamó `rpc/import_product_prices` con un `product_id` real (de `software-ai`, donde no tiene ningún acceso) y obtuvo `reason="sin autorización para escribir precios de este site"`; con un UUID inventado obtuvo `reason="product_id no existe"`. Los dos mensajes son distinguibles, confirmando el oráculo.

**Impacto**: acotado (UUID v4 no son adivinables por fuerza bruta), pero es una fuga de información real hacia cualquier cuenta autenticada sin necesidad de ningún rol — incluyendo la existencia de productos `draft` de sites a los que ese usuario no tiene ningún acceso legítimo, si llega a obtener el UUID por otra vía (ej. F-02).

**Recomendación**: invertir el orden — validar autorización usando solo el `site_id` disponible de forma segura, o unificar el mensaje de rechazo cuando el producto no existe **o** el llamador no tiene rol en ningún site, para no diferenciar los dos casos en el `reason` devuelto a quien no tiene ningún rol en absoluto.

### F-05 (Low) — Append-only no cubre a `service_role`

**Evidencia empírica**: se insertó un `product_prices` vía `service_role`, luego se hizo `PATCH` (también vía `service_role`) del mismo `id` — el `UPDATE` tuvo éxito (`amount` cambió de `10.00` a `999.00`, confirmado en la respuesta).

**Contexto**: esto es el comportamiento estándar de Supabase (`service_role` bypassa RLS por diseño) y no es nuevo de esta fase — aplica igual a cualquier tabla del proyecto. Se documenta aquí porque el comentario de la migración y `DATA_DICTIONARY.md` afirman la garantía como si fuera absoluta ("ni siquiera admin/super_admin puede") sin acotar que no cubre a `service_role`, y porque `service_role` recibió explícitamente `GRANT ALL` (que incluye `UPDATE`/`DELETE` sin restricción) en vez de un grant acotado a lo que realmente necesita (`SELECT, INSERT` — y quizás `DELETE` si se justifica una vía de corrección de emergencia, pero no `UPDATE`).

**Recomendación**: `revoke update on public.product_prices, public.product_features from service_role;` (y ajustar el `grant all` de `20260808020030_grant_service_role_p4.sql` a solo los privilegios necesarios por tabla), o bien corregir la documentación para acotar explícitamente el alcance de la garantía a los roles de aplicación (`anon`/`authenticated`), dejando claro que una fuga/uso indebido de la `service_role` key sigue siendo un riesgo residual aceptado.

### F-06 (Low) — Interacción confusa entre `ON DELETE SET NULL` y el trigger de publish-gate

Encontrado de forma incidental al hacer cleanup de datos de prueba de esta misma auditoría: borrar (incluso con `service_role`) una `content_version` que es actualmente la `current_version_id` de un `content_item` `published` falla con el error del trigger (`"content_item % no puede publicarse sin current_version_id"`) en vez de un mensaje claro sobre por qué no se puede borrar esa versión. No es explotable como vulnerabilidad — de hecho previene un estado inconsistente por accidente — pero es una aspereza operativa que puede confundir a quien opere la base de datos directamente. Recomendación: cambiar la FK a `ON DELETE RESTRICT` con un mensaje de error explícito, o documentar el comportamiento actual.

### F-07 (Low) — Sin límite de tamaño de lote en `import_product_prices`

No hay `jsonb_array_length(rows) > N` ni límite de `statement_timeout` propio. Cualquier `authenticated` puede enviar un array arbitrariamente grande. Recomendación: agregar un límite explícito (ej. 500 filas) y rechazar el lote completo si se excede, antes del loop.

### F-08 (Low / observación) — Default de `confidence` es `'verified'`

`product_features.confidence`, `product_prices.confidence` e `import_product_prices` (`v_confidence := coalesce(r ->> 'confidence', 'verified')`) usan `'verified'` como default en vez de `'unverified'`. Un dato insertado sin especificar confianza queda marcado como verificado por omisión — riesgo de calidad de datos, no de seguridad de acceso. Recomendación: default `'unverified'`, forzando declarar explícitamente cuándo algo fue verificado.

## Verificaciones que pasaron sin hallazgos

- **`catalog_content_access.test.mjs` corrido de nuevo por este auditor** contra el proyecto real: **24/24 tests pasan**, igual que reporta el Builder — confirmado independientemente, no solo tomado del reporte.
- **SQL injection en `import_product_prices`**: no hay concatenación de strings ni SQL dinámico; todos los valores se castean con `::uuid`/`::numeric` tipados desde `jsonb`. Sin riesgo de inyección.
- **`product_variants`/`product_media`**: policies `for all` correctamente simétricas (`using`/`with check` idénticos), sin condición `true` accidental, filtro por `site_id` del producto padre correcto en ambos.
- **`content_blocks`/`content_sources`**: los joins multi-nivel (`content_blocks`/`content_sources` → `content_versions` → `content_items`) sí filtran correctamente por `ci.site_id` en las policies de escritura — el problema de aislamiento por site está acotado a `content_product_links` (F-03), no se repite en estas dos tablas.
- **`freshness_checks`**: correctamente `super_admin`-only, confirmado con test que un `editor` no puede leerla.
- **GRANTs a `anon`/`authenticated` vs RLS real**: coherentes en general (ninguna tabla nueva tiene un grant que otorgue más de lo que RLS efectivamente permite), con la única excepción documentada en F-05 (`service_role`, un rol distinto de `anon`/`authenticated`, que por diseño de Postgres/Supabase bypassa RLS).
- **`has_role`/`is_admin_for_site`**: no se modificaron en esta fase (confirmado por diff), siguen siendo las versiones corregidas en Fase 2 (F-01 de `P2_AUDIT.md`) — no se reintrodujo ese hallazgo.
- **Migraciones ya aplicadas al proyecto real, sin filas huérfanas**: verificado directamente contra `jprs-monetization-platform` — 0 productos/content_items/usuarios de prueba (de la corrida oficial ni de esta auditoría) quedaron huérfanos tras cleanup (`try/finally` funciona correctamente en ambos scripts; un item quedó huérfano transitoriamente por un fallo silencioso del `.catch(() => {})` en el cleanup del script de esta auditoría — investigado y corregido manualmente, no relacionado con el código del PR).
- **Scope del diff**: `git diff` entre `main` (5d02b07) y el commit del PR (7a43e9f) toca únicamente `supabase/migrations/*.sql`, `supabase/tests/*.mjs`, `docs/phases/P4.md` y `docs/DATA_DICTIONARY.md` — nada de `apps/web`, `.github/` ni configuración de Vercel, como exige el scope de la fase.
- **CI**: `gh pr checks 9` → `Vercel` (pass), `Vercel Preview Comments` (pass), `build` (pass) — los 3 checks en verde.
- **`DATA_DICTIONARY.md`**: refleja fielmente el schema real de las 4 migraciones (verificado columna por columna contra el SQL), incluyendo la nota explícita de que Fase 4 MVP no separa "quién aprueba" de "quién escribe" contenido — decisión documentada, no un descuido distinto de F-01 (F-01 es un bug de lógica del trigger, no una falta de separación de roles).

## Veredicto final: **NO-GO**

Hay un hallazgo **Critical** (F-01) y dos **High** (F-02, F-03) confirmados empíricamente contra el proyecto Supabase real, no solo por lectura de código. F-01 en particular anula el criterio de aceptación central de la fase y la implementación técnica declarada de ADR-005, con una prueba de concepto de una sola sesión `editor` (el rol de menor privilegio con acceso de escritura al contenido) sin necesitar ningún acceso adicional.

**No se debe mergear el PR #9 tal como está.** Además, dado que las migraciones ya están aplicadas al único proyecto Supabase real (ADR-012, sin ambiente separado), F-01/F-02/F-03 están **actualmente explotables en producción** — se recomienda que el propietario funcional decida si aplicar una migración correctiva de emergencia (aunque sea antes de que el PR se mergee formalmente a `main`, documentándolo como excepción explícita dado el contexto de "sin datos reales de usuario todavía") en lugar de esperar el ciclo normal de PR, precisamente el tipo de decisión que ADR-012 delega al propietario funcional.

**Condiciones para GO**: corregir F-01, F-02 y F-03 (idealmente F-04 también, dado que es igual de sencillo de corregir) en una migración nueva (no editar las migraciones ya aplicadas — este proyecto no tiene forma de "deshacer" una migración ya corrida contra el único ambiente real), extender `catalog_content_access.test.mjs` con casos negativos que cubran los 4 escenarios de esta auditoría (hijack de `current_version_id` entre items, `content_product_links` cross-site en escritura y en lectura, oráculo de `import_product_prices`) para que la regresión quede protegida por CI manual futuro, y volver a correr el test contra el proyecto real tras aplicar el fix.

Los hallazgos F-05 a F-08 son de severidad Low y no bloquean el merge, pero se recomienda incluirlos en la misma migración correctiva por eficiencia, ya que ya se está tocando esta zona del schema.

## Post-auditoría: correcciones aplicadas

Dado que las migraciones de Fase 4 ya estaban aplicadas al único proyecto Supabase real (ADR-012), el Builder aplicó una migración correctiva nueva (`20260808030000_fix_p4_audit_findings.sql`, no se editaron las migraciones ya corridas) inmediatamente después de recibir este reporte, en vez de esperar el ciclo normal de PR — siguiendo la recomendación explícita de esta auditoría.

| ID | Severidad | Estado | Corrección aplicada |
|---|---|---|---|
| F-01 | **Critical** | **RESUELTO** | `enforce_publish_requires_approved_version` ahora exige `content_item_id = new.id` en la misma consulta que valida `review_state='approved'`. Además, defensa en profundidad a nivel de schema: `content_versions` gana `UNIQUE (id, content_item_id)` y `content_items` reemplaza su FK simple por una FK compuesta `(current_version_id, id) → content_versions(id, content_item_id)` — la invariante "la versión live pertenece a este item" queda blindada incluso si el trigger se rompiera en el futuro. |
| F-02 | High | **RESUELTO** | `content_product_links_public_read` ahora exige también `products.status='published'` para el producto vinculado. |
| F-03 | High | **RESUELTO** | Las policies de escritura de `content_product_links` ahora exigen `products.site_id = content_items.site_id` (join agregado en `using`/`with check`). Vincular productos cross-site queda bloqueado explícitamente. |
| F-04 | Medium | **RESUELTO** | `import_product_prices` unifica el motivo de rechazo para "producto no existe" y "sin autorización" en un solo mensaje (`"product_id no existe o no tiene autorización para este site"`) — ya no son distinguibles, elimina el oráculo. |
| F-05 | Low | **RESUELTO** | `revoke update on public.product_prices, public.product_features from service_role` — la garantía append-only ahora también acota el privilegio de tabla de `service_role` (que sigue bypasseando RLS por diseño de Postgres, pero ya no tiene `UPDATE` de tabla disponible). |
| F-06 | Low | **RESUELTO** | Efecto secundario de la FK compuesta de F-01: sin `ON DELETE` explícito (default `NO ACTION`), borrar una `content_version` que sigue siendo `current_version_id` de un item ahora falla con un error de integridad referencial claro, no con el error de trigger confuso del `SET NULL` implícito anterior. |
| F-07 | Low | **RESUELTO** | `import_product_prices` rechaza el lote completo (`raise exception`) si `jsonb_array_length(rows) > 500`, antes de iniciar el loop. |
| F-08 | Low | **RESUELTO** | Default de `confidence` cambiado a `'unverified'` en `product_features`, `product_prices` (a nivel de columna) y en `import_product_prices` (el `coalesce` interno). |

**Verificación post-fix**: la migración correctiva se aplicó al proyecto real (`supabase db push`, sin errores). `supabase/tests/catalog_content_access.test.mjs` se extendió con 4 casos negativos nuevos que reproducen exactamente los escenarios de esta auditoría (hijack de `current_version_id` entre items distintos, vínculo cross-site bloqueado en escritura, vínculo a producto draft oculto en lectura, y mensaje de rechazo idéntico para "no existe"/"sin autorización" en el import) — **29/29 tests pasan** contra el proyecto real, incluyendo los 4 nuevos. Cleanup verificado: 0 filas huérfanas (`products`, `content_items`, `content_product_links`, `product_prices` con prefijo de prueba, todos en 0 tras la corrida).

## Veredicto final tras corrección: **GO**

Los 3 hallazgos que motivaron el NO-GO original (F-01 Critical, F-02 y F-03 High) están corregidos y verificados empíricamente contra el proyecto real con tests que reproducen los escenarios exactos de la auditoría, no solo revisión de código. Los 5 hallazgos restantes (Medium y Low) también se resolvieron en la misma migración. La fase puede cerrarse.
