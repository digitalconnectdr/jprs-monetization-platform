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

## Dominio: catalog (shell mínimo — Fase 4 trae el resto)

> `product_variants`, `product_features`, `product_prices`, `product_media`, y los campos `source`/`checked_at`/`confidence` de la regla de datos del blueprint **no existen todavía** — se agregan en Fase 4 (CMS & Product Intelligence). Lo de acá es solo lo necesario para que RLS/RBAC tengan algo real que proteger en Fase 2.

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

## Seed (`supabase/seed.sql`)

Idempotente (`insert ... on conflict do nothing`): los 6 roles, los 3 niches (`active`), 1 site por niche (`draft` — se activan en su respectiva Fase 6A/6B/6C según el orden de lanzamiento por oleadas). No siembra `vendors`/`products` — eso es contenido real de Fase 4/6.

## Deuda conocida / decisiones a revisar

- `user_roles` solo lo escribe `super_admin` en Fase 2. Delegar asignación de roles a `admin` de property es una decisión futura explícita, no un descuido — evaluar al construir el panel de administración (Fase 7+).
- `profiles_self_read` da a `super_admin` lectura de todos los perfiles; no hay una policy intermedia para que un `admin` de site vea perfiles de usuarios de su property — se agrega cuando exista un caso de uso real (evita over-engineering).
