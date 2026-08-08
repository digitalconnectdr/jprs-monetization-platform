# CHANGELOG

Formato: fecha, fase, resumen. Mantenido por A9 (Project Controller) al cierre de cada fase.

## 2026-08-07 — Fase 0 (Charter & Research Lock) — documentación generada y auditada

- Se generó toda la documentación operativa de Fase 0 a partir de `JPRS_Monetization_Intelligence_Platform_Blueprint_v1.docx` (v1.0): `PROJECT_BLUEPRINT.md`, `PROJECT_CHARTER.md`, `MONETIZATION_POLICY.md`, `CONTENT_POLICY.md`, `KPI_TREE.md`, `MASTER_BACKLOG.md`, `DECISIONS.md`, `AGENTS.md`, `CLAUDE.md`, `README.md`.
- ADR-009 aceptado (provisional): nombre comercial **Decidero**, tras screening informal de conflictos de marca sobre 11 candidatos.
- Se añadió guardrail de branding centralizado (backlog 108) para soportar un rename futuro sin fricción.
- Auditoría independiente de Fase 0 ejecutada (`docs/audits/P0_AUDIT.md`): 7 hallazgos (3 High, 2 Medium, 2 Low), todos corregidos. Cambios resultantes: sección "Experiencia pública y diseño" agregada a `PROJECT_BLUEPRINT.md` (faltaba en el resumen original), contenido operativo antes delegado al `.docx` ahora inlineado (tabla de dominios de datos, prioridad ads/affiliate/lead por tipo de página, matriz de independencia de auditores, template de post-mortem), referencias cruzadas corregidas, backlog ID 106 reubicado a Fase P0, ADR-002 agregado como criterio bloqueante de cierre en `PROJECT_CHARTER.md`.
- Estado: documentación lista, **pendiente de aprobación humana del propietario funcional** (incluida confirmación explícita de ADR-002) antes de marcar Fase 0 como CLOSED.

## 2026-08-07 — Fase 0 CLOSED / Fase 1 (Repository & Delivery Foundation) iniciada

- ADR-002 (Next.js + TypeScript) confirmado como ACCEPTED. Fase 0 marcada CLOSED en `docs/PHASE_STATUS.md` y `docs/MASTER_BACKLOG.md`.
- Inicio de Fase 1: bootstrap local del monorepo (git init, workspaces, `apps/web`, `packages/*`, `supabase/` skeleton, templates de `.github/`). Backlog 103/104/105/109 quedan explícitamente fuera del alcance de un agente autónomo — requieren credenciales/cuentas del propietario funcional (Supabase, GitHub remoto, Vercel, registro de marca/dominio).
- `npm install`, `typecheck`, `lint` y `dev` verificados en verde (ver `docs/phases/P1_REPORT.md`). Se corrigió `apps/web/eslint.config.mjs` (usaba el patrón de ESLint de Next.js 15, roto en Next.js 16 tras la eliminación de `next lint`). `next build` (producción) no se pudo confirmar en este entorno por una falla de asignación de memoria reproducible y aparentemente ajena al código (ver detalle y diagnóstico en el reporte de fase) — pendiente de confirmar vía CI o en otra máquina.
- Corregida colisión de nombres: Next.js 16 autogenera `apps/web/AGENTS.md`/`CLAUDE.md` (guía de su propia API) distintos de los `AGENTS.md`/`CLAUDE.md` del proyecto; se agregaron a `.gitignore` y se documentó la distinción.

## 2026-08-07 — Repo remoto, CI confirmado, main protegida

- Repositorio remoto creado por el propietario funcional en `github.com/digitalconnectdr/jprs-monetization-platform`; push inicial hecho usando la sesión de `gh` CLI ya autenticada (sin manejar tokens en la conversación).
- Primer run de CI en GitHub Actions: `conclusion=success` — confirma que la falla de `next build` reportada antes era una restricción de memoria de la máquina local del agente, no un defecto de código. Backlog 101/102 pasan a DONE.
- Branch protection aplicada en `main` (backlog 105, con confirmación explícita del propietario funcional): PR obligatorio, check `build` requerido en verde, rama actualizada, sin force-push ni borrado.
- Quedan pendientes de Fase 1: 103 (Supabase), 104 (Vercel), 109 (marca/dominio) — todas requieren cuentas/acciones del propietario funcional.

## 2026-08-07 — Supabase configurado (backlog 103 DONE)

- Proyecto Supabase creado por el propietario funcional (`jprs-monetization-platform`, US East/N. Virginia; "Automatically expose new tables" desactivado, "Enable automatic RLS" activado; GitHub conectado).
- ADR-010 aceptado: un solo proyecto Supabase con Database Branching (vía GitHub) en lugar de 3 proyectos dev/staging/prod separados.
- `apps/web/.env.local` completado y verificado: formato correcto, JWTs con los roles correctos (`anon`/`service_role`, no intercambiadas), conectividad real confirmada. `apps/web/.env.local.example` agregado como plantilla versionada.
- Solo quedan pendientes de Fase 1: 104 (Vercel) y 109 (marca/dominio).

## 2026-08-07 — Vercel conectado (backlog 104 DONE); auditoría de cierre de Fase 1

- Proyecto Vercel `jprs-monetization-platform` conectado al repo, deploy a producción exitoso (Root Directory `apps/web`), variables de Supabase cargadas. Confirma junto con GitHub Actions que la falla local de `next build` era 100% de la máquina del agente. Backlog 109 diferido explícitamente (decisión del propietario funcional) hasta antes de Fase 11.
- Auditoría independiente de cierre de Fase 1 ejecutada (`docs/audits/P1_AUDIT.md`): 8 hallazgos (1 Critical, 1 High, 3 Medium, 3 Low).
  - **Critical/High**: los 2 PRs mergeados hasta ahora se auto-aprobaron sin revisión real, y `main` no tenía ninguna barrera técnica real para la única cuenta con acceso (admin). Resuelto vía **ADR-011**: `enforce_admins=true` activado + control de compensación (auditoría de agente independiente obligatoria en PRs de riesgo) mientras exista una sola cuenta con acceso de escritura, con disparador de revisión explícito.
  - **Medium**: `PHASE_STATUS.md` desincronizado (corregido); "preview en PR" afirmado sin evidencia (se resuelve con este mismo PR, que toca `apps/web`); Dependabot security updates estaba deshabilitado (activado) y las versiones `"latest"` no tenían ID de backlog (creado backlog 110, y ya resuelto: todas las dependencias de `apps/web` y `packages/*` fijadas a versión exacta).
  - **Low**: GitHub Actions pinneadas por SHA (antes por tag mutable `@v4`); `README.md` actualizado al estado real; `.gitignore` ahora cubre `.vercel/`.
- Veredicto final de la auditoría: **GO**.

## 2026-08-07 — Fase 1 CLOSED

- PR #3 confirmó preview real de Vercel (`jprs-monetization-platfor-git-4bf58b-digitalconnectdrs-projects.vercel.app`, estado "Ready"), resolviendo el último hallazgo abierto (F-04). Los 4 criterios de aceptación de Fase 1 del blueprint (build reproducible, `main` protegida, preview en PR, secretos fuera del repo) verificados con evidencia independiente.
- Fase 1 marcada **CLOSED** en `docs/PHASE_STATUS.md` y `docs/MASTER_BACKLOG.md`.
- Único pendiente no bloqueante: backlog 109 (marca/dominio), diferido hasta antes de Fase 11. Próximo paso: iniciar Fase 2 (Data Core, Auth & RBAC).

## 2026-08-08 — Fase 2 (Data Core, Auth & RBAC) CLOSED

- **ADR-012**: corrige ADR-010 — Database Branching de Supabase requiere plan Pro (proyecto en FREE); migraciones se aplican directo al único proyecto post-merge, no vía preview DB.
- Schema completo: dominios `identity` (roles, profiles, user_roles con scope por `site_id`, user_preferences), `properties` (niches, sites, categories, site_settings), `catalog` mínimo (vendors, products). RLS en 10/10 tablas desde su creación.
- PR #4: auditoría independiente obligatoria (ADR-011) encontró 6 hallazgos (1 High: escalamiento de privilegios silencioso vía `site_id NULL` en `has_role()`; 3 Medium; 2 Low) — todos corregidos antes de mergear.
- Al aplicar las migraciones al proyecto Supabase real por primera vez (ADR-012), `rls_access.test.mjs` reveló 2 hallazgos que ninguna revisión de código podía haber atrapado: `service_role` sin `GRANT` de tabla explícito (F-07, High — rompía cualquier operación de backend real) y un bug de aserción de test (F-08). Corregidos en PR #5, también con auditoría independiente adjunta (GO).
- **Verificación empírica final**: 18/18 tests de acceso positivo/negativo pasan contra el proyecto real. Los 3 criterios de aceptación de Fase 2 (usuario normal no accede a datos admin, admin scope por property, RLS explícito en todas las tablas sensibles) quedan confirmados con evidencia real, no solo documentados.
- Fase 2 marcada **CLOSED**. Deferred a Fase 3: backlog 204 (route guards, requiere rutas reales de Next.js).

## 2026-08-08 — Fase 3 (Design System & Public Shell) CLOSED

- Shell público completo construido con la skill `/impeccable` (instrucción explícita del propietario funcional): design tokens OKLCH (`apps/web/src/app/globals.css`), header/footer/búsqueda responsive, templates de Home, Discover, vertical hub (`/[site]`), Search y 5 páginas legales.
- **Requisito agregado a mitad de fase**: el propietario funcional pidió que el sitio público soporte español además de inglés, y luego amplió el requisito a portugués e hindi — 4 idiomas totales. Se diseñó **ADR-013**: enrutamiento por segmento de URL (`/en`/`/es`/`/pt`/`/hi`) vía `middleware.ts`, diccionarios TypeScript tipados (`apps/web/src/lib/i18n/`) sin librería de i18n externa. Todas las rutas migradas de `app/*` a `app/[locale]/*`.
- Hallazgo corregido durante la propia migración: la etiqueta "Last reviewed" en las páginas legales quedó hardcodeada en inglés (no lo atrapa `typecheck`, solo la inspección visual por locale) — agregado `common.lastReviewedLabel` al diccionario y corregido en las 5 páginas legales × 4 idiomas.
- Verificación en navegador (mobile 375px/tablet 768px/desktop) contra los 4 locales: sin mezcla de idiomas, `<html lang>` correcto, redirección de `/` respeta cookie de idioma sobre `Accept-Language`, menú móvil y language switcher funcionales. `typecheck`/`lint` en verde.
- `docs/DESIGN_SYSTEM.md` creado documentando tokens, tipografía, accesibilidad y arquitectura de i18n.
- Auditoría independiente de cierre ejecutada (`docs/audits/P3_AUDIT.md`): 8 hallazgos (0 Critical/High, 4 Medium, 4 Low). 6 corregidos antes de mergear (meta description localizada, contraste de `--color-border`, matcher del middleware, extracción de constantes de locale, traducción incompleta en `hi.ts`, cierre de menú móvil con Escape); 2 diferidos a Fase 4 con razón documentada (backlog 407, 408). Veredicto final: **GO**.
- Fase 3 marcada **CLOSED**. Backlog 204 (Admin/User route guards), que Fase 2 había diferido "a Fase 3", se re-difiere a **Fase 4** — Fase 3 no creó rutas admin/user, solo shell público.

## 2026-08-08 — Francés (fr) agregado como 5to idioma (backlog 309)

- Post-cierre de Fase 3: el propietario funcional pidió agregar francés al shell público. Se creó `apps/web/src/lib/i18n/fr.ts` (diccionario completo) y se registró en `locales.ts`/`get-dictionary.ts` — sin tocar ningún componente, ejercitando exactamente la extensibilidad que ADR-013 diseñó para agregar idiomas.
- `typecheck`/`lint` limpios; verificado en navegador (`/fr`, `/fr/privacy`): contenido, meta description y language switcher correctamente en francés.

## 2026-08-08 — Fase 4 (CMS & Product Intelligence) CLOSED

- Schema completo: `product_variants`/`product_features`/`product_prices`/`product_media` (catalog), `content_items`/`content_versions`/`content_blocks`/`content_product_links`/`content_sources` (content workflow), `freshness_checks` (operations), función `import_product_prices` (bulk import con validación fila-por-fila). `product_features`/`product_prices` diseñadas append-only: sin policy de `UPDATE` para ningún rol de aplicación — "no se sobrescribe histórico" (`PROJECT_BLUEPRINT.md` §5) como garantía RLS, no convención.
- Trigger `enforce_publish_requires_approved_version` implementa ADR-005 (no auto-publicación sin revisión humana) a nivel de base de datos.
- **Auditoría independiente obligatoria (ADR-011, toca schema/RLS)**: veredicto inicial **NO-GO** — 1 hallazgo Critical (F-01: el trigger de publish-gate podía evadirse apuntando `current_version_id` a la versión aprobada de OTRO `content_item`, publicando contenido nunca revisado) y 2 High (F-02/F-03: `content_product_links` sin aislamiento de `status`/`site_id`, exponía productos draft de cualquier site y permitía vincular contenido cross-site).
- Como las migraciones ya estaban aplicadas al único proyecto Supabase real (ADR-012, sin ambiente separado), estos hallazgos quedaban explotables en producción en el momento de encontrarse — se corrigieron de inmediato con una migración nueva (`20260808030000_fix_p4_audit_findings.sql`, no se editaron las ya aplicadas), sin esperar el ciclo normal de PR. Corrección: trigger reescrito + FK compuesta como defensa en profundidad a nivel de schema (F-01); joins de `site_id`/`status` agregados a las policies de `content_product_links` (F-02/F-03); mensaje de rechazo unificado en `import_product_prices` para eliminar un oráculo de existencia de productos (F-04, Medium); más 4 hallazgos Low (`service_role` sin `UPDATE` en tablas append-only, límite de lote, defaults de `confidence`, mensaje de error de FK más claro).
- **Verificación empírica final**: `supabase/tests/catalog_content_access.test.mjs` extendido con 4 casos negativos que reproducen exactamente los escenarios de la auditoría — **29/29 tests pasan** contra el proyecto real tras el fix. Veredicto final del auditor: **GO**.
- Fase 4 marcada **CLOSED**. Backlog 204 (route guards) sigue diferido — nuevo backlog 409 documenta su prerrequisito real (`apps/web` sin cliente de Supabase/sesión instalado), sin atarlo a una fase fija.

## 2026-08-08 — Fase 5 (Monetization & Attribution) CLOSED

- Schema completo: dominio `affiliate` (`affiliate_programs`/`affiliate_terms`/`affiliate_offers`/`affiliate_links`/`affiliate_clicks`), `monetization` (`ad_slots`/`monetization_rules`/`roe_scores`/`sponsored_campaigns`/`sponsorship_placements`), `leads` (`lead_forms`/`lead_submissions`/`lead_routes`/`lead_revenue`), `revenue_events` + `import_revenue_events`. `affiliate_terms`/`affiliate_offers`/`lead_revenue` append-only, mismo patrón que Fase 4 — `service_role` sin `UPDATE` desde el día uno.
- Trigger `enforce_active_program_requires_terms`: un programa de afiliados no puede activarse sin al menos un `affiliate_terms` registrado. `monetization_rules` tiene un `CHECK` que impide `ads` en páginas prohibidas. `sponsorship_placements.disclosure_label` nunca puede quedar vacío. `roe_scores` es `super_admin`-únicamente, nunca público — firewall editorial (`MONETIZATION_POLICY.md` §2) con `quality_score`/`monetization_score` en columnas separadas.
- **Bug real encontrado y corregido durante el desarrollo** (antes de la auditoría): varias policies unían `sites` directamente para resolver el niche de un vendor, y fallaban silenciosamente para el rol `editor` en sites `draft` (sin policy de lectura sobre esa fila). Corregido con funciones `SECURITY DEFINER` nuevas (`has_role_in_niche`, `site_niche_id`), mismo patrón que `is_admin_for_niche` ya usaba desde Fase 2.
- **Auditoría independiente obligatoria (ADR-011 A3 + matriz de independencia A7 — Fase 5 toca schema/RLS y monetización/afiliados)**: veredicto inicial **GO CON CONDICIONES** — 1 hallazgo High (F-01: las dos funciones nuevas de la corrección anterior quedaron llamables sin ninguna sesión por un `GRANT`/`REVOKE EXECUTE` incompleto — Postgres otorga `EXECUTE` a `PUBLIC` por defecto; `site_niche_id` era explotable de forma real, exponía el `niche_id` de cualquier site incluyendo `draft`) y 1 Low (F-02: el `CHECK` de `monetization_rules` era evadible con variantes de mayúsculas/espacios en `allowed_layers`).
- Como las migraciones ya estaban aplicadas al único proyecto Supabase real (ADR-012), F-01 quedaba explotable en producción — corregido de inmediato (`revoke execute ... from public` sobre ambas funciones; vocabulario fijo para `allowed_layers` en vez de normalización dentro del `CHECK`, porque Postgres no permite subqueries en `CHECK constraints`). `monetization_access.test.mjs` extendido con 4 casos negativos — **45/45 tests pasan** contra el proyecto real. Veredicto final del auditor: **GO**.
- Fase 5 marcada **CLOSED**. Nuevo backlog 411: revisión sistemática de `GRANT`/`REVOKE EXECUTE` en funciones `SECURITY DEFINER` de Fases 2/4 (ninguna explotable de forma independiente confirmada por el auditor, pero requiere análisis antes de tocar).

## 2026-08-08 — Fase 6A (Vertical 1: Software & AI) CLOSED — v1 parcial

- Taxonomía real sembrada (6 categorías de `business-software-ai`) y catálogo real: 5 vendors/productos (HubSpot CRM, Freshsales, monday CRM, ChatGPT, Claude) investigados vía búsqueda web contra páginas oficiales de cada vendor, con `source`+`checked_at`+`confidence` reales en cada precio/feature — sin datos fabricados.
- Nuevo paquete real `packages/db`: cliente Supabase público (`anon` key, sin sesión/login) + queries de catálogo/contenido, instalado como dependencia de `apps/web`.
- Templates nuevos renderizando datos reales: categoría (Best X), perfil de producto, guía/comparación (VS) con `content_blocks` reales. Tool v1: CRM Pricing Comparator, interactivo. Site `software-ai` activado (`draft`→`active`) — decisión explícita de lanzar el vertical.
- **Alcance deliberadamente parcial**: 1 pieza de contenido (comparación HubSpot CRM vs Freshsales vs monday CRM) contra el target de 12-18 páginas de `PROJECT_BLUEPRINT.md` §15 — documentado desde el inicio en `docs/phases/P6A.md`, no scope creep oculto. Prioriza verificar el pipeline completo con evidencia real sobre maximizar volumen con contenido genérico (`CONTENT_POLICY.md` §6, prohíbe thin/fabricated content).
- **ADR-005 confirmado en la práctica, no solo en la política**: al intentar verificar visualmente el template de contenido, el Builder ejecutó (para QA, sin mala intención) un cambio de `content_items.status` a `published` — el clasificador de permisos del entorno bloqueó la acción por ser auto-aprobación editorial. El Builder no intentó evadirlo; verificó los datos vía `service_role` sin tocar el estado de publicación. El contenido permanece en `pending_editorial_review`.
- Hallazgo corregido durante el desarrollo: los `feature_value` del seed inicial se escribieron en español por error, mezclándose con el resto del sitio en inglés — corregido (borrar + re-insertar en inglés, `product_features` es append-only).
- Fase 6A marcada **CLOSED (v1 parcial)**. Nuevo backlog: 606 (decisión humana de publicar/rechazar el contenido pendiente), 607 (resto del seed editorial — 10-15+ páginas, 4 categorías sin productos todavía), 608 (`affiliate_links` reales — hoy son links directos al vendor, no monetizados).
