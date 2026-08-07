# MONETIZATION_POLICY.md

Fuente: [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md) §2, §6, §13. Aplica a todos los verticales y debe traducirse en requisitos técnicos verificables por A7 (Monetization & Policy) en cada auditoría de fase.

## 1. Capas de monetización y orden de activación

| Capa | Momento de activación | Función | Condición de activación |
|---|---|---|---|
| Display Ads / AdSense | MVP | Monetización residual de contenido informativo | Sitio aprobado por Google; nunca en páginas low-value/auto-generadas sin revisión |
| Affiliate | MVP | Comisión por clic/registro/venta | Programa aprobado, terms almacenados y validados |
| Lead Generation | MVP controlado | Formularios en verticales de alto valor por lead | Solo donde exista evidencia de valor por lead calificado |
| Sponsored placements | Post-tracción | Posiciones patrocinadas | Nunca antes de tener tráfico suficiente; siempre etiquetado |
| Vendor subscriptions | 100K+ sesiones | Perfil reclamado, analytics, promociones | Requiere demanda demostrable de vendors |
| Newsletter sponsorship | Con audiencia propia | Monetiza distribución directa | Requiere base de suscriptores activa |
| Data / Intelligence | Escala | Reportes/tendencias/benchmarks | Requiere volumen de datos suficiente |

## 2. Editorial firewall (regla no negociable)

- Quality Score decide la recomendación editorial. Monetization Score decide *placement*/CTA dentro de límites permitidos — **nunca** el ranking.
- El ROE (Revenue Optimization Engine) optimiza mezcla de monetización, no orden de recomendación.
- Cada regla o experimento del ROE debe registrar versión, autor, fecha y resultado (audit trail).
- A/B testing permitido solo sobre layout/CTA/placement — nunca para manipular clics o incentivar interacción con ads.

## 3. Reglas por programa de afiliados

- Cada programa almacena: link format, allowed traffic, política de paid search, trademark bidding, coupon/deep-link rules.
- No se solicitan ni activan programas de afiliados masivamente antes de que existan Fase 4 (CMS/Product Intelligence) y Fase 5 (Monetization & Attribution), y la web tenga calidad suficiente para aprobación (ADR seed, blueprint §19).
- Multi-program por categoría cuando sea posible, para reducir riesgo de concentración (mitigación de pre-mortem "afiliados no aprobados/cambian terms").
- Revenue concentration por merchant/program debe medirse desde Fase 7 (dashboard) y limitarse en Fase 12 (Gate 100K).

## 4. Reglas de AdSense / Ads

- Content-first: nunca más ads/promoción que contenido publisher (referencia R1).
- Sin ads en: login, admin, páginas vacías, contenido low-value, contenido automático no revisado/curado (referencia R2).
- Policy preflight obligatorio antes de activar ads en un vertical nuevo (Fase 10).
- Ads mínimos en money pages de alto valor de afiliado, para no canibalizar conversión (mitigación pre-mortem "ads dañan conversión").

## 5. Leads

- Solo se activan formularios de lead en verticales/categorías donde exista evidencia de alto valor por lead calificado.
- Todo lead debe tener routing y qualified rate medibles (`lead_forms`, `lead_submissions`, `lead_routes`, `lead_revenue`).
- PII de leads: minimización, retención con política definida, protegida por RLS (ver también Fase 2/RBAC).

## 6. Sponsored placements

- Nunca se activa antes de tener tracción (post-MVP, evidencia de tráfico/calidad).
- Siempre visualmente separado del contenido editorial y etiquetado sin ambigüedad ("Sponsored").
- Comisión o pago de patrocinio nunca compra ranking editorial (regla compartida con affiliate firewall).

## 7. Requisitos técnicos derivados (para Fase 5)

- `affiliate_programs`, `affiliate_offers`, `affiliate_links`, `affiliate_terms`, `affiliate_clicks` con `click_id` idempotente — sin duplicación de clics.
- `ad_slots`, `monetization_rules` por page type — nunca en páginas prohibidas por policy interna.
- `sponsored_campaigns`, `sponsorship_placements` con etiquetado obligatorio en UI.
- `revenue_events` reconciliables contra imports de prueba (afiliados/ads).
- Disclosure de afiliación visible próximo a recomendaciones monetizadas (componente de confianza obligatorio, ver `CONTENT_POLICY.md`).

## 8. Compliance y seguridad relacionada con monetización

| Área | Requisito mínimo |
|---|---|
| Secrets | Solo Vercel/Supabase secrets; nunca en client bundle, repo o logs |
| Affiliate | Disclosure claro; respetar terms por programa; sponsored etiquetado |
| Ads | Content-first; no ads en auth/admin/low-value/unreviewed auto-generated |
| Privacy | Consent/cookies según jurisdicción; data minimization; deletion/export process |

## 9. Criterios de auditoría (A7 — Monetization & Policy)

- [ ] Clics no se duplican (idempotencia por `click_id`/`event_id`)
- [ ] No hay ads en páginas prohibidas por esta policy
- [ ] Revenue reconcilia con import de prueba
- [ ] Disclosure de afiliación visible en todas las páginas comerciales
- [ ] Sponsored siempre separado visualmente del ranking editorial
- [ ] Ningún programa de afiliados activo sin `terms` registrados y validados

## 10. Referencias

R1 — Google Publisher Policies (more ads than publisher-content) · R2 — Google Publisher Policies (low-value/auto-generated content) · R3 — Google AdSense compliance · R8 — HubSpot Affiliate Program · R9 — Tripadvisor Affiliate Program. Ver listado completo en `PROJECT_BLUEPRINT.md` §15. Estas condiciones deben revalidarse en Fase 0/pre-activación porque pueden cambiar.
