# Auditoría P6C — Consumer Tech & Smart Home

Fecha: 2026-08-09. Alcance revisado: commits `c2d284c` y `88d980a` de `codex/p6c-consumer-tech`.

## Veredicto inicial

**NO-GO** antes de corregir los hallazgos High. La auditoría fue independiente y de solo lectura; no constituye un cierre de fase.

## Hallazgos

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| F-01 | High | La constraint inicial permitía `price_type='sale'` sin `expires_at`; RLS la habría mostrado indefinidamente. | Corregido localmente; pendiente de re-auditoría y prueba contra Supabase post-merge. |
| F-02 | High | El seed específico dependía de `networking` en `seed.sql`; al ejecutarse solo podía activar Consumer Tech sin productos. | Corregido localmente con taxonomía idempotente, transacción y comprobación de tres productos antes de activar el site. |
| F-03 | Medium | La ruta de ofertas mostraba importe con `$` fijo y omitía fuente/fecha de comprobación. | Corregido localmente; ahora formatea la moneda registrada y muestra fuente + fecha. |
| F-04 | Medium | Las filas del seed usaban el `checked_at` por defecto de ejecución en vez de la fecha archivada de investigación. | Corregido localmente con la fecha disponible, normalizada a mediodía UTC por no conservarse la hora exacta. |
| F-05 | Medium | La prueba real de RLS no se ha ejecutado. | Pendiente: ADR-012 exige PR, merge y aplicación en el único proyecto Supabase antes de correrla. |
| F-06 | High | `import_product_prices` aceptaba el tipo `sale` pero descartaba `expires_at`; tras F-01 no podía importar una oferta válida. | Corregido localmente: valida y persiste `expires_at`; pendiente de re-auditoría y prueba RPC post-merge. |
| F-07 | Medium | La página de ofertas podía fallar si `source` no era una URL HTTP válida. | Corregido localmente con una representación segura no enlazable para fuentes malformadas. |

## Verificaciones observadas

- `npm run typecheck` y `npm run lint` pasaron.
- `node --check supabase/tests/deal_expiration.test.mjs` pasó.
- `git diff --check` pasó.
- `npm run test` finaliza correctamente, pero aún no hay suites de test registradas en los workspaces.

## Requisitos para el veredicto final

## Re-auditoría

Re-auditoría independiente del 2026-08-09: **GO para commit y PR**.

- F-01 a F-04, F-06 y F-07 fueron corregidos y verificados.
- La comprobación remota de solo lectura confirmó `existing_sale_rows=0`; el nuevo `CHECK` de expiración no bloqueará la migración por datos heredados.
- Pasaron `typecheck`, `lint`, validación de sintaxis del test, `git diff --check` y `npm test` (no hay suites registradas todavía).

Condiciones para cerrar P6C, posteriores al merge y no bloqueantes para el PR: aplicar la migración, ejecutar la prueba RLS remota, aplicar el seed, completar QA visual con datos reales y obtener la decisión humana sobre el contenido editorial en revisión.

1. Re-auditar las correcciones F-01 a F-04, F-06 y F-07.
2. Crear PR con checks verdes.
3. Tras merge, aplicar la migración y seed revisados al único proyecto Supabase y ejecutar `node supabase/tests/deal_expiration.test.mjs`.
4. Hacer QA visual con el catálogo realmente sembrado y mantener la comparativa editorial en `pending_editorial_review`.
