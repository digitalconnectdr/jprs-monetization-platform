# DATA_DICTIONARY.md

Fuente de verdad del schema: `supabase/migrations/`. Este documento es la explicación legible — si hay discrepancia, las migraciones mandan. Mantenido por A9 (Project Controller), actualizado en cada fase que agregue/modifique tablas.

## Convenciones

- Todas las tablas viven en el schema `public`.
- El proyecto Supabase tiene **"Automatically expose new tables" desactivado** (decisión de Fase 1) — cada tabla requiere `GRANT` explícito a `anon`/`authenticated` además de RLS. RLS restringe filas; el `GRANT` habilita el acceso a nivel de sentencia SQL. Ambos son necesarios.
- RLS está habilitado en el 100% de las tablas desde su creación (fail-closed: sin policies, nadie salvo `service_role` accede).
- Toda tabla monetizable/scoped requiere `site_id` o `niche_id` (regla de datos, `PROJECT_BLUEPRINT.md` §5).

## Dominio: identity

### `roles`
Catálogo de referencia de los 6 roles RBAC del blueprint.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text unique | `super_admin`, `admin`, `editor`, `analyst`, `user`, `vendor` |
| description | text | |
| created_at | timestamptz | |

RLS: lectura para `authenticated` (sin acceso `anon`). Sin policy de escritura — solo `service_role` puede modificar el catálogo de roles.

### `profiles`
Extiende `auth.users`. Se crea automáticamente vía trigger `handle_new_user` al registrarse.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK, FK → auth.users(id) | |
| display_name | text | |
| avatar_url | text | |
| created_at / updated_at | timestamptz | |

RLS: cada usuario lee/edita su propio perfil; `super_admin` lee todos (gestión de usuarios).

### `user_roles`
Asignación de roles a usuarios, con scope opcional por `site_id`.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users(id) | |
| role_id | uuid FK → roles(id) | |
| site_id | uuid FK → sites(id), nullable | **NULL = scope global** (ej. super_admin). No nulo = scope a esa property — esto implementa el criterio de aceptación "Admin scope funciona por property". |
| created_at / created_by | | |

RLS: cada usuario lee sus propias asignaciones; `super_admin` lee/escribe todas. Nadie más puede asignar roles (ni siquiera un `admin` de site puede promoverse ni promover a otros — deliberado para Fase 2; delegar esa capacidad a `admin` es una decisión explícita a tomar más adelante, no un descuido).

### `user_preferences`
| Columna | Tipo | Notas |
|---|---|---|
| user_id | uuid PK, FK → auth.users(id) | |
| locale | text | default `'en'` |
| newsletter_opt_in | boolean | default `false` |
| preferences | jsonb | extensible |

RLS: cada usuario gestiona únicamente las propias.

**Trigger `enforce_role_scope`** (agregado tras F-01 de `docs/audits/P2_AUDIT.md`): rechaza cualquier `insert`/`update` en `user_roles` donde `site_id` sea `NULL` (scope global) para un rol que no sea `super_admin`. Sin esto, una fila `(role='admin', site_id=null)` otorgaría admin global silenciosamente — corre incluso para escrituras vía `service_role`, como defensa en profundidad.

### Funciones de autorización (`security definer`, `search_path` fijo)

- `has_role(role_name text, p_site_id uuid default null) → boolean`: ¿`auth.uid()` tiene `role_name = 'super_admin'` con scope global (`site_id` null), O tiene `role_name` scoped específicamente a `p_site_id`? **Corregido tras F-01**: antes, `site_id IS NULL` matcheaba para cualquier rol (no solo `super_admin`), lo que habría permitido escalamiento global silencioso si alguna vez se delegaba la asignación de roles a un `admin` de property.
- `is_admin_for_site(p_site_id uuid) → boolean`: `super_admin` O `admin` de ese site específico.
- `is_admin_for_niche(p_niche_id uuid) → boolean`: `super_admin` O `admin` de algún site dentro de ese niche.

Estas funciones son `security definer` para evitar recursión de RLS (una policy sobre `user_roles` no puede consultar `user_roles` bajo su propia RLS sin recursión) y fijan `search_path` para evitar hijacking. Se usan dentro de policies de todos los dominios.

## Dominio: properties

### `niches`
Los verticales (Business Software & AI, Travel & Smart Travel, Consumer Tech & Smart Home).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| slug | text unique | |
| name / description | text | |
| status | text | `active` / `inactive` / `planned` |

RLS: lectura pública (`anon`+`authenticated`) solo si `status = 'active'`. Escritura: solo `super_admin`.

### `sites`
Propiedad desplegable (`site_id` usado en el resto del schema). MVP: 1 site por niche.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| niche_id | uuid FK → niches(id) | |
| slug | text unique | |
| name / domain | text | |
| status | text | `draft` / `active` / `paused` |

RLS: lectura pública solo si `status = 'active'` **y** el niche padre también está `active` (F-06 — evita que pausar un niche completo deje sus sites visibles por descuido). Escritura separada por operación (F-02, no una sola policy `for all`): `admin`/`super_admin` de ese site pueden `select`/`update`; **solo `super_admin` puede `insert` o `delete`** un site — un `admin` scoped a un solo site ya no puede eliminarlo (evitaba que arrastrara por `CASCADE` los `user_roles`/`site_settings` de otros usuarios de esa property).

### `categories`
Subcategorías por nicho (ej. CRM, AI assistants).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| niche_id | uuid FK → niches(id) | |
| parent_category_id | uuid FK → categories(id), nullable | auto-referencia para sub-subcategorías |
| slug / name | text | único por `(niche_id, slug)` |

RLS: lectura pública si el niche padre está `active`. Escritura: `admin`/`super_admin` del niche (`is_admin_for_niche`).

### `site_settings`
Configuración flexible por site — **nunca pública**.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| site_id | uuid FK → sites(id) | |
| key | text | único por `(site_id, key)` |
| value | jsonb | |

RLS: sin policy de lectura para `anon`. Solo `admin`/`super_admin` del site (lectura y escritura).

## Dominio: catalog

### `vendors`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| niche_id | uuid FK → niches(id) | |
| slug / name | text | único por `(niche_id, slug)` |
| website_url | text | |
| status | text | `draft` / `published` / `archived` |

RLS: lectura pública solo `published`. Escritura: `admin` o `editor` de algún site dentro del niche, o `super_admin`.

### `products`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| site_id | uuid FK → sites(id) | |
| category_id | uuid FK → categories(id), nullable | |
| vendor_id | uuid FK → vendors(id), nullable | |
| slug / name | text | único por `(site_id, slug)` |
| status | text | `draft` / `published` / `archived` |

RLS: lectura pública solo `published` (nunca thin/draft visible — alineado con `CONTENT_POLICY.md`). Escritura: `admin`/`editor` de ese site, o `super_admin`.

### `product_variants`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK → products(id) | |
| slug / name | text | único por `(product_id, slug)` |
| status | text | `draft` / `published` / `archived` |

RLS: lectura pública si `status='published'` **y** el producto padre está `published`. Escritura: `editor`/`admin` del site del producto padre.

### `product_features` y `product_prices` — append-only

> Regla de datos no negociable (`PROJECT_BLUEPRINT.md` §5): "no se sobrescribe histórico — precios, comisiones y métricas requieren series temporales". Se implementa como **garantía técnica, no solo convención**: ninguna de las dos tablas tiene policy de `UPDATE` para `anon`/`authenticated` (ni siquiera `admin`/`super_admin`). Cada cambio de precio o feature es una fila nueva con `checked_at` más reciente; el valor "actual" es la fila con mayor `checked_at` para la misma clave. `DELETE` está reservado a `super_admin` (corrección de un dato erróneo en casos extremos, no edición de rutina). **`service_role` no tiene `UPDATE` de tabla** (revocado explícitamente tras F-05 de `docs/audits/P4_AUDIT.md`) — sigue bypasseando RLS por diseño de Postgres/Supabase, pero ya no tiene el privilegio de tabla necesario para alterar una fila histórica.

### `product_features`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK → products(id) | |
| variant_id | uuid FK → product_variants(id), nullable | |
| feature_key / feature_value | text | |
| source | text | **requerido** |
| checked_at | timestamptz | **requerido**, default `now()` |
| confidence | text | `verified` / `estimated` / `unverified`, default `unverified` (corregido tras F-08 — un dato sin confidence declarado no debe asumirse verificado) |

RLS: lectura pública si el producto padre está `published`. `INSERT`: `editor`/`admin` del site del producto. Sin `UPDATE` para nadie (incluido `service_role`, ver arriba). `DELETE`: solo `super_admin`.

### `product_prices`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK → products(id) | |
| variant_id | uuid FK → product_variants(id), nullable | |
| vendor_id | uuid FK → vendors(id), nullable | qué merchant ofrece este precio |
| price_type | text | `list` / `sale` / `subscription_monthly` / `subscription_yearly` / `starting_at` |
| amount | numeric(12,2) | `>= 0` |
| currency | text | código ISO de 3 letras |
| source | text | **requerido** |
| checked_at | timestamptz | **requerido**, default `now()` |
| confidence | text | `verified` / `estimated` / `unverified`, default `unverified` (F-08) |

RLS: igual patrón que `product_features` (lectura pública si producto published, `INSERT` editor/admin del site, sin `UPDATE` para nadie incluido `service_role`, `DELETE` solo `super_admin`).

### `product_media`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK → products(id) | |
| variant_id | uuid FK → product_variants(id), nullable | |
| media_type | text | `image` / `video` |
| url / alt_text | text | |
| sort_order | int | |
| status | text | `draft` / `published` / `archived` |

A diferencia de features/prices, **sí es editable** (gestión de assets, no histórico de hechos) — CRUD completo para `editor`/`admin` del site.

## Dominio: content

Pipeline de `PROJECT_BLUEPRINT.md` §15 (Draft → Fact Check → Editorial/UX Review → Monetization Policy Review → Publish) implementado como versionado real, no edición in-place.

### `content_items`
Unidad publicable (Best X, VS, Review, Buying Guide, Tool, etc.).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| site_id | uuid FK → sites(id) | |
| category_id | uuid FK → categories(id), nullable | |
| content_type | text | `best_x` / `vs` / `alternatives` / `review` / `buying_guide` / `tool` / `landing` / `support` |
| slug / title | text | único por `(site_id, slug)` |
| status | text | `draft` / `in_review` / `published` / `archived` |
| current_version_id | uuid FK → content_versions(id), nullable | qué versión está live |
| created_by | uuid FK → auth.users(id) | |

**Trigger `enforce_publish_requires_approved_version`**: rechaza cualquier `insert`/`update` que ponga `status='published'` a menos que `current_version_id` no sea nulo y **esa versión, perteneciente al mismo `content_item`,** tenga `review_state='approved'`. Esto implementa ADR-005 (no auto-publicación sin revisión humana) como garantía de base de datos, no solo de UI — importante porque todavía no existe ninguna UI de admin que lo hiciera cumplir (ver `docs/phases/P4.md`). **Corregido tras F-01 de `docs/audits/P4_AUDIT.md` (Critical)**: la versión original del trigger no comparaba `content_versions.content_item_id` contra el item que se publicaba, permitiendo "tomar prestada" la versión aprobada de cualquier otro item del proyecto para publicar contenido nunca revisado. Blindado además a nivel de schema: `content_versions` tiene `UNIQUE (id, content_item_id)` y `content_items.current_version_id` es una FK compuesta `(current_version_id, id) → content_versions(id, content_item_id)`, no una FK simple — la invariante "la versión live pertenece a este item" no depende únicamente del trigger.

RLS: lectura pública solo `status='published'`. Escritura: `editor`/`admin` del site.

### `content_versions`
Cada edición es una fila nueva (versionado real).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| content_item_id | uuid FK → content_items(id) | |
| version_number | int | único por `(content_item_id, version_number)` |
| body | jsonb | |
| review_state | text | `draft` / `pending_editorial_review` / `pending_monetization_review` / `approved` / `rejected` |
| author_id / reviewed_by | uuid FK → auth.users(id), nullable | |
| reviewed_at | timestamptz, nullable | |

RLS: lectura pública **solo** de la versión que es `current_version_id` de un `content_item` con `status='published'` — un draft de un item ya publicado sigue sin ser público. `editor`/`admin` del site ven y escriben todas las versiones de su site (incluye poder marcar `review_state='approved'` — **Fase 4 MVP no separa "quién aprueba" de "quién escribe"** a nivel de base de datos; esa separación de roles, si se necesita, es una decisión explícita futura, no un descuido).

### `content_blocks`
Contenido estructurado por versión (`block_type` + `block_data jsonb`, ej. `intro`, `comparison_table`, `pros_cons`, `faq` — el renderer del frontend interpreta `block_type`). RLS: mismo patrón de "solo la versión live de un item published" vía join a `content_versions`→`content_items`.

### `content_product_links`
Qué productos menciona/compara cada `content_item` (`role`: `primary` / `alternative` / `mentioned`). Único por `(content_item_id, product_id)`. RLS: lectura pública si el `content_item` padre está `published` **y** el `product_id` vinculado también está `published`; escritura `editor`/`admin` del site, y **solo si `products.site_id = content_items.site_id`** (vincular productos cross-site está bloqueado explícitamente, no es un caso de uso soportado). **Corregido tras F-02/F-03 de `docs/audits/P4_AUDIT.md` (High)**: la versión original no validaba ni el `status` del producto vinculado en lectura ni el `site_id` en escritura — permitía filtrar a `anon` la existencia de productos `draft` de cualquier site y vincular contenido con productos de sites ajenos.

### `content_sources`
Fuentes citadas por versión (`PROJECT_BLUEPRINT.md` §6.3). RLS: mismo patrón "solo versión live de item published".

## Dominio: operations

### `freshness_checks`
Cola de qué entidad necesita revisión y cuándo — herramienta interna, **nunca pública**.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| entity_type | text | `product_price` / `product_feature` / `content_item` |
| entity_id | uuid | sin FK real (referencia polimórfica a distintas tablas) |
| last_checked_at / next_check_due_at | timestamptz | |
| status | text | `fresh` / `due` / `stale` |
| note | text, nullable | |

RLS: solo `super_admin` (lectura y escritura). Sin cron/Edge Function que la puebla o consuma automáticamente todavía — eso es Fase 9 (AI Operations & Freshness); acá solo el dato.

## Dominio: affiliate (Fase 5)

`affiliate_terms`/`affiliate_offers` son **append-only**, mismo patrón que `product_prices`/`product_features` (Fase 4) — "comisiones... requieren series temporales" (`PROJECT_BLUEPRINT.md` §5) aplica literalmente. Gestionados por `editor`/`admin` de cualquier site dentro del niche del vendor (no hay lectura pública — es información comercial interna, no contenido editorial).

### `affiliate_programs`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK → vendors(id) | |
| name / network / program_url | text | único por `(vendor_id, name)` |
| status | text | `draft` / `active` / `paused` / `terminated` |

**Trigger `enforce_active_program_requires_terms`**: rechaza `status='active'` si no existe al menos un `affiliate_terms` para ese programa (`MONETIZATION_POLICY.md` §9: "ningún programa activo sin terms registrados").

### `affiliate_terms`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| program_id | uuid FK → affiliate_programs(id) | |
| link_format / allowed_traffic / paid_search_policy / coupon_deep_link_rules | text | |
| trademark_bidding_allowed | boolean | |
| source | text | **requerido** |
| checked_at | timestamptz | **requerido**, default `now()` |

Append-only: `INSERT`+`SELECT` para editor/admin del niche del vendor, sin `UPDATE` para nadie, `DELETE` solo `super_admin`.

### `affiliate_offers`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| program_id | uuid FK → affiliate_programs(id) | |
| product_id | uuid FK → products(id), nullable | **debe pertenecer al mismo niche que el vendor del programa** — cross-check explícito en `WITH CHECK` (lección de F-03, `docs/audits/P4_AUDIT.md`) |
| commission_type | text | `percent` / `flat` / `tiered` |
| commission_value | numeric(10,4) | `>= 0` |
| cookie_duration_days | int | |
| source | text | **requerido** |
| checked_at | timestamptz | **requerido** |
| confidence | text | default `unverified` |

Append-only, mismo patrón que `affiliate_terms`.

### `affiliate_links`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| program_id | uuid FK → affiliate_programs(id) | |
| product_id / content_item_id | uuid FK, nullable | **si ambos están presentes, deben pertenecer al mismo site** — cross-check explícito |
| url | text | |
| link_type | text | `direct` / `deep_link` / `coupon` |
| status | text | `draft` / `published` / `archived` |

CRUD normal (no histórico) — editor/admin del niche del vendor.

### `affiliate_clicks`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| click_id | text unique | clave de idempotencia |
| affiliate_link_id | uuid FK → affiliate_links(id) | |
| session_id / referrer / user_agent / ip_hash | text, nullable | |
| clicked_at | timestamptz | default `now()` |

RLS: sin policy de `INSERT` directo — se fuerza el paso por `record_affiliate_click()` (ver funciones abajo). Lectura: solo `super_admin` (decisión de scope de Fase 5, ver `docs/phases/P5.md` — dato financiero sin caso de uso de dashboard todavía).

## Dominio: monetization (Fase 5)

### `ad_slots` / `monetization_rules`
Config interna por site (`editor`/`admin` gestionan, sin lectura pública — no existe renderer de ads todavía). `monetization_rules.page_type` incluye `auth`/`admin`/`low_value` además de los tipos de `PROJECT_BLUEPRINT.md` §7.1, precisamente para que el `CHECK constraint monetization_rules_no_ads_on_prohibited_pages` pueda impedir `'ads' = any(allowed_layers)` en esos tres — estructuralmente imposible de insertar, no solo una regla documentada (`MONETIZATION_POLICY.md` §4/§9).

### `roe_scores`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| content_item_id | uuid FK → content_items(id) | |
| ad_ev / affiliate_ev / lead_ev / sponsor_ev | numeric(12,4) | |
| total_expected_revenue | numeric, **generated always as** `ad_ev+affiliate_ev+lead_ev+sponsor_ev` | columna calculada, nunca se inserta directamente |
| quality_score / monetization_score | numeric(6,2), nullable | **columnas separadas, nunca combinadas** — representación literal del firewall editorial (`MONETIZATION_POLICY.md` §2) |
| rule_version | text | **requerido** |
| computed_at | timestamptz | |

Append-only, **`super_admin` únicamente para lectura y escritura — nunca `editor`, nunca público**, bajo ninguna circunstancia (ni siquiera un `anon` filtrado a 0 filas: no hay `GRANT` de tabla en absoluto para `anon`/`authenticated` sin rol). Exponer `monetization_score`, aunque fuera de solo lectura, crearía la apariencia de que el ranking público podría estar influenciado por él.

### `sponsored_campaigns` / `sponsorship_placements`
Gestión **admin/super_admin únicamente** (no `editor` — decisión comercial/de ventas, distinta del resto del catalog/content). `sponsorship_placements` tiene dos `CHECK` constraints estructurales: `disclosure_label` nunca puede quedar vacío (default `'Sponsored'`), y el placement debe apuntar a **exactamente uno** de `ad_slot_id`/`content_item_id` (nunca ambos, nunca ninguno) — simplifica el aislamiento de scope a un solo site por validar.

## Dominio: leads (Fase 5)

### `lead_forms`
Lectura pública si `status='published'` (el visitante necesita ver el form para llenarlo). Escritura: `editor`/`admin` del site.

### `lead_submissions`
Contiene **PII real**. `INSERT` público (cualquiera puede enviar un lead a un form published) — sin `Prefer: return=representation` del lado del cliente, porque `anon` no tiene `SELECT` (ver nota en `supabase/tests/monetization_access.test.mjs`). Lectura: **solo `super_admin`** (decisión de scope, igual que `affiliate_clicks`/`roe_scores`).

### `lead_routes`
Config de enrutamiento a vendors — sin PII de leads individuales. Escritura: `editor`/`admin` del site del form, con cross-check de que `vendor_id` pertenezca al mismo niche que el site del form.

### `lead_revenue`
Append-only, mismo patrón que `product_prices`/`affiliate_offers`. `super_admin` únicamente.

## Dominio: analytics (parcial — Fase 5 solo `revenue_events`)

### `revenue_events`
Ledger append-only de reconciliación. `event_id` es la clave de idempotencia (`MONETIZATION_POLICY.md` §9: "revenue reconcilia con import de prueba"). `super_admin` únicamente. El resto del dominio `analytics` (`sessions`, `events`, `page_metrics_daily`, `attribution_touchpoints`, `conversions`) es Fase 7.

## Funciones de autorización adicionales (Fase 5)

- `has_role_in_niche(role_name text, p_niche_id uuid) → boolean`: equivalente a `is_admin_for_niche` pero para cualquier rol, no solo `admin`. **Corrige un bug real encontrado durante el testing de Fase 5** (antes de la auditoría): las policies que resolvían el niche de un vendor/lead_form uniendo `sites` directamente fallaban para `editor`, porque `editor` no tiene ninguna policy de lectura sobre un site en estado `draft` (solo `admin`/`super_admin` vía `sites_admin_select`, o público si el site está `active`). `SECURITY DEFINER`, mismo patrón que `is_admin_for_niche`.
- `site_niche_id(p_site_id uuid) → uuid`: resuelve el `niche_id` de un site sin depender de que el rol que llama tenga lectura RLS sobre esa fila — usado en los cross-checks de scope de `affiliate_offers`/`lead_routes`/`sponsorship_placements`. `SECURITY DEFINER`.

## Funciones adicionales de Fase 5

### `record_affiliate_click(p_click_id, p_affiliate_link_id, ...)`
Punto de entrada público (`anon`) para registrar un clic, idempotente por `click_id` (`ON CONFLICT DO NOTHING`, devuelve el `id` existente si ya se había registrado). No requiere rol — cualquier visitante puede registrar un clic real; la idempotencia evita duplicados por reintentos de red o doble-clic, no es un control de autorización.

### `import_revenue_events(rows jsonb)`
Reconciliación de comisiones/reversals (backlog 507). A diferencia de `import_product_prices` (Fase 4), el chequeo de autorización (`has_role('super_admin')`) corre **una sola vez, antes de tocar cualquier fila** — no hay nada que resolver por fila antes de saber si el llamador puede llamar la función en absoluto, así que por diseño no puede repetir el hallazgo F-04 (oráculo de existencia vía mensajes de rechazo distinguibles). Idempotente por `event_id`; límite de 500 filas por lote.

## Funciones adicionales de Fase 4

### `import_product_prices(rows jsonb)`
Bulk import con validación fila-por-fila (backlog 405) — recibe un array JSON de filas candidatas a `product_prices` (máximo 500 por llamada, corregido tras F-07), valida cada una (`product_id` existe y el llamador tiene autorización sobre su site, `amount >= 0`, `currency` de 3 letras, `price_type` válido, `source` no vacío, `confidence` válido, default `unverified` tras F-08) y devuelve una tabla `(row_index, status, reason, price_id)` por fila: `accepted` con el `id` insertado, o `rejected` con el motivo — sin abortar el lote completo si una fila falla.

`SECURITY DEFINER`, pero la autorización **no se delega al bypass de RLS**: la función valida explícitamente `has_role('editor', site_id) or is_admin_for_site(site_id)` para el site del producto de cada fila, usando `auth.uid()` del llamador — exactamente la misma regla que aplicaría RLS normal. **Corregido tras F-04 de `docs/audits/P4_AUDIT.md` (Medium)**: la versión original resolvía la existencia del `product_id` *antes* del chequeo de autorización y devolvía motivos de rechazo distinguibles ("no existe" vs "sin autorización"), permitiendo que cualquier `authenticated` sin ningún rol usara la función como oráculo de existencia de productos ajenos — ambos casos ahora devuelven el mismo motivo genérico. Sin endpoint HTTP propio todavía (se llama vía RPC de PostgREST); exponerlo en una ruta de Next.js requiere la misma auth de admin que la UI de CMS, diferida (ver `docs/phases/P4.md`).

## Seed (`supabase/seed.sql`)

Idempotente (`insert ... on conflict do nothing`): los 6 roles, los 3 niches (`active`), 1 site por niche (`draft` — se activan en su respectiva Fase 6A/6B/6C según el orden de lanzamiento por oleadas). No siembra `vendors`/`products` — eso es contenido real de Fase 4/6.

## Deuda conocida / decisiones a revisar

- `user_roles` solo lo escribe `super_admin` en Fase 2. Delegar asignación de roles a `admin` de property es una decisión futura explícita, no un descuido — evaluar al construir el panel de administración (Fase 7+).
- `profiles_self_read` da a `super_admin` lectura de todos los perfiles; no hay una policy intermedia para que un `admin` de site vea perfiles de usuarios de su property — se agrega cuando exista un caso de uso real (evita over-engineering).
- Los `GRANT` a `service_role` (`supabase/migrations/20260808010405_grant_service_role_access.sql`, `20260808020030_grant_service_role_p4.sql`) son explícitos por tabla, no vía `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES TO service_role`. Fase 4 lo hizo desde el día uno (misma migración que crea las tablas) para no repetir el hallazgo F-07 — pero sigue siendo manual; evaluar un `ALTER DEFAULT PRIVILEGES` a nivel de proyecto antes de que una fase futura lo olvide.
- **Content workflow sin separación de roles para aprobar (Fase 4)**: cualquier `editor`/`admin` de un site puede escribir una `content_version` Y marcarla `review_state='approved'` — no hay a nivel de base de datos una regla de "el aprobador no puede ser el autor". El trigger `enforce_publish_requires_approved_version` garantiza que *alguna* aprobación exista antes de publicar, pero no garantiza separación de funciones. Es una decisión explícita de Fase 4 (documentada en `docs/phases/P4.md`), no un descuido — se revisa si Fase 6A+ (contenido editorial real con más de un editor por site) lo necesita.
- **UI de administración/CMS no existe todavía**: `apps/web` no tiene ningún cliente de Supabase instalado (`@supabase/supabase-js`/`@supabase/ssr`), ni login, ni sesión de servidor. Backlog 204 (Admin/User route guards) sigue sin poder implementarse por esta razón concreta — ver backlog 410 (nuevo, Fase 4) para el wiring de auth que es su prerrequisito real.
- **Patrón para futuras tablas append-only**: si una fase futura agrega otra tabla "histórico, nunca se sobrescribe" (siguiendo el patrón de `product_prices`/`product_features`), el `GRANT` a `service_role` debe excluir `UPDATE` explícitamente desde el día uno (`grant select, insert, delete on ... to service_role`, no `grant all`) — Fase 4 usó `grant all` inicialmente y tuvo que revocar `UPDATE` después de que la auditoría lo señalara (F-05, `docs/audits/P4_AUDIT.md`).
- **Invariantes "esta FK debe apuntar a una fila con este otro campo igual"**: cuando una tabla tiene una referencia condicional como `content_items.current_version_id` (debe apuntar a una versión del MISMO item, no solo a cualquier fila válida), un trigger solo no es suficiente — se necesita una FK compuesta contra una `UNIQUE` compuesta en la tabla referenciada (patrón usado para corregir F-01). Vale la pena revisar este patrón proactivamente en Fase 5+ para cualquier referencia condicional similar (ej. `affiliate_offers` apuntando a `affiliate_programs` del mismo vendor).
- **Nunca hacer JOIN directo a `sites` (ni a ninguna tabla con RLS restrictivo) dentro de la policy de OTRA tabla, para resolver un dato derivado (ej. niche de un site)** — la subconsulta corre con los privilegios del rol que llama, no con bypass. Encontrado durante el testing de Fase 5 (antes de la auditoría, no un hallazgo de auditor): las policies de `affiliate_programs`/`affiliate_terms`/`affiliate_offers`/`affiliate_links`/`lead_routes` unían `sites` directamente para resolver el niche de un vendor/lead_form, y fallaban silenciosamente para `editor` porque `editor` no tiene ninguna policy de lectura sobre un site `draft` (solo `admin`/`super_admin` vía `sites_admin_select`). Fix: helpers `SECURITY DEFINER` (`has_role_in_niche`, `site_niche_id`) que resuelven el dato sin pasar por la RLS del rol que llama — mismo patrón que `is_admin_for_niche` ya usaba desde Fase 2. **Regla general para Fase 6+**: si una policy necesita un dato derivado de otra tabla con RLS, resolverlo vía función `SECURITY DEFINER`, nunca vía `JOIN`/subquery directo dentro de la policy.
