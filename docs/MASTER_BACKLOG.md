# MASTER_BACKLOG.md

Fuente: [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md), sección "Plan maestro por fases". Estado inicial de todos los ítems: **TODO**. Los IDs nunca se reutilizan. Este documento debe actualizarse por A9 (Project Controller) al cierre de cada fase — sin borrar historial.

**Nota sobre la columna "Prioridad"**: los valores `P0`/`P1` en esa columna indican prioridad de negocio dentro de la fase (P0 = bloqueante, P1 = importante pero no bloqueante), **no** el número de fase. No confundir con los encabezados `## Fase P0`, `## Fase P1`, etc., que agrupan por fase del roadmap.

Leyenda de estado: `TODO` · `IN PROGRESS` · `BLOCKED` · `DEFERRED` (no bloquea el cierre de la fase actual, pero tiene un gate posterior explícito donde debe resolverse) · `DONE`

## Fase P0 — Charter & Research Lock

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 001 | P0 | Crear PROJECT_CHARTER.md | Charter aprobado | DONE (auditado en `docs/audits/P0_AUDIT.md`, aprobado 2026-08-07) |
| 002 | P0 | Definir verticales/subcategorías | Taxonomía aprobada | DONE (auditado en `docs/audits/P0_AUDIT.md`, aprobado 2026-08-07) |
| 003 | P0 | Definir KPI tree y gates 10K/100K/1M | KPI doc aprobado | DONE (auditado en `docs/audits/P0_AUDIT.md`, aprobado 2026-08-07) |
| 004 | P0 | Crear MONETIZATION_POLICY.md | Policy aprobada | DONE (auditado en `docs/audits/P0_AUDIT.md`, aprobado 2026-08-07) |
| 005 | P0 | Crear CONTENT_POLICY.md | Policy aprobada | DONE (auditado en `docs/audits/P0_AUDIT.md`, aprobado 2026-08-07) |
| 006 | P1 | Definir naming/domain como decisión separada | ADR creado | DONE (ADR-009: "Decidero", provisional — falta búsqueda formal de marca y registro de dominio, ver 109) |
| 106 | P0 | Crear AGENTS.md y CLAUDE.md mínimos | Agentes cargan reglas | DONE (ver raíz del repo) — *ID asignado originalmente a P1 en el blueprint original; se entregó en P0 porque los agentes necesitaban el guardrail de branding (ADR-009) desde el primer momento. No se reutiliza el ID, solo se reubica su fila.* |

## Fase P1 — Repository & Delivery Foundation

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 101 | P0 | Crear monorepo Next.js/TypeScript | Build local verde | DONE — build falla solo localmente por una restricción de memoria específica de esta máquina (no del código); confirmado exitoso en CI (run 31225151278) |
| 102 | P0 | Configurar lint/typecheck/tests | CI verde | DONE — `.github/workflows/ci.yml` corrió y pasó (`conclusion=success`) en el primer push a `main` |
| 103 | P0 | Configurar Supabase environments | Env matrix | DONE — un solo proyecto (`jprs-monetization-platform`, US East), ver ADR-010. **Corrección (ADR-012)**: Database Branching requiere plan Pro (proyecto está en FREE) — migraciones se aplican directo al proyecto único vía PR, no vía preview DB. `.env.local` configurado y verificado (URL, anon key, service_role key) en `apps/web/` |
| 104 | P0 | Conectar GitHub-Vercel previews | Preview PASS | DONE — proyecto Vercel `jprs-monetization-platform` conectado al repo (scope `digitalconnectdr`), deploy a producción exitoso (Root Directory `apps/web`), variables de Supabase cargadas en Vercel (Production + Preview). Preview en PR confirmado con evidencia real en PR #3 (estado "Ready") |
| 105 | P0 | Proteger main y checks requeridos | Ruleset activo | DONE — PR obligatorio, check `build` requerido en verde, rama actualizada, sin force-push ni borrado de `main`, `enforce_admins=true` (ver ADR-011) |
| 107 | P1 | Templates Issue/PR/Audit | Templates presentes | DONE |
| 108 | P1 | Centralizar nombre de marca en config única (branding) para soportar rename sin fricción (ADR-009) | Un solo punto de config; sin strings hardcodeados en UI/SEO/seeds | DONE — `packages/shared/src/branding.ts` |
| 109 | P1 | Búsqueda formal de marca (USPTO/EUIPO) + registro de dominio para "Decidero" o el nombre final | Marca despejada + dominio adquirido | DEFERRED — no bloquea cierre de Fase 1 (decisión explícita del propietario funcional, 2026-08-07); debe resolverse antes de Fase 11 (MVP Launch). Owner: propietario funcional |
| 110 | P1 | Congelar versiones `"latest"` a versiones exactas resueltas (hallazgo F-05 de `docs/audits/P1_AUDIT.md`) | Sin rangos abiertos (`latest`) en `package.json` de `apps/*`/`packages/*` | DONE — `next`/`react`/`react-dom`/`@types/*`/`eslint`/`eslint-config-next`/`typescript` fijados a la versión resuelta en `package-lock.json`. Recordatorio: cualquier dependencia nueva debe agregarse con versión fijada, no `latest` |

## Fase P2 — Data Core, Auth & RBAC

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 201 | P0 | Schema identity/properties | Migration PASS | DONE — aplicado y verificado en el proyecto real, ver `docs/audits/P2_AUDIT.md` |
| 202 | P0 | Supabase Auth | Flows PASS | DONE — trigger `handle_new_user`, signup/signin verificado en tests reales |
| 203 | P0 | RBAC + RLS | Negative tests PASS | DONE — 18/18 tests (`supabase/tests/rls_access.test.mjs`) contra el proyecto real |
| 204 | P0 | Admin/User route guards | E2E PASS | DEFERRED — Fase 4 completó el schema/RLS que los guards protegerían, pero no el wiring de auth en `apps/web` (ver 409, su prerrequisito real). Se implementa en cuanto 409 esté resuelto, no atado a un número de fase fijo |
| 205 | P1 | Data dictionary | Documentado | DONE — `docs/DATA_DICTIONARY.md` |

## Fase P3 — Design System & Public Shell

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 301 | P0 | Design tokens propios | UI review PASS | DONE — `apps/web/src/app/globals.css` (Tailwind v4 `@theme`, OKLCH), documentado en `docs/DESIGN_SYSTEM.md` |
| 302 | P0 | Navigation + search shell | Responsive PASS | DONE — header/footer/búsqueda, verificado mobile/tablet/desktop en navegador |
| 303 | P0 | Core page templates | A11y PASS | DONE — Home, Discover, vertical hub, Search, 5 páginas legales; skip-link, focus-visible, reduced-motion, contraste AA |
| 304 | P1 | Motion guidelines | Reduced-motion PASS | DONE — `prefers-reduced-motion: reduce` global en `globals.css`; transiciones limitadas a color/opacity en hover/focus (sin motion de entrada, no había contenido dinámico que lo justificara) |
| 305 | P0 | Mobile comparison patterns | UX PASS | DONE (parcial, por scope real de Fase 3) — patrones de lista/comparación aplicados a Discover y vertical hub; patrones de tabla comparativa completa se diseñan en Fase 4 cuando exista contenido real de producto |
| 306 | P0 | Internacionalización del shell público (EN/ES/PT/HI) — agregado a mitad de fase por instrucción explícita del propietario funcional, fuera del scope original del blueprint (ver ADR-013) | 4 idiomas navegables completos, verificado en navegador | DONE — `apps/web/src/lib/i18n/`, `middleware.ts`, `docs/DESIGN_SYSTEM.md` §7 |
| 309 | P1 | Agregar francés (fr) como 5to idioma del shell público — solicitado después del cierre de Fase 3, ejercita la extensibilidad prevista en ADR-013 | Idioma navegable completo, `typecheck` confirma diccionario completo, verificado en navegador | DONE — `apps/web/src/lib/i18n/fr.ts`, registrado en `locales.ts`/`get-dictionary.ts` |

## Fase P4 — CMS & Product Intelligence

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 401 | P0 | Catalog/vendor/product CRUD | Integration PASS | DONE — `product_variants`/`product_features`/`product_prices`/`product_media` (completa el shell de vendors/products de Fase 2), 29/29 tests contra el proyecto real, ver `docs/audits/P4_AUDIT.md` |
| 402 | P0 | Product sources + checked_at | Validation PASS | DONE — `source`/`checked_at`/`confidence` obligatorios en `product_features`/`product_prices`, `confidence` default `unverified` (F-08) |
| 403 | P0 | Content workflow/versioning | Workflow PASS | DONE — `content_items`/`content_versions`/`content_blocks`/`content_product_links`/`content_sources`, trigger `enforce_publish_requires_approved_version` (ADR-005) corregido tras F-01 (Critical) de la auditoría |
| 404 | P0 | Price/feature history | History preserved | DONE — `product_prices`/`product_features` append-only (sin `UPDATE` para ningún rol de aplicación ni `service_role`, F-05) |
| 405 | P1 | Bulk import validation | Invalid rows rejected | DONE — función `import_product_prices(jsonb)`, límite de 500 filas (F-07), sin oráculo de existencia (F-04) |
| 406 | P0 | Freshness queue | Stale item visible | DONE — `freshness_checks` (admin-only), sin cron/Edge Function todavía (eso es Fase 9) |
| 409 | P0 | Wiring de cliente Supabase (`@supabase/ssr`) + login/sesión de servidor en `apps/web` | Sesión persistente, login/logout funcional | TODO — prerrequisito real de 204; `apps/web` no tiene ningún cliente de Supabase instalado (ver `docs/phases/P4.md` "Explícitamente fuera de scope") |
| 407 | P1 | Migrar `apps/web/src/middleware.ts` a la convención `proxy.ts` (Next.js 16.3 marca `middleware` como deprecated) | Build sin warning de deprecación, routing de locale sin regresión | TODO — hallazgo F-02 de `docs/audits/P3_AUDIT.md`, diferido explícitamente en Fase 3 por falta de documentación del framework disponible en el entorno para confirmar el contrato de `proxy.ts` sin riesgo |
| 408 | P1 | `not-found.tsx` localizado bajo `app/[locale]/` (hoy usa el 404 genérico de Next.js en inglés fijo) | 404 traducido en los 4 idiomas | TODO — hallazgo F-06 de `docs/audits/P3_AUDIT.md`, diferido porque requiere decidir cómo acceder al locale correcto desde una ruta que Next.js renderiza fuera del árbol normal de `params` |

## Fase P5 — Monetization & Attribution

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 501 | P0 | Affiliate programs/offers/terms | CRUD PASS | DONE — `affiliate_programs`/`affiliate_terms`/`affiliate_offers`, trigger que exige terms antes de activar, 45/45 tests contra el proyecto real, ver `docs/audits/P5_AUDIT.md` |
| 502 | P0 | Affiliate click attribution | Dedup PASS | DONE — `record_affiliate_click()`, idempotente por `click_id` (verificado bajo concurrencia real por el auditor) |
| 503 | P0 | Ad slot/rule engine | Policy tests PASS | DONE — `monetization_rules` con `CHECK` estructural (vocabulario fijo tras F-02) que impide `ads` en `auth`/`admin`/`low_value` |
| 504 | P0 | Lead form/routing model | Secure flow PASS | DONE — `lead_forms`/`lead_submissions` (PII, super_admin-only)/`lead_routes` con cross-check de niche |
| 505 | P0 | Revenue events | Reconcile PASS | DONE — `revenue_events` + `import_revenue_events()`, idempotente por `event_id` (verificado con duplicado dentro del mismo lote) |
| 506 | P0 | Disclosure/Sponsored labels | Policy review PASS | DONE — `sponsorship_placements.disclosure_label` nunca vacío (`CHECK`, cubre whitespace y `NULL` explícito) |
| 507 | P1 | Import commissions/reversals | Import PASS | DONE — `import_revenue_events()` |
| 411 | P1 | Revisión sistemática de `GRANT`/`REVOKE EXECUTE` en funciones `SECURITY DEFINER` de Fases 2/4 (`has_role`, `is_admin_for_site`, `is_admin_for_niche`, `import_product_prices`) | Confirmado sin gap explotable, o corregido | TODO — hallazgo F-01 de `docs/audits/P5_AUDIT.md`; ninguna es explotable de forma independiente hoy, pero requiere verificar que ninguna policy de lectura pública dependa del privilegio implícito de `PUBLIC` antes de revocarlo |

## Fase P6A — Vertical 1: Business Software & AI

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 601 | P0 | Software/AI taxonomy | Approved | DONE — 6 categorías sembradas en `public.categories` (CRM, AI Assistants, Automation, SEO & Marketing, Website & E-commerce, Productivity) |
| 602 | P0 | Catalog seed | Verified | DONE (parcial) — 5 vendors/products reales sembrados en 2 de 6 categorías (CRM, AI Assistants), cada precio/feature con `source`+`checked_at` real. Ver `docs/phases/P6A_REPORT.md` sobre por qué es parcial. Enriquecido post-cierre (2026-08-08) con `billing_model`/`marketplace_integrations`/`seat_minimum`/`api_access`/`team_plan` — ver addendum en `docs/phases/P6A_REPORT.md` |
| 603 | P0 | Best/VS/Review templates | QA PASS | DONE — categoría (Best X), perfil de producto, y guía/comparación (VS), todas renderizando datos reales, verificadas en navegador mobile/tablet/desktop |
| 604 | P0 | Software tool v1 | E2E PASS | DONE — CRM Pricing Comparator, interactivo, verificado con toggle real de checkboxes |
| 605 | P0 | Content batch v1 | Editorial PASS | DONE (parcial, 1 de 12-18 target) — 1 comparación real (HubSpot CRM vs Freshsales vs monday CRM), `pending_editorial_review`, no auto-publicada. Resto del lote es backlog explícito, no se declara completo por aproximación — ver `docs/phases/P6A_REPORT.md` |
| 606 | P1 | Aprobar/publicar (o rechazar) el contenido en `pending_editorial_review` de Fase 6A | Decisión humana registrada | TODO — requiere al propietario funcional; el agente no se auto-aprueba (ADR-005), confirmado por el clasificador de permisos durante esta fase |
| 607 | P0 | Completar el resto del seed editorial de Software & AI (10-15+ páginas adicionales, 4 categorías restantes: Automation, SEO & Marketing, Website & E-commerce, Productivity) | Editorial PASS | TODO — alcance completo de `PROJECT_BLUEPRINT.md` §15 para este vertical, diferido explícitamente de esta sesión (ver `docs/phases/P6A_REPORT.md`) |
| 608 | P1 | Conectar `affiliate_links` reales a las páginas de producto (hoy son links directos al vendor, no monetizados) | Disclosure + tracking funcionando | TODO — requiere aprobación real de programas de afiliados (`MONETIZATION_POLICY.md` §3), fuera del alcance de un agente autónomo |

## Fase P6B — Vertical 2: Travel & Smart Travel

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 611 | P0 | Travel taxonomy/data | Approved | DONE (parcial) — 6 categorías sembradas (Hotels, Destinations, Itineraries, eSIM & connectivity, Luggage, Travel tech); catálogo real solo en 1 de 6 (eSIM & connectivity, 3 productos). Ver `docs/phases/P6B_REPORT.md` sobre por qué Hotels/Luggage quedan fuera |
| 612 | P0 | Travel templates | QA PASS | DONE — reutiliza templates genéricos de categoría/perfil/comparación de Fase 6A sin cambios estructurales; se corrigió un bug retroactivo (sufijo `/month` hardcodeado) descubierto al extender a un catálogo no-mensual |
| 613 | P0 | Travel tool v1 | E2E PASS | DONE — eSIM Data Plan Comparator, interactivo, verificado en navegador |
| 614 | P0 | Content batch v1 | Editorial PASS | DONE (parcial, 1 de 10-15 target) — 1 comparación real (Airalo vs Holafly vs Nomad eSIM), `pending_editorial_review`, no auto-publicada |
| 615 | P1 | Seasonality rules | Jobs PASS | TODO — requiere datos estacionales reales por destino, no existen todavía |
| 616 | P1 | Aprobar/publicar (o rechazar) el contenido en `pending_editorial_review` de Fase 6B | Decisión humana registrada | TODO — requiere al propietario funcional; el agente no se auto-aprueba (ADR-005), mismo patrón que backlog 606 |
| 617 | P0 | Completar el resto del seed editorial de Travel (Hotels, Destinations, Itineraries, Luggage, Travel tech) | Editorial PASS | TODO — Hotels requiere antes una decisión de producto sobre cómo modelar precio dinámico (no encaja en `product_prices` tal cual); Luggage requiere fuentes de vendor más consistentes que las probadas (Away/Samsonite) |
| 618 | P1 | Conectar `affiliate_links` reales a las páginas de producto de Travel | Disclosure + tracking funcionando | TODO — requiere aprobación real de programas de afiliados (`MONETIZATION_POLICY.md` §3), fuera del alcance de un agente autónomo |

## Fase P6C — Vertical 3: Consumer Tech & Smart Home

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 621 | P0 | Consumer Tech taxonomy/specs | Approved | DONE (parcial) — 7 categorías sembradas (incluye "Creator gear", que faltaba desde Fase 3); catálogo real solo en 1 de 7 (Networking, 3 productos). Ver `docs/phases/P6C_REPORT.md` |
| 622 | P0 | Commerce templates | QA PASS | DONE — reutiliza templates de categoría/perfil de Fase 6A; nueva ruta `/deals` que solo lista ofertas `sale` vigentes |
| 623 | P0 | Finder/compatibility tool | E2E PASS | DONE — Mesh Wi-Fi Finder, filtro por Wi-Fi 7/multi-gig/hub, verificado interactivo en navegador |
| 624 | P0 | Deal expiration | Job PASS | DONE — `product_prices.expires_at` obligatorio para `price_type='sale'`, RLS excluye ofertas vencidas, `import_product_prices` actualizada. 10/10 tests contra el proyecto real (`supabase/tests/deal_expiration.test.mjs`) |
| 625 | P0 | Content batch v1 | Editorial PASS | DONE (parcial, 1 de 8-12 target) — 1 comparación real (eero 7 vs Nest Wifi Pro vs Deco BE63), `pending_editorial_review`, no auto-publicada |
| 626 | P1 | Aprobar/publicar (o rechazar) el contenido en `pending_editorial_review` de Fase 6C | Decisión humana registrada | TODO — mismo patrón que 606/616 |
| 627 | P0 | Completar el resto del catálogo de Consumer Tech (Smart home, Audio, Monitors, Accessories, Home office, Creator gear) | Editorial PASS | TODO — 6 de 7 categorías sin productos |
| 628 | P1 | Conectar `affiliate_links` reales a las páginas de producto de Consumer Tech | Disclosure + tracking funcionando | TODO — mismo motivo que 608/618 |
| 629 | P1 | Sembrar al menos 1 oferta `sale` real y vigente (con `expires_at` verificable) para que `/deals` muestre datos reales | Oferta real visible en `/deals` | TODO — investigado activamente (eero/Nest/Deco BE63 en eero.com, Google Store, Best Buy, Amazon), sin resultado verificable al momento del cierre; ver `docs/phases/P6C_REPORT.md` |

## Fase P7 — Admin Analytics & ROE v1

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 701 | P0 | Executive dashboard | Reconcile PASS | TODO |
| 702 | P0 | Affiliate/Ads dashboards | Reconcile PASS | TODO |
| 703 | P0 | Product/Content dashboard | Metrics PASS | TODO |
| 704 | P0 | Acquisition dashboard | Attribution PASS | TODO |
| 705 | P0 | ROE v1 rules | Unit tests PASS | TODO |
| 706 | P1 | Ops alerts | Alert test PASS | TODO |

## Fase P8 — Growth/Search/Distribution

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 801 | P0 | Metadata/canonical/robots | SEO audit PASS | TODO |
| 802 | P0 | Sitemaps per property | Validated | TODO |
| 803 | P0 | Structured data | Validator PASS | TODO |
| 804 | P0 | Internal linking/breadcrumbs | Crawl PASS | TODO |
| 805 | P1 | Newsletter/preferences | E2E PASS | TODO |
| 806 | P1 | Social content workflow | Playbook ready | TODO |

## Fase P9 — AI Operations & Freshness

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 901 | P0 | AI job queue | Retry/DLQ PASS | TODO |
| 902 | P0 | Research/draft/review pipeline | Audit trail PASS | TODO |
| 903 | P0 | Human approval gate | Cannot bypass | TODO |
| 904 | P0 | Freshness detectors | Stale simulation PASS | TODO |
| 905 | P1 | AI cost controls | Budget alerts | TODO |

## Fase P10 — Hardening & Compliance

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 1001 | P0 | Threat model | Reviewed | TODO |
| 1002 | P0 | RLS/auth security tests | PASS | TODO |
| 1003 | P0 | Dependency/security scan | No High/Critical | TODO |
| 1004 | P0 | Privacy/consent | Compliance review | TODO |
| 1005 | P0 | Accessibility audit | AA baseline | TODO |
| 1006 | P0 | Performance budgets | PASS | TODO |
| 1007 | P0 | Backup/restore drill | Evidence saved | TODO |

## Fase P11 — MVP Launch + 10K Gate

| ID | Prioridad | Pendiente | Cierre esperado | Estado |
|---|---|---|---|---|
| 1101 | P0 | Production launch | Smoke PASS | TODO |
| 1102 | P0 | Analytics validation | Reconcile PASS | TODO |
| 1103 | P0 | Search indexing validation | Coverage monitored | TODO |
| 1104 | P0 | 10K economic gate report | GO/PIVOT/STOP | TODO |

## Notas de mantenimiento

- Este backlog se actualiza exclusivamente por A9 (Project Controller) al cierre de cada fase, según el protocolo obligatorio descrito en `PROJECT_BLUEPRINT.md` §9.
- Los hallazgos de auditoría (Critical/High/Medium/Low) se convierten en nuevos ítems de backlog con su propio ID — nunca se reescribe un ID existente.
- Fases P12 (100K Scale) y P13 (1M Platform) no tienen backlog detallado todavía; se generará cuando se aproxime su inicio, condicionado a los gates económicos.
