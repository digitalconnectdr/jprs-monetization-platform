# PROJECT_CHARTER.md — JPRS Digital Connect / Monetization Intelligence Platform

Estado: **Fase 0 en curso** (borrador para aprobación — ver criterios de cierre al final)
Fuente: [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md)

## 1. Propósito

Construir una plataforma multi-vertical que convierte tráfico en ingresos mediante publicidad, afiliación y, progresivamente, leads, patrocinios y servicios para vendors — no un "blog con anuncios", sino un sistema de descubrimiento, comparación y recomendación con optimización de ingresos basada en datos reales por página, producto, fuente de tráfico y modelo de ingreso.

**No es objetivo de la Fase 0**: escribir código de producto, cerrar el nombre comercial de forma definitiva (se adoptó "Decidero" como nombre de trabajo provisional, ver ADR-009), ni contratar/aprobar programas de afiliados. Eso ocurre en fases posteriores (P1+, y solo tras validación de calidad en P4/P5).

## 2. Modelos de ingreso (orden de activación)

1. Display Ads / AdSense — MVP, monetización residual
2. Affiliate — MVP, prioridad en páginas comerciales
3. Lead Generation — MVP controlado, solo verticales de alto valor por lead
4. Sponsored placements — post-tracción, siempre etiquetados y separados del ranking editorial
5. Vendor subscriptions — 100K+ sesiones / validación de demanda
6. Newsletter sponsorship — cuando exista audiencia propia
7. Data / Intelligence — a escala

Reglas técnicas y de compliance detalladas: [MONETIZATION_POLICY.md](MONETIZATION_POLICY.md).

## 3. Límites editoriales (firewall no negociable)

- El **Quality Score** (calidad/utilidad editorial) y el **Monetization Score** (mezcla de ingreso) son señales independientes. La comisión de afiliado nunca determina el ranking editorial.
- "Sponsored" siempre visualmente separado del contenido editorial y etiquetado sin ambigüedad.
- No auto-publicación de contenido monetizado con ads sin revisión/curación humana (ADR-005).
- Todo claim de precio, especificación o condición debe tener fuente y timestamp de verificación (`checked_at`).
- Ninguna página puede tener más ads/promoción que contenido (política AdSense, referencias R1–R3 en el blueprint).

Detalle operativo: [CONTENT_POLICY.md](CONTENT_POLICY.md).

## 4. Los tres verticales MVP — scope y exclusiones

### A. Business Software & AI
- **Scope**: CRM, AI assistants, automation, SEO/marketing software, website/e-commerce, productivity — comparativas, reviews, alternatives, pricing explainers, stack builders.
- **Exclusiones P0–P5**: no hardware enterprise, no servicios de implementación/consultoría propios, no contenido de programación/desarrollo genérico fuera de herramientas SaaS.
- Motor dominante: afiliados + leads. Evidencia: HubSpot 30% recurrente/1 año, cookie 180 días (R8).

### B. Travel & Smart Travel
- **Scope**: hoteles, destinos, itinerarios, eSIM/conectividad, equipaje, travel tech, movilidad local.
- **Exclusiones P0–P5**: no venta directa de vuelos/paquetes propios, no operación de agencia de viajes, no contenido de visas/regulación migratoria como fuente primaria (solo referencia con disclaimer).
- Motor dominante: afiliados + ads. Evidencia: Tripadvisor ≥50% de comisión en hotel click-outs (R9).

### C. Consumer Tech & Smart Home
- **Scope**: smart home, networking, audio, monitors, accessories, home office, creator gear.
- **Exclusiones P0–P5**: no reviews de hardware que requieran testing físico propio en MVP (se declara metodología basada en specs/fuentes verificadas hasta que exista capacidad de testing), no marketplace de reventa.
- Motor dominante: afiliados + social. Control: comisión nunca determina ranking; Sponsored siempre separado.

**Orden de lanzamiento** (por oleadas, no simultáneo): Software/AI → Travel → Consumer Tech. La plataforma debe soportar activar/desactivar verticales sin despliegues especiales (`site_id`/`niche_id`).

**Futuros candidatos, fuera de MVP**: Home Services (leads, requiere validación local/compliance), Education & Careers (affiliate + leads).

**Mecanismo para levantar una exclusión "P0–P5"**: ninguna exclusión se levanta automáticamente al cerrar la Fase 5. Levantar una exclusión (p. ej. empezar a vender vuelos directos, u operar reventa en Consumer Tech) requiere un ADR explícito nuevo en `DECISIONS.md`, aprobado por el propietario funcional, que documente por qué ya no aplica el riesgo/limitación original. Esto evita que un Builder de fases posteriores interprete el cierre de una fase como autorización implícita para expandir scope.

## 5. KPI tree (resumen)

Árbol completo con fórmulas y gates: [KPI_TREE.md](KPI_TREE.md).

`traffic → engagement → commercial intent → revenue → retention`

KPI de decisión principal: **R1K** (Revenue per 1,000 sessions) y **RPS** (Revenue per Session), no pageviews.

## 6. Taxonomía inicial de páginas y eventos (resumen)

**Páginas**: Core (Home, Discover, Search, About/Methodology, Editorial Policy, Affiliate Disclosure, Privacy, Terms) · Vertical (Niche Home, Category, Trends, Deals, Tools) · Commercial (Best X, X vs Y, Alternatives, Review, Product Profile, Buying Guide) · Tools (Finder, Comparator, Calculator, Planner) · Account (Login, Sign up, Dashboard, Saved, Comparisons, Alerts, Preferences).

**Eventos mínimos**: `page_view`, `product_impression`, `affiliate_click`, `comparison_add`, `save_product`, `lead_start`/`lead_submit`, `conversion`, `ad_revenue_daily`, `newsletter_signup`. Taxonomía completa con campos críticos se formaliza como `EVENT_TAXONOMY.md` en Fase 7.

## 7. Backlog P0 y decisiones iniciales

Ver [MASTER_BACKLOG.md](MASTER_BACKLOG.md) (IDs 001–006 son P0) y [DECISIONS.md](DECISIONS.md) (ADR-001 a ADR-008, seed inicial).

## 8. Roles del proyecto

| Rol | Definición |
|---|---|
| Propietario funcional | JPRS Digital Connect |
| Implementación | Codex + Claude Code, con revisión cruzada obligatoria |
| Infraestructura objetivo | Supabase + Vercel + GitHub |
| Frontend recomendado | Next.js + TypeScript, desplegado en Vercel |

## 9. Principio de ejecución

Fases cerradas: **planificar → implementar → probar → auditar → corregir → cerrar → actualizar pendientes**. Nada llega a `main` sin pasar pruebas requeridas, auditoría de fase y checklist de aceptación. El autor de un cambio no puede ser el único auditor (matriz de independencia en el blueprint, §9.3).

## 10. Criterios de aceptación para cerrar Fase 0

- [ ] Cero decisiones críticas sin documentar (ver [DECISIONS.md](DECISIONS.md))
- [ ] Los 3 nichos tienen scope explícito y exclusiones (sección 4 de este documento)
- [ ] Políticas de monetización representadas como requisitos técnicos ([MONETIZATION_POLICY.md](MONETIZATION_POLICY.md))
- [ ] `KPI_TREE.md`, `CONTENT_POLICY.md`, `MASTER_BACKLOG.md`, `DECISIONS.md` existen y están completos
- [ ] **ADR-002 (stack Next.js + TypeScript) confirmado como ACCEPTED** en `DECISIONS.md` — bloqueante explícito: Fase 1 no puede iniciar bootstrap técnico con el stack todavía en estado PROPOSED
- [ ] Auditoría de cierre realizada por A1 (Plan Guardian), A6 (Search/Content), A7 (Monetization & Policy) y A9 (Project Controller)

**Estado actual**: documentos base generados y auditoría independiente de Fase 0 ejecutada (ver `docs/audits/P0_AUDIT.md`). Pendiente: revisión humana/aprobación del propietario funcional — incluida la confirmación explícita de ADR-002 — antes de marcar la fase como CLOSED y proceder a Fase 1 (bootstrap técnico del repositorio).
