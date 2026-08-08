# PHASE_REPORT — Fase 4: CMS & Product Intelligence

Builder: Claude Code (esta sesión). Fecha: 2026-08-08. **Estado: CLOSED.**

Scope y criterios de aceptación: `docs/phases/P4.md`.

## Qué se implementó

- **Catalog completo** (`supabase/migrations/20260808020000_catalog_full.sql`): `product_variants`, `product_features`, `product_prices`, `product_media` — completa el shell mínimo de `vendors`/`products` de Fase 2. `product_features`/`product_prices` son **append-only por diseño**: ningún rol tiene policy de `UPDATE` (garantía RLS, no convención).
- **Content domain** (`20260808020010_content_domain.sql`): `content_items`, `content_versions`, `content_blocks`, `content_product_links`, `content_sources`. Trigger `enforce_publish_requires_approved_version` implementa ADR-005 (no auto-publicación sin revisión humana) a nivel de base de datos.
- **Freshness + bulk import** (`20260808020020_freshness_and_import.sql`): `freshness_checks` (admin-only), función `import_product_prices(jsonb)` con validación fila-por-fila y autorización explícita dentro de la función (`SECURITY DEFINER` sin delegar a bypass de RLS).
- **GRANT a `service_role`** (`20260808020030_grant_service_role_p4.sql`) desde el día uno, para no repetir el hallazgo F-07 de Fase 2.
- `supabase/tests/catalog_content_access.test.mjs`: 24 tests de acceso positivo/negativo contra el proyecto real.
- `docs/DATA_DICTIONARY.md` actualizado con los 3 dominios nuevos.

## Auditoría de cierre y corrección — parte central de esta fase

Toca schema/RLS, así que la auditoría de agente independiente era **obligatoria por ADR-011**, sin excepción. Resultado inicial: **NO-GO**.

| ID | Severidad | Resumen |
|---|---|---|
| F-01 | **Critical** | El trigger de publish-gate nunca validaba que la `content_version` referenciada perteneciera al mismo `content_item` — permitía publicar contenido nunca revisado apuntando a la versión aprobada de cualquier otro item. Anulaba el enforcement técnico declarado de ADR-005, el entregable central de la fase. |
| F-02 | High | `content_product_links` exponía a `anon` la existencia de productos `draft` de cualquier site (lectura pública sin filtrar por `products.status`). |
| F-03 | High | `content_product_links` permitía vincular productos de cualquier site al contenido de otro (sin validar `site_id` coincidente). |
| F-04 | Medium | `import_product_prices` servía de oráculo de existencia de `product_id` para cualquier usuario autenticado sin rol, por mensajes de rechazo distinguibles. |
| F-05–F-08 | Low | `service_role` con `UPDATE` disponible pese a la garantía append-only; interacción confusa `ON DELETE`/trigger; sin límite de tamaño de lote en import; default de `confidence` demasiado optimista. |

**Nota operativa crítica**: como las migraciones de Fase 4 ya estaban aplicadas al único proyecto Supabase real (ADR-012, sin ambiente de staging separado), estos hallazgos quedaban **explotables en producción en el momento de encontrarse**, no solo "bloqueantes para el PR". Se aplicó una migración correctiva (`20260808030000_fix_p4_audit_findings.sql`) inmediatamente, sin esperar el ciclo normal de PR — consistente con cómo ADR-012 delega ese tipo de decisión al propietario funcional/Builder cuando no hay ambiente de preview.

Corrección: trigger reescrito + defensa en profundidad a nivel de schema (FK compuesta contra `UNIQUE(id, content_item_id)`, no solo el trigger) para F-01; joins adicionales de `site_id`/`status` en las policies de `content_product_links` para F-02/F-03; mensaje de rechazo unificado en `import_product_prices` para F-04; `service_role` pierde `UPDATE` en tablas append-only, FK cambiada a `NO ACTION` (mensaje de error claro), límite de 500 filas, default `unverified` para F-05–F-08. `catalog_content_access.test.mjs` se extendió con 4 casos negativos que reproducen exactamente los escenarios de la auditoría — **29/29 tests pasan** tras el fix. Veredicto final del auditor: **GO**. Detalle completo en `docs/audits/P4_AUDIT.md`.

## Verificación empírica final

`node supabase/tests/catalog_content_access.test.mjs` corrido contra el proyecto Supabase real después de aplicar la migración correctiva: **29/29 tests pasan**, incluyendo los 4 casos que reproducen los hallazgos Critical/High de la auditoría. Cleanup verificado sin filas huérfanas (`products`, `content_items`, `content_product_links`, `product_prices` con prefijo de prueba, todos en 0 tras la corrida). `npm run typecheck` (todos los workspaces) limpio — esta fase no tocó `apps/web`.

Cubre los criterios de aceptación de `docs/phases/P4.md`:
- [x] CRUD de catalog funciona con autorización correcta — probado explícitamente (editor propio site OK, admin de otro site bloqueado, usuario normal bloqueado).
- [x] Todo precio/feature tiene `source`+`checked_at`+`confidence` — constraint `not null` a nivel de columna.
- [x] Ningún precio/feature histórico puede sobrescribirse — probado explícitamente (`UPDATE` rechazado, monto original verificado sin cambios).
- [x] Content workflow: un item no puede quedar `published` sin una versión propia `approved` — probado explícitamente, incluyendo el caso de hijack (F-01) que la auditoría encontró y que ahora está cubierto por un test negativo permanente.
- [x] Bulk import rechaza filas inválidas sin abortar el lote — probado explícitamente, incluyendo el caso de oráculo (F-04).
- [x] Todas las tablas nuevas tienen RLS explícito — verificado con tests reales, no solo lectura de código.

## Decisiones tomadas durante la fase

No se generó un ADR nuevo — el diseño append-only y el trigger de publish-gate implementan reglas ya mandatadas explícitamente por `PROJECT_BLUEPRINT.md` §5 y ADR-005, no arquitectura nueva fuera de esos documentos.

## Riesgos y deuda conocida (heredada a Fase 5+)

- **Backlog 409 (nuevo)**: `apps/web` sigue sin ningún cliente de Supabase instalado, login, ni sesión de servidor — prerrequisito real de backlog 204 (route guards), que se re-difiere sin atarlo a un número de fase fijo (se resuelve en cuanto 409 se aborde).
- **Backlog 407/408** (heredados de Fase 3, `docs/audits/P3_AUDIT.md`): migración de `middleware.ts` a `proxy.ts`, y `not-found.tsx` localizado — siguen TODO, Fase 4 no tocó `apps/web` así que no había oportunidad natural de resolverlos.
- **Sin separación de roles para aprobar contenido**: cualquier `editor`/`admin` de un site puede escribir Y aprobar (`review_state='approved'`) su propia `content_version` — decisión explícita de Fase 4 MVP (documentada en `docs/phases/P4.md` y `docs/DATA_DICTIONARY.md`), no un descuido. Se revisa si Fase 6A+ lo necesita.
- **`import_product_prices` sin endpoint HTTP propio** — se llama vía RPC de PostgREST directamente; exponerlo en una ruta de Next.js espera al mismo wiring de auth que backlog 409/204.
- **Patrón para futuras tablas append-only**: documentado en `docs/DATA_DICTIONARY.md` — el `GRANT` a `service_role` debe excluir `UPDATE` desde el día uno, no descubrirse post-auditoría como pasó aquí (F-05).
