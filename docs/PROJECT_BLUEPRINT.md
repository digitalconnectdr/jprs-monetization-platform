# Decidero (nombre provisional) — Monetization Intelligence Platform
## Project Blueprint (versión operativa resumida)

> Fuente original: `JPRS_Monetization_Intelligence_Platform_Blueprint_v1.docx` (v1.0, 7 de agosto de 2026).
> Este documento es la versión resumida/operativa que exige la sección 19 del blueprint original. El `.docx` original se conserva **fuera del repositorio** únicamente como referencia histórica no autoritativa — **ningún requisito técnico de este proyecto depende de contenido que solo exista en el `.docx`**. Todo lo operativamente necesario para ejecutar cualquier fase está inlineado en este archivo o en los documentos que enlaza dentro de `/docs`. Si en el futuro se detecta una dependencia de contenido no versionado, se trata como hallazgo de auditoría (ver `docs/audits/`), no como comportamiento esperado.

- Nombre comercial: **Decidero** (provisional — ver ADR-009 en [DECISIONS.md](DECISIONS.md); sujeto a cambio, el sistema debe soportar rename sin fricción)
- Stack objetivo: Next.js + TypeScript / Supabase / Vercel / GitHub
- Implementación: Codex + Claude Code, con revisión cruzada obligatoria (el autor de un cambio nunca es su único auditor)
- Principio de ejecución: fases cerradas — planificar → implementar → probar → auditar → corregir → cerrar → actualizar pendientes
- Fuente de verdad: repositorio GitHub + `/docs` versionado
- Regla de merge: nada llega a `main` sin pasar pruebas requeridas, auditoría de fase y checklist de aceptación

## 1. Objetivo

Construir una plataforma multi-vertical que convierta tráfico en ingresos mediante publicidad, afiliación y, progresivamente, leads, patrocinios y servicios para vendors; con optimización basada en datos y control de calidad por fases.

No es un "blog con anuncios": es un sistema de descubrimiento, comparación y recomendación con múltiples motores de monetización y una capa de inteligencia (Revenue Optimization Engine, ROE) que mide qué combinación de página, producto, fuente de tráfico y modelo de ingreso produce mayor valor por sesión.

**Decisión principal**: un solo núcleo tecnológico multi-property. Los tres nichos iniciales comparten autenticación, CMS, analítica, ROE y administración, pero se modelan como propiedades/verticales independientes (contenido, diseño, medición y, si conviene, dominios separados).

**Métrica de decisión**: Revenue per 1,000 sessions (R1K) y Revenue per Session (RPS), no solo pageviews.

**Gate inicial**: 10,000 sesiones/mes + evidencia de monetización antes de construir marketplace/vendor suite completa.

**Riesgo principal**: crear tráfico sin intención comercial o contenido genérico que no consiga distribución ni conversión.

## 2. Modelo de monetización (capas, por orden de activación)

| Capa | Momento | Función |
|---|---|---|
| Display Ads / AdSense | MVP | Monetización residual de contenido informativo y sesiones que no convierten |
| Affiliate | MVP | Comisión por clic/registro/venta; prioridad en páginas comerciales |
| Lead Generation | MVP controlado | Formularios donde un lead calificado tenga alto valor |
| Sponsored placements | Después de tracción | Posiciones patrocinadas identificadas; nunca comprar ranking editorial |
| Vendor subscriptions | 100K+ / validación | Perfil reclamado, analytics, promociones para proveedores |
| Newsletter sponsorship | Audiencia propia | Monetiza distribución directa, reduce dependencia de buscadores |
| Data / Intelligence | Escala | Reportes, tendencias y benchmarks propios |

Detalle completo de reglas en [MONETIZATION_POLICY.md](MONETIZATION_POLICY.md).

## 3. Los tres nichos iniciales

Seleccionados para probar economías distintas — maximizar tráfico, intención comercial, disponibilidad de monetización, distribución y riesgo operativo aceptable (no necesariamente relacionados entre sí).

### Nicho A — Business Software & AI (score 90/100, motor: afiliados + leads)
- Audiencia: SMB, agencias, freelancers, equipos comerciales/marketing, emprendedores
- Subcategorías: CRM, AI assistants, automation, SEO/marketing software, website/e-commerce, productivity
- Páginas money: Best X for Y, X vs Y, alternatives, reviews, pricing explainers, stack builders
- Herramientas: Software Stack Builder, ROI Calculator, CRM Comparator, AI Tool Finder
- Adquisición: SEO/GEO, YouTube, LinkedIn, TikTok educativo, newsletters, Reddit/comunidades
- Evidencia comercial: HubSpot paga 30% recurrente hasta 1 año, cookie 180 días (R8)

### Nicho B — Travel & Smart Travel (score 86/100, motor: afiliados + ads)
- Audiencia: viajeros leisure/business, parejas, familias, viajeros de alto valor
- Subcategorías: hoteles, destinos, itinerarios, eSIM/conectividad, equipaje, travel tech, movilidad local
- Páginas money: Best hotels in X, where to stay, X vs Y destinations, travel gear, booking guides
- Herramientas: Trip Cost Planner, Destination Matcher, Hotel Comparison, Packing Planner
- Adquisición: Google, TikTok, Instagram, YouTube, Pinterest, email, contenido estacional
- Evidencia comercial: Tripadvisor paga ≥50% de la comisión en hotel click-outs, sin exigir reserva (R9)

### Nicho C — Consumer Tech & Smart Home (score 83/100, motor: afiliados + social)
- Audiencia: compradores de electrónica, hogar conectado, productividad doméstica, gadgets
- Subcategorías: smart home, networking, audio, monitors, accessories, home office, creator gear
- Páginas money: Best X under $Y, X vs Y, best for use case, reviews, buying guides, deals
- Herramientas: Product Finder, Setup Builder, Cost/Feature Comparator, Compatibility Checker
- Adquisición: TikTok, Instagram Reels, YouTube, Pinterest, Google Discover/Search, email deals
- Control editorial: la comisión nunca determina el ranking; Sponsored siempre separado y etiquetado

**Orden de lanzamiento** (por oleadas, no simultáneo): Software/AI primero (validar tracking/monetización) → Travel segundo (validar volumen/social) → Consumer Tech tercero (validar commerce + short-form). La plataforma debe poder activar/desactivar verticales sin despliegues especiales.

Futuros candidatos (no MVP): Home Services (81/100, leads), Education & Careers (79/100, affiliate + leads).

## 4. Arquitectura del producto

**Principio**: núcleo multi-property, monorepo, un solo backend y panel administrativo. Cada vertical se identifica mediante `site_id`/`niche_id` y puede vivir en rutas, subdominios o dominios independientes sin duplicar lógica.

```
PUBLIC PROPERTIES / VERTICALS
 ├─ Business Software & AI
 ├─ Travel & Smart Travel
 └─ Consumer Tech & Smart Home
             │
             ▼
      NEXT.JS APPLICATION LAYER
             │
   ┌─────────┼─────────┐
   ▼         ▼         ▼
Content   Product   Monetization
Engine    Intel.       ROE
   └─────────┼─────────┘
             ▼
        SUPABASE CORE
 Auth | Postgres | Storage | RLS | Edge Functions | Cron | Queues
             │
             ▼
 Analytics / Attribution / Audit / Backlog
             │
             ▼
 GitHub CI + Vercel Preview/Production
```

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Web | Next.js + TypeScript | SSR/ISR, rutas públicas, cuenta de usuario, admin, APIs server-side |
| UI | Tailwind + primitives accesibles + design tokens propios | Sistema visual premium, sin apariencia de template AI genérico |
| Database | Supabase Postgres | Fuente de verdad relacional, RLS, reporting, materialized views |
| Auth | Supabase Auth | Login, sesiones, recuperación, OAuth opcional, RBAC vía perfiles/roles |
| Storage | Supabase Storage | Imágenes de producto, assets editoriales, uploads administrados |
| Jobs | Supabase Cron + Queues + Edge Functions | Freshness checks, imports, sincronizaciones, procesamiento async |
| Hosting | Vercel | Preview por PR/rama, production desde `main` |
| SCM/CI | GitHub + GitHub Actions | PRs, branch protection, test/lint/build/security checks |
| AI dev | Codex + Claude Code | Implementación, revisión cruzada, QA, reportes de auditoría |

### Estructura de repositorio objetivo

```
repo/
├─ apps/web/                      # Public + account + admin           ← Fase 1
├─ packages/                                                           ← Fase 1
│  ├─ ui/                         # Design system
│  ├─ db/                         # Types, queries, repositories
│  ├─ analytics/                  # Event taxonomy + reporting
│  ├─ monetization/               # ROE, affiliate, ads, attribution
│  ├─ content/                    # Schemas, renderers, editorial rules
│  ├─ seo/                        # metadata/schema/sitemaps/feeds
│  └─ shared/                     # utilities/config
├─ supabase/                                                           ← Fase 1/2
│  ├─ migrations/ ├─ functions/ ├─ seed.sql └─ tests/
├─ docs/                                                                ← Fase 0 (ya creado)
│  ├─ PROJECT_BLUEPRINT.md · PROJECT_CHARTER.md · MASTER_BACKLOG.md
│  ├─ DECISIONS.md · MONETIZATION_POLICY.md · CONTENT_POLICY.md · KPI_TREE.md
│  ├─ phases/ (P0_REPORT.md ya creado) · audits/
│  ├─ ARCHITECTURE.md · DATA_DICTIONARY.md · EVENT_TAXONOMY.md          ← se crean en Fase 2/7
│  ├─ DESIGN_SYSTEM.md · SECURITY.md                                    ← se crean en Fase 3/10
├─ AGENTS.md                      # Codex: reglas mínimas del repo      ← Fase 0 (ya creado)
├─ CLAUDE.md                      # Claude Code: reglas mínimas         ← Fase 0 (ya creado)
├─ README.md                                                            ← Fase 0 (ya creado)
└─ .github/workflows/                                                   ← Fase 1
```

`docs/`, `AGENTS.md`, `CLAUDE.md` y `README.md` ya existen desde el cierre documental de Fase 0 — son guardrails y fuente de verdad, no "bootstrap técnico". Fase 1 crea el resto: el monorepo ejecutable (`apps/`, `packages/`, `supabase/`, `.github/workflows/`) y los documentos que solo tienen sentido una vez ese código exista (`ARCHITECTURE.md`, `DATA_DICTIONARY.md`, `EVENT_TAXONOMY.md`, `DESIGN_SYSTEM.md`, `SECURITY.md`).

## 5. Modelo de datos y RBAC (resumen — detalle en Fase 2)

**Roles**: Super Admin (Sí, MVP), Admin (Sí, MVP), Editor (interno), Analyst (interno, solo lectura), User (Sí, MVP), Vendor (futuro). **RLS es obligatorio** — los permisos se aplican en PostgreSQL/Supabase, no solo ocultando botones en el frontend.

**Dominios de tablas iniciales**:

| Dominio | Tablas iniciales |
|---|---|
| identity | profiles, roles, user_roles, user_preferences |
| properties | sites, niches, categories, site_settings |
| catalog | vendors, products, product_variants, product_features, product_prices, product_media |
| affiliate | affiliate_programs, affiliate_offers, affiliate_links, affiliate_terms, affiliate_clicks |
| content | content_items, content_versions, content_blocks, content_product_links, content_sources |
| monetization | ad_slots, monetization_rules, roe_scores, sponsored_campaigns, sponsorship_placements |
| analytics | sessions, events, page_metrics_daily, attribution_touchpoints, conversions, revenue_events |
| leads | lead_forms, lead_submissions, lead_routes, lead_revenue |
| user value | saved_products, comparisons, alerts, newsletter_preferences |
| operations | phase_runs, audit_runs, audit_findings, backlog_items, decisions, freshness_checks, job_runs |

**Reglas de datos**:
- Todo registro monetizable requiere `site_id`/`niche_id`.
- Todo precio/comisión/claim de producto requiere `source`, `checked_at`, `confidence/status`.
- No sobrescribir históricos — precios, comisiones y métricas requieren series temporales.
- No guardar secretos de afiliados/APIs en tablas visibles al cliente.
- PII de leads/usuarios: minimización, retención con política definida, protegida por RLS.
- Eventos analíticos requieren `event_id` idempotente (evitar doble conteo).

## 6. Experiencia pública y diseño

La presentación debe transmitir "plataforma de información y decisión", no "blog de afiliados". Se evita el patrón visual típico de páginas generadas por AI sin curación: hero gigante sin sustancia, gradientes indiscriminados, tarjetas repetitivas, animaciones decorativas sin función.

### 6.1 Sistema visual

| Área | Regla |
|---|---|
| Jerarquía | Tipografía editorial fuerte, densidad controlada, foco en tablas, datos, comparaciones y evidencia |
| Color | Base neutra + un acento de marca; los verticales pueden tener acentos secundarios sin romper identidad global |
| Componentes | Comparison tables, scorecards, chips de atributos, price history, pros/cons, tool outputs, evidence cards |
| Animación | Microinteracciones, transiciones de filtros y estados; nada que perjudique CLS o distraiga de conversión |
| Accesibilidad | WCAG AA baseline: teclado, foco, contraste, labels, alt, reduced motion |
| Responsive | Mobile-first real; tablas con patrones responsivos diseñados, no scroll horizontal indiscriminado |

### 6.2 Mapa de páginas públicas

| Grupo | Páginas |
|---|---|
| Core | Home, Discover, Search, About/Methodology, Editorial Policy, Affiliate Disclosure, Privacy, Terms |
| Vertical | Niche Home, Category, Trends, Deals, Tools |
| Commercial | Best X, X vs Y, Alternatives, Review, Product Profile, Buying Guide |
| Tools | Finder, Comparator, Calculator, Planner según vertical |
| Account | Login, Sign up, Dashboard, Saved, Comparisons, Alerts, Preferences |

### 6.3 Componentes de confianza obligatorios

- Metodología visible de evaluación y scoring.
- Fecha "Última revisión" y changelog para páginas críticas.
- Disclosure de afiliación próximo a recomendaciones monetizadas.
- Fuentes cuando se afirmen precios, especificaciones o condiciones.
- Separación visual entre "Sponsored" y ranking editorial.
- Pros/cons y casos donde NO recomendar un producto.

Detalle operativo de estas reglas: [CONTENT_POLICY.md](CONTENT_POLICY.md).

## 7. Revenue Optimization Engine (ROE)

Determina la mejor mezcla de monetización por página y audiencia usando rendimiento real. **No altera el ranking editorial** para favorecer comisión más alta — Quality Score y Monetization Score son señales independientes (firewall editorial).

```
Expected Revenue per Session = Ad EV + Affiliate EV + Lead EV + Sponsor EV
Affiliate EV = P(click) × P(conversion | click) × expected commission
Lead EV      = P(lead) × expected lead value
Ad EV        = expected page RPM / 1000 × expected pageviews/session
```

### 7.1 Clasificación por intención de página

| Tipo de página | Ads | Affiliate | Lead | Prioridad |
|---|---|---|---|---|
| Informativa | Alta | Baja/Media | Baja | Retención + ads + siguiente paso |
| Tutorial | Media | Media | Baja/Media | Resolver tarea y recomendar herramientas contextualizadas |
| Review | Baja | Alta | Baja | Affiliate/conversión |
| Comparación | Muy baja | Muy alta | Media | Decisión comercial |
| Deal/Oferta | Nula/Baja | Muy alta | Baja | Conversión; evitar distracciones |
| Tool/Calculator | Media | Alta contextual | Media | Resultado útil + CTA relevante |

### 7.2 Controles

Editorial firewall, affiliate terms por programa, AdSense safety (nunca más ads/promoción que contenido, sin ads en low-value/auto-generated sin revisión — R1/R2/R3), experiments solo sobre layout/CTA/placement, audit trail completo.

## 8. Analytics, atribución y KPIs de decisión

Event taxonomy mínima: `page_view`, `product_impression`, `affiliate_click`, `comparison_add`, `save_product`, `lead_start`/`lead_submit`, `conversion`, `ad_revenue_daily`, `newsletter_signup`.

Detalle completo (KPIs, dashboard admin, fórmulas) en [KPI_TREE.md](KPI_TREE.md).

## 9. Growth & Distribution Engine

Adquisición diversificada desde el diseño (no depender solo de SEO): Search (Google/Bing), AI Discovery (GEO/AEO/LLM citations), Short-form (TikTok/Reels), Long-form (YouTube), Visual discovery (Pinterest), Communities (Reddit), Owned (email/alerts/account), Partnerships, Paid (solo si contribution margin > CAC — nunca arbitraje de AdSense).

## 10. Sistema de agentes AI y control de fases

| ID | Agente | Responsabilidad |
|---|---|---|
| A1 | Plan Guardian | Compara entregables vs. scope/criterios/decisiones; detecta scope drift |
| A2 | Architecture Reviewer | Dependencias, boundaries, modularidad, duplicación, performance |
| A3 | Security & RLS Reviewer | Auth, RLS, secrets, injection, authorization, data exposure |
| A4 | QA & Regression | Tests unit/integration/E2E, edge cases, regresiones |
| A5 | UX & Accessibility | Jerarquía visual, responsive, flows, WCAG, consistencia |
| A6 | Search/Content Reviewer | SEO técnico, schema, indexability, GEO/AEO, freshness |
| A7 | Monetization & Policy | AdSense placement/policies, affiliate disclosure/terms, sponsored separation |
| A8 | Analytics Auditor | Events, atribución, dedup, revenue reconciliation, dashboards |
| A9 | Project Controller | Actualiza backlog, blockers, deuda, findings, phase status |

**Protocolo obligatorio de cierre de fase**:
1. Builder termina únicamente el scope de la fase y ejecuta tests locales.
2. Genera `PHASE_REPORT.md`: qué cambió, archivos, migraciones, tests, riesgos, deuda conocida.
3. A1 valida plan/scope → `audit-plan.md`.
4. Agentes especializados de la fase revisan el diff y la Preview de Vercel.
5. Cada hallazgo se registra en `audit_findings` con severidad Critical/High/Medium/Low y evidencia.
6. Critical/High se corrigen antes de cierre. Medium requiere corrección o decisión explícita con fecha/owner.
7. Se reejecutan typecheck, lint, unit, integration, E2E y build aplicables.
8. A9 actualiza `MASTER_BACKLOG.md`, `DECISIONS.md`, `CHANGELOG.md`, `PHASE_STATUS.md`.
9. PR solo se fusiona si required checks están verdes y checklist de fase está completo.
10. Merge a `main` → despliegue production → smoke test post-merge → marcar fase CLOSED.

### 10.1 Matriz de independencia (quién audita a quién)

| Caso | Implementa | Revisión primaria | Revisión adicional |
|---|---|---|---|
| UI/feature normal | Codex o Claude | El otro agente | A4/A5 según caso |
| DB/RLS/Auth | Codex o Claude | El otro agente | A3 obligatorio + SQL tests |
| Analytics/Revenue | Codex o Claude | El otro agente | A8 obligatorio + reconciliación |
| Monetización/affiliate | Codex o Claude | El otro agente | A7 obligatorio |
| Security-sensitive | Uno | Otro | A3 + deterministic scanners/tests; nunca AI-only approval |

**Regla no negociable**: una revisión de AI es evidencia auxiliar, no sustituto de tests. GitHub debe exigir checks determinísticos (R7). El autor de un cambio nunca es el único auditor.

## 11. Plan maestro por fases

| Fase | Nombre | Resultado / Gate |
|---|---|---|
| 0 | Charter & Research Lock | Scope, KPIs, policies, verticales y fuente de verdad cerrados |
| 1 | Repository & Delivery Foundation | Monorepo, CI, Supabase environments, Vercel previews, branch protection |
| 2 | Data Core, Auth & RBAC | Schema base, RLS, roles, migrations, tests de autorización |
| 3 | Design System & Public Shell | UX premium, navegación, responsive, accessibility baseline |
| 4 | CMS & Product Intelligence | Productos, vendors, fuentes, precios, content workflow, freshness |
| 5 | Monetization & Attribution | Affiliate tracking, AdSense slots/rules, leads, revenue events, disclosures |
| 6A | Vertical 1: Software & AI | Primer vertical completo y monetizable |
| 6B | Vertical 2: Travel | Segundo vertical completo, templates y tools propios |
| 6C | Vertical 3: Consumer Tech | Tercer vertical completo, commerce-oriented |
| 7 | Admin Analytics & ROE v1 | Dashboard, RPS/R1K, performance by page/product/channel, rule engine v1 |
| 8 | Growth/Search/Distribution | SEO/GEO/AEO, sitemaps/schema, social content ops, newsletter/alerts |
| 9 | AI Operations & Freshness | Research/draft/review agents, job queues, update detection; sin auto-publish ciego |
| 10 | Hardening & Compliance | Security, privacy, accessibility, performance, policy, disaster recovery |
| 11 | MVP Launch + 10K Gate | Producción, monitoring, decisión económica al alcanzar ventana suficiente |
| 12 | 100K Scale | Winners expansion, vendors/sponsors, owned audience |
| 13 | 1M Platform | Marketplace/data intelligence, multi-domain expansion, ROE avanzado |

Tareas, entregables, auditoría de cierre y criterios de aceptación detallados por fase se documentan en `docs/phases/[FASE].md` — **deliberadamente no se crean todos ahora**, solo cuando cada fase se inicia (evita que el detalle quede desactualizado respecto al estado real del proyecto). `docs/phases/P0_REPORT.md` es el primero en existir.

## 12. Gates económicos

### Gate 10K sesiones/mes
| Métrica | Target inicial |
|---|---|
| R1K total | ≥ US$60 |
| Affiliate CTR páginas comerciales | ≥ 3% |
| Email/account capture | ≥ 1% |
| Returning users | ≥ 10% |
| Tracking reconciliation | ≥ 98% eventos críticos |
| Critical/High defects | 0 abiertos |

**Decisión 10K**: R1K < $30 → no ampliar, corregir o cerrar vertical. $30–60 → pivot/optimización. ≥$60 → continuar. ≥$100 → acelerar winners. ≥$200 → prioridad de inversión (verificando estabilidad y concentración de ingresos).

### Gate 100K
Reducir dependencia de canal único; expansión basada en R1K/contribution margin/repeat rate/content ROI (no en número de artículos); Vendor/Sponsored solo con demanda demostrable; medir revenue concentration por merchant/program.

### Gate 1M
Datos propios generan tráfico/menciones sin depender de commodity content; audiencia propia como motor material; ROE avanzado con uplift medido por experimentos; arquitectura multi-property permite nuevos verticales sin duplicar administración.

## 13. Pre-mortem y post-mortem

### 13.1 Pre-mortem (riesgos principales)

| Falla | Prob. | Mitigación |
|---|---|---|
| Tráfico insuficiente | Alta | Long-tail comercial, tools, video/social, pruning, topic focus |
| Contenido genérico/AI commodity | Alta | Datos propios, pruebas, screenshots, comparadores, review humana |
| Dilución por 3 nichos | Media-Alta | Lanzamiento por oleadas, quotas de profundidad, pausar vertical débil |
| Afiliados no aprobados/cambian terms | Media | Multi-program, direct partners, leads, ads, merchant concentration limits |
| Ads dañan conversión | Media | ROE por intención, ads mínimos en money pages |
| Dependencia de Google | Alta | TikTok/Meta/YouTube/Pinterest/email/tools/referrals desde el inicio |
| Tracking incorrecto | Media-Alta | Event IDs, attribution tests, daily reconciliation, raw logs |
| Datos desactualizados | Alta | Freshness SLAs, queues, source timestamps, update alerts |
| AI introduce errores de código | Alta | Independent review + deterministic CI + protected main |
| Costos AI/data superan ingreso | Media | Cost accounting por job/content, budgets, caching, pruning |
| AdSense policy issue | Media | No low-value/auto-unreviewed, content-first, policy preflight |
| Usuarios no regresan | Media-Alta | Saved/compare/alerts/newsletter/tools con utilidad recurrente |

### 13.2 Post-mortem operativo

No se reserva para "fracaso total": se ejecuta tras incidentes relevantes, tras cada gate económico, y trimestralmente para revisar hipótesis.

**Template de post-mortem**:
```
POST_MORTEM_ID:
PERIODO / INCIDENTE:
HIPÓTESIS ORIGINAL:
RESULTADO REAL:
IMPACTO ECONÓMICO:
IMPACTO USUARIO/POLICY:
CAUSA RAÍZ: (5 Whys + evidencia; separar correlación de causalidad)
FACTORES CONTRIBUYENTES:
QUÉ FUNCIONÓ:
QUÉ FALLÓ:
ACCIONES CORRECTIVAS: [ID / OWNER / DUE / STATUS]
CAMBIOS A DECISIONS.md:
CAMBIOS A TESTS / POLICIES:
VALIDACIÓN DE CIERRE: (owner + auditor independiente + fecha)
```

## 14. Seguridad, política y compliance (resumen — detalle en Fase 10)

| Área | Requisito mínimo |
|---|---|
| Auth/RBAC | RLS server-side, least privilege, admin authorization tests |
| Secrets | Solo Vercel/Supabase secrets; nunca client bundle/repo/logs |
| Affiliate | Disclosure claro; respetar terms por programa; sponsored etiquetado |
| Ads | Content-first; no ads en auth/admin/low-value/unreviewed auto-generated |
| Privacy | Consent/cookies según jurisdicción; data minimization; deletion/export process |
| Content | Fuentes, timestamps, correction policy, no fabricated testing/reviews |
| AI | Provenance, review state, prompt/model version, no blind publish |
| Uploads | Mime/type/size validation, signed URLs, malware risk considerado |
| Dependencies | Lockfile, automated updates, vulnerability scans, review major upgrades |
| Backups | Automated backups + restore drill documentado |

## 15. Seed editorial inicial (Fase 6A/6B/6C — no ahora)

| Vertical | Commercial seed | Support seed | Tool | Objetivo |
|---|---|---|---|---|
| Software/AI | 12–18 money pages | 10–15 support | 1–2 | Validar affiliate CTR/EPC y comparators |
| Travel | 10–15 money pages | 10–15 destination/support | 1 | Validar social/search + travel affiliate |
| Consumer Tech | 12–18 money pages | 8–12 support/deals | 1 | Validar short-form→commerce |

Pipeline de producción: `Research → Source Capture → Brief → Draft → Fact Check → Editorial/UX Review → Monetization Policy Review → Publish → Measure → Refresh/Improve/Prune`. Ninguna página monetizada con ads puede depender de publicación automática sin revisión/curación humana (R2).

## 16. Referencias verificadas (7 de agosto de 2026)

- R1/R2/R3 — Google AdSense / Publisher Policies (low-value content, ads vs. publisher-content, compliance)
- R4/R5 — Supabase Docs (Cron, Queues + Edge Functions)
- R6 — Vercel Preview Deployments
- R7 — GitHub Docs (protected branches / required status checks)
- R8 — HubSpot Affiliate Program
- R9 — Tripadvisor Affiliate Program
- R10 — OpenAI Codex CLI Getting Started
- R11 — Anthropic Claude Code GitHub Actions
- R12 — OpenAI Codex AGENTS.md documentation
- R13 — Anthropic Claude Code project memory / CLAUDE.md

**Nota**: condiciones de afiliación, publicidad y APIs pueden cambiar. La Fase 0 debe revalidar programas, términos y políticas antes de implementación/activación.

## 17. Definition of Done del proyecto MVP

- [ ] Fases 0–11 CLOSED con reportes/auditorías archivados
- [ ] Los tres verticales operativos y medidos por separado
- [ ] Admin/User auth y RLS con pruebas negativas superadas
- [ ] Product Intelligence y Content Workflow conservan fuentes/históricos
- [ ] Affiliate clicks/revenue y ad data reconciliables
- [ ] ROE v1 activo con guardrails, sin manipular ranking editorial
- [ ] Dashboard muestra RPS/R1K por vertical, página, producto y canal
- [ ] SEO/GEO/AEO foundation implementada y auditable
- [ ] 0 Critical/High findings abiertos
- [ ] Backup/restore evidence y runbook de incidentes
- [ ] Gate 10K con datos suficientes para GO/PIVOT/STOP
- [ ] MASTER_BACKLOG.md refleja exactamente lo pendiente, sin tareas "perdidas"
