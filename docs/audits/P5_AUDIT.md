# P5_AUDIT.md — Auditoría de seguridad, Fase 5 (Monetization & Attribution)

Auditor: agente independiente (sesión separada del Builder), actuando combinadamente como **A3 (Security & RLS, obligatorio por ADR-011 — esta fase toca schema/RLS)** y **A7 (Monetization & Policy, obligatorio por la matriz de independencia de `PROJECT_BLUEPRINT.md` §10.1 — "Monetización/affiliate → A7 obligatorio")**. Fecha: 2026-08-08. Alcance: las 6 migraciones nuevas (`20260808040000_affiliate_domain.sql` a `20260808040050_fix_niche_scope_rls.sql`), `supabase/tests/monetization_access.test.mjs`, `docs/DATA_DICTIONARY.md`, `docs/phases/P5.md`, contra el PR #10 (`feat/p5-monetization-attribution`, commit `1e2c6af`).

**Metodología**: lectura línea por línea de las 6 migraciones contra el resto del schema (no solo el reporte del Builder), con foco explícito en los 6 criterios de `MONETIZATION_POLICY.md` §9; re-ejecución independiente de `monetization_access.test.mjs` contra el proyecto Supabase de producción (`rwalmmprrgypbxhkzgdg`, sin preview DB — ADR-012); diseño y ejecución de un segundo script propio de esta auditoría (`supabase/tests/p5_auditor_extra.test.mjs`, 20 checks) contra el mismo proyecto real, con foco en: condición de carrera real (llamadas concurrentes, no solo secuenciales) en `record_affiliate_click`, duplicado de `event_id` dentro del mismo array en `import_revenue_events`, evasión del `CHECK` de `monetization_rules` por mayúsculas/espacios y por `UPDATE` parcial, casos límite de `disclosure_label` (whitespace-only, `NULL` explícito), caminos de `sponsorship_placements` vía `ad_slot_id` que el test del Builder no cubre, y escalamiento cross-scope vía `UPDATE` (no solo `INSERT`) en `affiliate_links`/`lead_routes`/`affiliate_programs`. Cleanup verificado con un script adicional (0 filas huérfanas, 0 usuarios de prueba huérfanos). `gh pr checks 10` y diff de scope verificados directamente contra GitHub/git.

**Veredicto del auditor: GO CON CONDICIONES.** No se encontró ningún hallazgo Critical. Se encontró un hallazgo **High** confirmado empíricamente — una función `SECURITY DEFINER` nueva (`site_niche_id`) queda accesible sin ninguna autenticación por un error de higiene de `GRANT`/`REVOKE` (no por un fallo de lógica de negocio) — y un hallazgo Low de robustez de un `CHECK` constraint. El firewall editorial de `roe_scores`, la idempotencia de clics/revenue events (incluyendo bajo concurrencia real, que el test del Builder no ejercita), la protección de PII de `lead_submissions`, y todos los cross-checks de scope nuevos (incluyendo por `UPDATE`, no solo `INSERT`) se verificaron correctos empíricamente. **Nota operativa**: igual que en Fase 4, estas migraciones ya están aplicadas al único proyecto Supabase real (ADR-012) — el hallazgo High debería mitigarse con una migración correctiva de inmediato, independientemente del ciclo de merge del PR.

## Hallazgos

| ID | Severidad | Resumen | Confirmado empíricamente |
|---|---|---|---|
| F-01 | **High** | `site_niche_id(uuid)` (creada en `20260808040050_fix_niche_scope_rls.sql` para corregir el bug de scope pre-auditoría) es `SECURITY DEFINER`, no tiene NINGÚN chequeo de autorización interno, y la migración solo hace `grant execute ... to authenticated, service_role` — nunca hace `revoke execute ... from public`. PostgreSQL otorga `EXECUTE` a `PUBLIC` por defecto al crear una función, así que ese `GRANT` explícito es cosmético: cualquier visitante **sin ninguna sesión** (solo con la anon key pública) puede llamar `rpc/site_niche_id` con cualquier UUID de `site` y obtener su `niche_id` real, incluyendo sites en `draft` que ninguna policy de `sites` expone a `anon`. `has_role_in_niche(text, uuid)` (misma migración) tiene el mismo gap de `GRANT`, aunque no es explotable de forma independiente (ver detalle). | **Sí**, contra el proyecto real |
| F-02 | Low | El `CHECK constraint monetization_rules_no_ads_on_prohibited_pages` (`20260808040010_monetization_domain.sql:31-33`) compara con igualdad de string exacta (`'ads' = any(allowed_layers)`), sin normalizar mayúsculas ni espacios. Un valor como `'Ads'`, `'ADS'` o `' ads'` en `allowed_layers` no es detectado como el layer prohibido y pasa el `CHECK` en `page_type` `auth`/`admin`/`low_value`, contradiciendo la afirmación explícita de la migración y `docs/phases/P5.md` de que esto es "estructuralmente imposible... no solo una regla documentada". El `CHECK` sí es robusto contra `UPDATE` parcial que deje `page_type=auth` con `'ads'` ya presente (verificado, se rechaza correctamente) — el gap es solo de normalización de string, no de lógica de trigger/timing. | Sí, contra el proyecto real |

## Detalle de hallazgos

### F-01 (High) — `site_niche_id` es un oráculo de `niche_id` accesible sin autenticación, por `GRANT`/`REVOKE` incompleto

**Contexto**: `site_niche_id` y `has_role_in_niche` se crearon específicamente para corregir el bug real que el propio equipo encontró antes de esta auditoría (policies que unían `sites` directamente y fallaban para `editor` en sites `draft` — ver `docs/DATA_DICTIONARY.md` y comentarios de `20260808040050_fix_niche_scope_rls.sql`). Verifiqué esa corrección de forma exhaustiva (ver sección "Verificaciones sin hallazgos" abajo) y **la lógica de scope está bien corregida** — el problema no es el objetivo de la migración, sino un efecto secundario de cómo se otorgaron los permisos de ejecución de las funciones nuevas.

**Descripción técnica**: `site_niche_id` (`20260808040050_fix_niche_scope_rls.sql:37-45`):
```sql
create function public.site_niche_id(p_site_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select niche_id from public.sites where id = p_site_id;
$$;
grant execute on function public.site_niche_id(uuid) to authenticated, service_role;
```
No hay ningún `revoke execute on function public.site_niche_id(uuid) from public;` en ninguna migración del proyecto (confirmado por `grep -rn revoke supabase/migrations/` — la única ocurrencia en todo el repo es un `revoke update` de Fase 4, nada relacionado con `execute` de funciones). En PostgreSQL, `CREATE FUNCTION` otorga `EXECUTE` a `PUBLIC` automáticamente salvo que se revoque explícitamente. El `GRANT EXECUTE ... TO authenticated, service_role` que sí aparece en la migración es, por tanto, un candado decorativo: `PUBLIC` (que incluye al rol `anon`, usado por cualquier visitante sin sesión con solo la clave anónima pública) ya tenía el privilegio desde el `CREATE FUNCTION`.

**Evidencia empírica** (`supabase/tests/p5_auditor_extra.test.mjs`, corrido contra el proyecto real):
1. Se identificó el site `travel` (estado no público en este momento del proyecto) y su `niche_id` real vía `service_role` (solo para verificar, no como parte del ataque).
2. Como usuario `editor` de `software-ai` **sin ningún rol en `travel`**: `sites?id=eq.<travel>` vía su propio token devuelve `[]` (control — confirma que no puede leer la fila de `sites` directamente, el comportamiento RLS esperado).
3. El mismo usuario llama `rpc/site_niche_id` con `p_site_id=<travel>` → `200`, devuelve el `niche_id` real de `travel`.
4. Repetido **sin ninguna sesión de usuario**, usando únicamente la anon key pública (`apikey`/`Authorization: Bearer` = anon key, sin login previo — el mismo patrón que cualquier visitante anónimo del sitio): `rpc/site_niche_id` con `p_site_id=<travel>` → `200`, devuelve el mismo `niche_id` real.
5. `rpc/has_role_in_niche` también responde `200` a la misma llamada anónima (mismo gap de `GRANT`/`REVOKE`), pero devuelve `false` de forma inofensiva: internamente compara contra `auth.uid()`, que es `NULL` para `anon` sin sesión — no revela roles de otros usuarios, solo confirma (o niega) algo sobre el propio llamador. No es explotable de forma independiente, pero comparte la causa raíz y debe corregirse por la misma razón (higiene, defensa en profundidad, y para no dejar un patrón inconsistente en el schema).
6. Con un UUID inventado (`00000000-0000-0000-0000-000000000000`), `site_niche_id` devuelve `null` (200) — confirma que también funciona como oráculo secundario de existencia de `site_id`, con el mismo matiz de impacto acotado que F-04 de `docs/audits/P4_AUDIT.md` (UUID v4 no son adivinables por fuerza bruta).

**Impacto**: cualquier visitante, sin necesidad de cuenta ni de ningún rol, puede aprender el `niche_id` de cualquier `site_id` que conozca o adivine — incluyendo sites en `draft` que el resto del schema protege deliberadamente (ni siquiera `editor` puede leerlos vía `sites` directamente). El dato expuesto (`niche_id`, un UUID interno) no es PII ni dinero, pero es exactamente el tipo de dato que la corrección de scope de esta misma fase (`has_role_in_niche`/`site_niche_id`) se creó para *dejar de filtrar accidentalmente* — la función que arregla el problema original introduce una fuga más pequeña pero real del mismo tipo de dato, y lo hace de forma **estrictamente peor** que el bug original (el bug original requería que `editor` intentara una operación legítima y fallara; esto es explotable por cualquiera, sin cuenta, con una sola llamada HTTP intencional).

**Recomendación** (migración correctiva nueva, no editar `20260808040050_fix_niche_scope_rls.sql` — ya aplicada a producción por ADR-012):
```sql
revoke execute on function public.site_niche_id(uuid) from public;
revoke execute on function public.has_role_in_niche(text, uuid) from public;
```
Esto no rompe ningún camino legítimo: ninguna policy que usa estas dos funciones en Fase 5 es alcanzable por `anon` (todas son policies de escritura/lectura restringidas a `editor`/`admin`/`super_admin`, es decir siempre corren con un `auth.uid()` real de un usuario `authenticated`), así que revocar `PUBLIC` sin tocar el `GRANT` ya existente a `authenticated`/`service_role` preserva el comportamiento correcto y cierra el acceso anónimo. Recomiendo además una revisión de seguimiento (fuera del alcance de esta fase) de todas las funciones `SECURITY DEFINER` de fases anteriores (`has_role`, `is_admin_for_site`, `is_admin_for_niche`, `import_product_prices`, etc.) para confirmar si alguna de ellas comparte este mismo gap de `GRANT`/`REVOKE` de forma explotable — las que devuelven booleanos atados a `auth.uid()` no tienen impacto (como `has_role_in_niche`), pero vale la pena una pasada sistemática.

### F-02 (Low) — `monetization_rules` CHECK no normaliza mayúsculas/espacios en `allowed_layers`

**Descripción**: `20260808040010_monetization_domain.sql:31-33`:
```sql
constraint monetization_rules_no_ads_on_prohibited_pages check (
  not (page_type in ('auth', 'admin', 'low_value') and 'ads' = any(allowed_layers))
)
```
`= any(...)` es comparación de igualdad de string exacta, sensible a mayúsculas y espacios.

**Evidencia empírica**: como `editor` de `software-ai`, `INSERT` en `monetization_rules` con `{ page_type: "admin", allowed_layers: ["Ads"] }` → `201` (aceptado). Mismo resultado con `{ page_type: "low_value", allowed_layers: [" ads"] }` (espacio inicial) → `201`. Por el contrario, un `UPDATE` que deja `page_type='auth'` con `'ads'` (minúscula exacta) ya presente en `allowed_layers` sí es rechazado correctamente — el `CHECK` se re-evalúa en cada `UPDATE`, no hay bypass de timing.

**Impacto**: acotado — quien inserta esto ya tiene rol `editor`/`admin` legítimo sobre ese `site` (no es un bypass de autorización, es un bypass de un `CHECK` de integridad de datos), y no existe todavía ningún renderer de ads que consuma `allowed_layers` (`docs/phases/P5.md`: "no existe renderer de ads que la consuma del lado del cliente aún"). Pero invalida la afirmación explícita del criterio de aceptación de la fase ("verificable programáticamente, no solo por convención") — si en el futuro un import o una UI escribe el valor con una casing distinta (ej. copiado de una constante `'Ads'` en `apps/web`), el `CHECK` no lo detecta.

**Recomendación**:
```sql
alter table public.monetization_rules drop constraint monetization_rules_no_ads_on_prohibited_pages;
alter table public.monetization_rules add constraint monetization_rules_no_ads_on_prohibited_pages check (
  not (
    page_type in ('auth', 'admin', 'low_value')
    and exists (select 1 from unnest(allowed_layers) as layer where lower(trim(layer)) = 'ads')
  )
);
```
Considerar además restringir `allowed_layers` a un `text[]` validado contra una lista fija (`ads`, `affiliate`, `lead`, `sponsor`) vía un `CHECK` adicional (`allowed_layers <@ array['ads','affiliate','lead','sponsor']`), para que valores basura/mal escritos se rechacen en general, no solo el caso `ads`.

## Verificaciones que pasaron sin hallazgos

- **Idempotencia de `record_affiliate_click` bajo concurrencia real**: 8 llamadas **concurrentes** (`Promise.all`, no secuenciales como el test del Builder) con el mismo `click_id` → las 8 devuelven `200` con el **mismo** `id`, y solo existe **una** fila real en `affiliate_clicks`. El `on conflict (click_id) do nothing` + relectura funciona correctamente bajo carrera real, no solo en el caso feliz secuencial.
- **`import_revenue_events` con `event_id` repetido DOS VECES dentro del MISMO array** (no en llamadas separadas, que es lo único que prueba el test del Builder): fila 1 → `accepted`, fila 2 → `duplicate`, y solo queda **una** fila real en `revenue_events`. El loop procesa las filas secuencialmente dentro de la misma transacción de la función, así que el `INSERT ... ON CONFLICT DO NOTHING` de la fila 2 sí ve el `INSERT` (no confirmado, pero visible dentro de la misma transacción) de la fila 1.
- **Firewall editorial (`roe_scores`)**: sin `GRANT` de tabla a `anon` en ninguna migración (`grep` de "grant.*to anon" en todo `supabase/migrations/` confirma que `roe_scores` nunca aparece); sin vistas ni funciones en todo el proyecto que seleccionen columnas de `roe_scores` (`grep` de `roe_scores`/`monetization_score` no encuentra ningún `create view`/`create function` que las exponga). Confirmado empíricamente: `anon` sin sesión → 401/403 o 0 filas; `editor` (authenticated, no `super_admin`) → **tiene** `GRANT` de tabla `SELECT` (la migración usa `grant select, insert on roe_scores to authenticated` sin acotar), pero RLS lo reduce correctamente a **0 filas** — confirma que la afirmación de `docs/phases/P5.md`/`DATA_DICTIONARY.md` ("nunca público bajo ninguna circunstancia") se sostiene en la práctica aunque el texto de `DATA_DICTIONARY.md` sea impreciso sobre la existencia del `GRANT` (dice "no hay GRANT de tabla en absoluto para... authenticated sin rol", pero sí existe un `GRANT` amplio — RLS es quien realmente protege, correctamente).
- **Cross-scope en cada relación nueva, incluyendo por `UPDATE` (no solo `INSERT`, que es lo único que prueba el test del Builder)**:
  - `affiliate_offers.product_id` vs niche del vendor del programa: `INSERT` cross-niche rechazado (test del Builder).
  - `affiliate_links.product_id`/`content_item_id` vs site: `INSERT` cross-site rechazado (Builder) **y** `UPDATE` de un link ya válido moviendo `content_item_id` a un item de otro site también rechazado (test propio de esta auditoría — camino no cubierto por el Builder).
  - `lead_routes.vendor_id` vs niche del `lead_form`: `INSERT` cross-niche rechazado (Builder) **y** `UPDATE` de vendor_id hacia otro niche también rechazado (test propio).
  - `affiliate_programs.vendor_id`: un `editor` no puede secuestrar su propio programa hacia un vendor de otro niche vía `UPDATE` (test propio, camino no cubierto por el Builder).
  - `sponsorship_placements` vs `sponsored_campaigns.vendor_id`: el test del Builder solo prueba el camino `content_item_id`; el camino `ad_slot_id` (completamente sin probar por el Builder) también se verificó — cross-niche rechazado, mismo-niche aceptado.
- **`monetization_rules` — el `CHECK` sí es inviolable frente a `UPDATE` parcial**: crear una regla válida (`page_type=deal`, `allowed_layers=['ads']`) y luego `PATCH page_type='auth'` sin tocar `allowed_layers` se rechaza correctamente — Postgres re-evalúa el `CHECK` contra la fila completa resultante en cada `UPDATE`, no hay ventana de bypass por actualización parcial. El único gap real es el de normalización de string (F-02).
- **`sponsorship_placements.disclosure_label`**: `"   "` (solo espacios) rechazado por `length(trim(disclosure_label)) > 0` — cubre whitespace, no solo string vacío. `disclosure_label: null` explícito también rechazado (viola `NOT NULL`, no cae silenciosamente al default `'Sponsored'`).
- **`lead_submissions` — protección de PII real**: `GRANT` de tabla coherente con RLS (`insert` a `anon, authenticated`; `select` solo a `authenticated`, nunca a `anon`) — RLS restringe además ese `select` a `super_admin` únicamente. Confirmado empíricamente: `anon` no puede leer, `editor` (authenticated) no puede leer, `super_admin` sí puede leer. Ningún `GRANT` contradice la RLS real.
- **Funciones `SECURITY DEFINER` nuevas — SQL injection**: `has_role_in_niche`, `site_niche_id`, `record_affiliate_click`, `import_revenue_events` son todas `language sql` o `language plpgsql` con parámetros tipados (`text`, `uuid`, `jsonb` con casts explícitos `::uuid`/`::numeric`/`::timestamptz`), sin `EXECUTE`/concatenación de SQL dinámico en ninguna. Sin riesgo de inyección.
- **`enforce_active_program_requires_terms`**: un programa no puede activarse (`status='active'`) sin al menos un `affiliate_terms` — confirmado tanto en el rechazo (sin terms) como en la aceptación (con terms) contra el proyecto real.
- **Corrección de scope de niche (`20260808040050_fix_niche_scope_rls.sql`) — verificada exhaustivamente, no solo asumida correcta**: revisé las 7 policies reescritas (`affiliate_programs`, `affiliate_terms` ×2, `affiliate_offers` ×2, `affiliate_links`, `lead_routes`, `sponsored_campaigns`, `sponsorship_placements`) línea por línea contra las funciones `has_role_in_niche`/`site_niche_id`/`is_admin_for_niche` — ninguna quedó con el `JOIN` directo a `sites` original. Confirmado que las 41 aserciones del test del Builder (que ejercitan estas policies con un `editor` real de un site en `draft`) pasan, y que mis 20 checks adicionales (incluyendo los caminos `UPDATE` y `ad_slot_id` que el Builder no cubre) también confirman el aislamiento correcto.
- **Regresión de scope del diff**: `git diff main...feat/p5-monetization-attribution --stat` → 9 archivos, 100% `supabase/migrations/*.sql` (6), `supabase/tests/*.mjs` (1), `docs/DATA_DICTIONARY.md`, `docs/phases/P5.md`. Cero archivos de `apps/web/`, `.github/` o configuración de Vercel.
- **CI**: `gh pr checks 10` → `Vercel` (pass), `Vercel Preview Comments` (pass), `build` (pass) — los 3 checks en verde.
- **`monetization_access.test.mjs` corrido de nuevo por este auditor** contra el proyecto real: **41/41 tests pasan**, igual que reporta el Builder — confirmado independientemente.
- **Cleanup verificado**: script adicional de esta auditoría confirma 0 filas huérfanas con prefijo `p5aud-`/`P5Aud` en `vendors`, `products`, `content_items`, `affiliate_programs`, `affiliate_links`, `ad_slots`, `lead_forms`, `sponsored_campaigns`, `monetization_rules`, `revenue_events`, y 0 usuarios de prueba huérfanos en `auth.users`.

## Veredicto final: **GO CON CONDICIONES**

No hay ningún hallazgo Critical. El hallazgo **High** (F-01) es real y confirmado empíricamente contra el proyecto de producción, pero de impacto acotado (expone un identificador interno — `niche_id` de un `site` — no PII ni datos financieros, y solo a quien ya conoce o adivina un `site_id`, que es un UUID v4). El hallazgo Low (F-02) no bloquea el merge por sí solo. Ninguno de los 6 criterios de `MONETIZATION_POLICY.md` §9 falla: los clics y revenue events no se duplican (verificado bajo concurrencia real y con duplicados dentro del mismo lote), `monetization_rules` bloquea `ads` en páginas prohibidas para el caso canónico (con el gap de normalización documentado en F-02), el revenue reconcilia con el import de prueba, `disclosure_label` nunca puede quedar vacío (cubre whitespace y `NULL` explícito), ningún programa de afiliados se activa sin `terms`, y `roe_scores` no tiene ningún camino de lectura pública confirmado.

**Condiciones para GO sin reservas**: aplicar la migración correctiva de F-01 (`revoke execute ... from public` sobre `site_niche_id`/`has_role_in_niche`) cuanto antes — dado ADR-012, esto ya está explotable en producción por cualquier visitante sin cuenta, así que no debería esperar el ciclo normal de PR, siguiendo el mismo criterio operativo que `docs/audits/P4_AUDIT.md` estableció para su propio hallazgo Critical. F-02 puede incluirse en la misma migración por eficiencia, dado que ya se está tocando esta zona del schema, pero no es bloqueante por sí solo.

Recomiendo además extender `monetization_access.test.mjs` (o promover mi script `supabase/tests/p5_auditor_extra.test.mjs`, dejado en el repo como evidencia de esta auditoría) con casos negativos que reproduzcan F-01 (llamada anónima a `rpc/site_niche_id`) y F-02 (`allowed_layers` con casing/espacios distintos), para que la regresión quede protegida.

## Evidencia

- `supabase/tests/p5_auditor_extra.test.mjs` (nuevo, de esta auditoría) — 18/20 checks pasan; los 2 que "fallan" son intencionalmente las reproducciones de F-01 y F-02 (el check está escrito para pasar solo si el sistema está *libre* del bug — falla a propósito para señalar el hallazgo, el mismo patrón que P4_AUDIT usó en `p4_auditor_extra.test.mjs`).

## Post-auditoría: correcciones aplicadas

Dado que las migraciones de Fase 5 ya estaban aplicadas al único proyecto Supabase real (ADR-012), el Builder aplicó una migración correctiva nueva (`20260808050000_fix_p5_audit_findings.sql`, no se editó la migración ya aplicada) inmediatamente después de recibir este reporte, siguiendo el mismo criterio operativo que Fase 4.

| ID | Severidad | Estado | Corrección aplicada |
|---|---|---|---|
| F-01 | High | **RESUELTO** | `revoke execute on function public.site_niche_id(uuid), public.has_role_in_niche(text, uuid) from public;` — el `GRANT` explícito a `authenticated`/`service_role` ya existente se mantiene intacto (sigue funcionando para las policies legítimas), solo se retira el privilegio implícito de `PUBLIC` que `CREATE FUNCTION` otorga por defecto. Verificado empíricamente: `rpc/site_niche_id` con la anon key sin sesión ahora devuelve `401 permission denied for function site_niche_id`. |
| F-02 | Low | **RESUELTO** (enfoque distinto al sugerido) | La normalización propuesta por el auditor (`EXISTS`+`unnest` dentro del `CHECK`) no es válida en Postgres — **"cannot use subquery in check constraint"**, confirmado al intentar aplicar la migración tal cual. Se optó por la alternativa que el propio auditor sugirió como complemento: restringir `allowed_layers` a un vocabulario fijo (`allowed_layers <@ array['ads','affiliate','lead','sponsor']`), que por sí sola resuelve el bypass — una vez que solo esos 4 valores exactos en minúscula pueden existir en la columna, `'ads' = any(allowed_layers)` vuelve a ser una comparación confiable, porque `'Ads'`/`'ADS'`/`' ads'` nunca llegan a insertarse. Verificado empíricamente: `INSERT` con `allowed_layers: ["Ads"]` en `page_type=admin` → `400`, viola `monetization_rules_allowed_layers_vocabulary`. |

**Verificación post-fix**: `supabase/tests/monetization_access.test.mjs` se extendió con 4 casos negativos nuevos que reproducen exactamente los escenarios F-01/F-02 de esta auditoría (llamada anónima a `rpc/site_niche_id` y `rpc/has_role_in_niche`, `allowed_layers` con variante de mayúsculas y con espacio) — **45/45 tests pasan** contra el proyecto real, incluyendo los 4 nuevos. Cleanup verificado: 0 filas huérfanas en las tablas relevantes tras la corrida.

**Deuda registrada, no resuelta en esta fase** (recomendación explícita del auditor, fuera del alcance de Fase 5): revisión sistemática de `GRANT`/`REVOKE` en todas las funciones `SECURITY DEFINER` de fases anteriores (`has_role`, `is_admin_for_site`, `is_admin_for_niche`, `import_product_prices`) para confirmar si comparten el mismo gap de higiene — el auditor confirmó que ninguna es explotable de forma independiente hoy (dependen de `auth.uid()`, `null` para `anon`, o ya tienen su propio chequeo interno de autorización), pero revocar `PUBLIC` de forma sistemática requiere verificar cuidadosamente que ninguna policy de lectura pública coexistente en la misma tabla dependa del privilegio implícito — riesgo real de romper accesos legítimos si se hace sin ese análisis. Se agrega como backlog explícito (ver `docs/MASTER_BACKLOG.md`), no se improvisa dentro de esta migración correctiva.

## Veredicto final tras corrección: **GO**

Los 2 hallazgos (F-01 High, F-02 Low) fueron corregidos y verificados empíricamente contra el proyecto real, con regresión cubierta en la suite canónica de tests. Ningún hallazgo Critical. La fase puede cerrarse.
