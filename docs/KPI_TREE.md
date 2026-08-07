# KPI_TREE.md

Fuente: [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md), secciones "Analytics, atribución y KPIs de decisión" y "Gates económicos" (este archivo es el detalle completo al que remite esa sección — no al revés). KPI de decisión principal: **R1K** (Revenue per 1,000 sessions) y **RPS** (Revenue per Session) — nunca pageviews como métrica de éxito aislada.

## 1. Árbol de KPIs

```
traffic → engagement → commercial intent → revenue → retention
```

| Nivel | KPIs |
|---|---|
| Traffic | Sessions, sessions/source (Search, AI Discovery, Short-form, Long-form, Visual, Communities, Owned, Partnerships, Paid) |
| Engagement | Scroll depth, dwell proxy, compare/save actions, return rate |
| Commercial intent | Product impressions, comparison_add, affiliate CTR, lead_start rate |
| Revenue | RPS, R1K, Affiliate EPC, Affiliate eR1K, Lead eR1K, Ad RPM |
| Retention | Returning users %, newsletter signups, saved products, alerts activos |

## 2. Fórmulas

| KPI | Fórmula / Uso |
|---|---|
| RPS | Revenue / sessions. KPI económico base. |
| R1K | Revenue / sessions × 1000. Comparación entre nichos. |
| Affiliate EPC | Affiliate revenue / affiliate clicks. |
| Affiliate eR1K | Affiliate revenue / sessions × 1000. |
| Lead eR1K | Lead revenue / sessions × 1000. |
| Content ROI | Revenue atribuible / costo de crear + mantener. |
| Return rate | Returning users / users. Reduce dependencia de plataformas externas. |
| Freshness SLA | % de páginas/productos críticos revisados dentro de su ventana. |

## 3. Event taxonomy mínima (soporta el árbol de KPIs)

| Evento | Campos críticos |
|---|---|
| `page_view` | session_id, page_id, site_id, niche_id, source, medium, country, device |
| `product_impression` | product_id, placement, rank, sponsored_flag |
| `affiliate_click` | link_id, product_id, program_id, placement, click_id |
| `comparison_add` | product_id, comparison_id |
| `save_product` | user_id nullable/known, product_id |
| `lead_start` / `lead_submit` | form_id, vertical, source, attribution_id |
| `conversion` | type, partner, click_id/lead_id, amount, currency |
| `ad_revenue_daily` | page/niche/date, impressions, revenue, rpm when available |
| `newsletter_signup` | placement, topic, source |

Todo evento requiere `event_id` idempotente para evitar doble conteo (regla de datos, ver `PROJECT_BLUEPRINT.md`, sección "Modelo de datos y RBAC").

## 4. Gates económicos

### Gate 10K sesiones/mes (Fase 11)

| Métrica | Target inicial | Interpretación |
|---|---|---|
| R1K total | ≥ US$60 | Mínimo para justificar expansión; recalibrar con datos reales |
| Affiliate CTR páginas comerciales | ≥ 3% | Señal de intención/CTA razonable |
| Email/account capture | ≥ 1% | Construcción de audiencia propia |
| Returning users | ≥ 10% | Primer indicio de utilidad repetida |
| Tracking reconciliation | ≥ 98% eventos críticos | No escalar con medición dudosa |
| Critical/High defects | 0 abiertos | Gate técnico |

**Decisión 10K**:
- R1K < US$30 → no ampliar plataforma; corregir monetización/intent o cerrar vertical.
- US$30–60 → pivot/optimización.
- ≥ US$60 → continuar.
- ≥ US$100 → acelerar winners.
- ≥ US$200 → prioridad de inversión (verificando estabilidad y concentración de ingresos).

### Gate 100K (Fase 12)

- Ningún canal debería ser riesgo existencial si cambia algoritmo/policy (dependencia diversificada).
- Expansión basada en R1K, contribution margin, repeat rate y content ROI — no en número de artículos.
- Vendor/Sponsored solo si existe demanda demostrable y tráfico cualificado suficiente.
- Medir revenue concentration por merchant/program; plan de sustitución para partners críticos.

### Gate 1M (Fase 13)

- Datos propios y tendencias deben generar tráfico/menciones sin depender de commodity content.
- Audiencia propia (email/account/direct) debe convertirse en un motor material.
- ROE avanzado debe demostrar uplift medido mediante experimentos, no "optimización" teórica.
- Arquitectura multi-property permite nuevos verticales sin duplicar administración/analytics.

## 5. Dashboard administrativo (a implementar en Fase 7)

| Módulo | Métricas |
|---|---|
| Executive | Revenue total, RPS, R1K, sessions, conversion, returning users, revenue mix |
| Ads | Impressions, RPM, revenue/page, revenue/niche, policy status |
| Affiliate | Clicks, EPC, CR, commissions, reversals, merchant/product/category |
| Products | Views, saves, compare rate, CTR, revenue, margin opportunity, freshness |
| Content | Sessions, search impressions, CTR, assisted revenue, R1K, decay, update queue |
| Acquisition | Google/Bing, AI referrals, TikTok, Meta, YouTube, Pinterest, Reddit, email, direct, referral |
| Users | New/returning, signups, favorites, alerts, cohorts, newsletter |
| Operations | Jobs, sync failures, affiliate program health, stale content, audit findings, open backlog |

## 6. Criterios de auditoría (A8 — Analytics Auditor)

- [ ] Métricas reconciliadas contra raw events (≥98% en eventos críticos)
- [ ] R1K calculable por vertical, página y canal
- [ ] ROE no modifica ranking editorial (verificado junto con A7)
- [ ] Ningún evento crítico carece de `event_id` idempotente
