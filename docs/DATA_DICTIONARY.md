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

> Regla de datos no negociable (`PROJECT_BLUEPRINT.md` §5): "no se sobrescribe histórico — precios, comisiones y métricas requieren series temporales". Se implementa como **garantía técnica, no solo convención**: ninguna de las dos tablas tiene policy de `UPDATE` para ningún rol (ni `admin`/`super_admin`). Cada cambio de precio o feature es una fila nueva con `checked_at` más reciente; el valor "actual" es la fila con mayor `checked_at` para la misma clave. `DELETE` está reservado a `super_admin` (corrección de un dato erróneo en casos extremos, no edición de rutina).

### `product_features`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK → products(id) | |
| variant_id | uuid FK → product_variants(id), nullable | |
| feature_key / feature_value | text | |
| source | text | **requerido** |
| checked_at | timestamptz | **requerido**, default `now()` |
| confidence | text | `verified` / `estimated` / `unverified` |

RLS: lectura pública si el producto padre está `published`. `INSERT`: `editor`/`admin` del site del producto. Sin `UPDATE` para nadie. `DELETE`: solo `super_admin`.

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
| confidence | text | `verified` / `estimated` / `unverified` |

RLS: igual patrón que `product_features` (lectura pública si producto published, `INSERT` editor/admin del site, sin `UPDATE`, `DELETE` solo `super_admin`).

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

**Trigger `enforce_publish_requires_approved_version`**: rechaza cualquier `insert`/`update` que ponga `status='published'` a menos que `current_version_id` no sea nulo y esa versión tenga `review_state='approved'`. Esto implementa ADR-005 (no auto-publicación sin revisión humana) como garantía de base de datos, no solo de UI — importante porque todavía no existe ninguna UI de admin que lo hiciera cumplir (ver `docs/phases/P4.md`).

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
Qué productos menciona/compara cada `content_item` (`role`: `primary` / `alternative` / `mentioned`). Único por `(content_item_id, product_id)`. RLS: lectura pública si el `content_item` padre está `published`; escritura `editor`/`admin` del site.

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

## Funciones adicionales de Fase 4

### `import_product_prices(rows jsonb)`
Bulk import con validación fila-por-fila (backlog 405) — recibe un array JSON de filas candidatas a `product_prices`, valida cada una (`product_id` existe, `amount >= 0`, `currency` de 3 letras, `price_type` válido, `source` no vacío, `confidence` válido) y devuelve una tabla `(row_index, status, reason, price_id)` por fila: `accepted` con el `id` insertado, o `rejected` con el motivo — sin abortar el lote completo si una fila falla.

`SECURITY DEFINER`, pero la autorización **no se delega al bypass de RLS**: la función valida explícitamente `has_role('editor', site_id) or is_admin_for_site(site_id)` para el site del producto de cada fila, usando `auth.uid()` del llamador — exactamente la misma regla que aplicaría RLS normal. Sin endpoint HTTP propio todavía (se llama vía RPC de PostgREST); exponerlo en una ruta de Next.js requiere la misma auth de admin que la UI de CMS, diferida (ver `docs/phases/P4.md`).

## Seed (`supabase/seed.sql`)

Idempotente (`insert ... on conflict do nothing`): los 6 roles, los 3 niches (`active`), 1 site por niche (`draft` — se activan en su respectiva Fase 6A/6B/6C según el orden de lanzamiento por oleadas). No siembra `vendors`/`products` — eso es contenido real de Fase 4/6.

## Deuda conocida / decisiones a revisar

- `user_roles` solo lo escribe `super_admin` en Fase 2. Delegar asignación de roles a `admin` de property es una decisión futura explícita, no un descuido — evaluar al construir el panel de administración (Fase 7+).
- `profiles_self_read` da a `super_admin` lectura de todos los perfiles; no hay una policy intermedia para que un `admin` de site vea perfiles de usuarios de su property — se agrega cuando exista un caso de uso real (evita over-engineering).
- Los `GRANT` a `service_role` (`supabase/migrations/20260808010405_grant_service_role_access.sql`, `20260808020030_grant_service_role_p4.sql`) son explícitos por tabla, no vía `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES TO service_role`. Fase 4 lo hizo desde el día uno (misma migración que crea las tablas) para no repetir el hallazgo F-07 — pero sigue siendo manual; evaluar un `ALTER DEFAULT PRIVILEGES` a nivel de proyecto antes de que una fase futura lo olvide.
- **Content workflow sin separación de roles para aprobar (Fase 4)**: cualquier `editor`/`admin` de un site puede escribir una `content_version` Y marcarla `review_state='approved'` — no hay a nivel de base de datos una regla de "el aprobador no puede ser el autor". El trigger `enforce_publish_requires_approved_version` garantiza que *alguna* aprobación exista antes de publicar, pero no garantiza separación de funciones. Es una decisión explícita de Fase 4 (documentada en `docs/phases/P4.md`), no un descuido — se revisa si Fase 6A+ (contenido editorial real con más de un editor por site) lo necesita.
- **UI de administración/CMS no existe todavía**: `apps/web` no tiene ningún cliente de Supabase instalado (`@supabase/supabase-js`/`@supabase/ssr`), ni login, ni sesión de servidor. Backlog 204 (Admin/User route guards) sigue sin poder implementarse por esta razón concreta — ver backlog 410 (nuevo, Fase 4) para el wiring de auth que es su prerrequisito real.
