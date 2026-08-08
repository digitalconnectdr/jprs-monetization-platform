# P2_AUDIT.md — Auditoría de seguridad, Fase 2 (Data Core, Auth & RBAC)

Auditor: agente independiente (sesión separada del Builder), actuando combinadamente como A2 (Architecture), **A3 (Security & RLS, obligatorio por ADR-011)** y A4 (QA & Regression). Fecha: 2026-08-08. Alcance: las 3 migraciones (`properties_domain`, `identity_domain`, `catalog_minimal`), `seed.sql`, `rls_access.test.mjs`, `DATA_DICTIONARY.md`, contra el PR #4 (`feat/p2-data-core-auth-rbac`).

**Veredicto inicial del auditor**: FIX REQUIRED.

## Hallazgos y resolución

| ID | Severidad | Resumen | Estado |
|---|---|---|---|
| F-01 | High | `has_role()` matcheaba `site_id IS NULL` para **cualquier** rol, no solo `super_admin` — una fila `(role='admin', site_id=null)` habría otorgado admin global silenciosamente. Sin ningún guardrail (CHECK/trigger/test) que lo impidiera. | **RESUELTO** — `has_role()` corregido para requerir `role='super_admin'` explícitamente cuando `site_id IS NULL`; agregado trigger `enforce_role_scope` como defensa en profundidad (rechaza el INSERT/UPDATE incluso vía `service_role`) |
| F-02 | Medium | Policy `sites_admin_write` (`for all`) permitía que un `admin` scoped a un solo site hiciera `DELETE` de ese site, arrastrando por `CASCADE` los `user_roles`/`site_settings` de otros usuarios de esa property | **RESUELTO** — separada en 4 policies por operación; `INSERT`/`DELETE` restringidos a `super_admin`, `SELECT`/`UPDATE` siguen disponibles para el admin scoped |
| F-03 | Medium | `rls_access.test.mjs` sin `try/finally` — una excepción a mitad de script dejaba usuarios/filas de prueba huérfanos en el único proyecto Supabase real (sin preview DB, ADR-012) | **RESUELTO** — cuerpo del test envuelto en `try/finally`, cleanup corre siempre |
| F-04 | Medium | Faltaban casos negativos clave: auto-escalamiento (usuario normal→admin, admin→super_admin), aislamiento real de `user_roles` (el check original corría antes de que existiera la fila a aislar), cross-site en `products`, visibilidad de `draft` para `anon` | **RESUELTO** — agregados los 5 casos negativos faltantes, reordenado el check de aislamiento para que corra después de que la fila del admin exista |
| F-05 | Low | `handle_new_user()` insertaba `raw_user_meta_data->>'display_name'` (controlado por el usuario) sin acotar longitud | **RESUELTO** — truncado a 120 caracteres con `left()`; se deja nota de que cualquier UI futura debe además escapar al renderizar |
| F-06 | Low | `sites_public_read_active` no verificaba que el niche padre también estuviera `active` | **RESUELTO** — agregado `EXISTS` sobre `niches.status = 'active'`, igual que ya hacía `categories_public_read` |

## Verificaciones que pasaron sin hallazgos

- RLS habilitado + `GRANT` explícito correcto en las 10 tablas nuevas (ninguna fail-open); confirmado por el auditor tabla por tabla, no solo por el reporte del Builder.
- Orden de dependencia entre migraciones correcto (`properties` → `identity` → `catalog`), sin referencias rotas.
- Funciones `security definer stable` con `search_path` fijo, sin riesgo de hijacking ni recursión de RLS.
- Sin secretos en el diff (verificado con grep del diff completo).
- Sin scope drift: nada de Fase 3 (UI) ni Fase 4 (catalog completo) se adelantó.
- Seed idempotente (`on conflict do nothing`) confirmado seguro de re-ejecutar.

## Veredicto final tras corrección: **GO**

Todos los hallazgos High/Medium/Low fueron corregidos directamente en las migraciones y el test script (nada se había aplicado aún al proyecto Supabase real, así que no hizo falta una migración de parche — se editaron los archivos originales). Los criterios de aceptación de Fase 2 ("Usuario normal no puede leer/escribir datos admin", "Admin scope funciona por property", "Todas las tablas sensibles tienen RLS explícito") quedan cubiertos con guardrails reales (trigger + función corregida) y con tests que efectivamente los ejercitan, no solo los documentan.

## Post-merge: primera corrida real contra el proyecto Supabase (F-07, F-08)

Tras mergear el PR #4 y aplicar las migraciones al proyecto real (`supabase db push`, sin preview DB por ADR-012), correr `rls_access.test.mjs` por primera vez contra datos reales reveló 2 problemas nuevos que ninguna revisión de código (ni la de este auditor, ni la del Builder) podía haber detectado sin ejecución real:

| ID | Severidad | Resumen | Estado |
|---|---|---|---|
| F-07 | High | `service_role` no tenía `GRANT` de tabla explícito en ninguna migración — se asumió que bypassa RLS y grants automáticamente (cierto en un proyecto Supabase estándar), pero con "Automatically expose new tables" desactivado (decisión de Fase 1) también se suprimen los grants implícitos de `service_role` para tablas nuevas. Causó fallos en cascada: el propio script de tests no podía asignar el rol admin al usuario de prueba. | **RESUELTO** — nueva migración `20260808010405_grant_service_role_access.sql`, `grant all` explícito a `service_role` en las 10 tablas de Fase 2 |
| F-08 | Low | El test de F-02 (admin no puede DELETE su site) asumía que un DELETE bloqueado por RLS devuelve 401/403/200-vacío, pero sin `Prefer: return=representation` PostgREST devuelve 204 tanto si RLS bloqueó (0 filas) como en otros casos — el status code solo no prueba nada | **RESUELTO** — el test ahora verifica directamente contra `service_role` que el site sigue existiendo después del intento de DELETE, en vez de inferir del status code |

**Verificación empírica final**: `node supabase/tests/rls_access.test.mjs` corrido contra el proyecto real (`jprs-monetization-platform`) tras aplicar el fix — **18/18 tests pasan**, incluyendo los 5 casos negativos de auto-escalamiento/aislamiento agregados en la ronda anterior. Cleanup verificado: 0 usuarios, 0 `user_roles`, 0 `categories` de prueba quedaron huérfanos tras la corrida.

Este hallazgo (F-07) refuerza por qué ADR-012 acepta el riesgo de "sin preview DB": una revisión de código, por rigurosa que sea, no sustituye ejecutar contra el sistema real al menos una vez antes de cerrar la fase.
