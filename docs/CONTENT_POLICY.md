# CONTENT_POLICY.md

Fuente: [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md), secciones "Experiencia pública y diseño", "Sistema de agentes AI y control de fases" y "Seed editorial inicial". Aplica a todo contenido publicado en cualquier vertical. Auditado por A6 (Search/Content Reviewer) en cada cierre de fase relevante.

## 1. Principio editorial

La plataforma se presenta como "plataforma de información y decisión", no "blog de afiliados". Se evita el patrón visual/editorial típico de contenido generado por AI sin curación: hero gigante sin sustancia, listas genéricas sin evidencia, comparativas sin datos propios.

## 2. Componentes de confianza obligatorios (toda página comercial)

- [ ] Metodología visible de evaluación y scoring
- [ ] Fecha "Última revisión" y changelog en páginas críticas
- [ ] Disclosure de afiliación próximo a recomendaciones monetizadas
- [ ] Fuentes citadas cuando se afirmen precios, especificaciones o condiciones
- [ ] Separación visual clara entre "Sponsored" y ranking editorial
- [ ] Pros/cons y casos donde NO se recomienda un producto

## 3. Reglas de datos y freshness

- Todo precio, comisión o claim de producto requiere `source`, `checked_at` y `confidence/status`.
- No se sobrescriben históricos: precios, comisiones y métricas se guardan como series temporales.
- Freshness SLA por tipo de dato — páginas/productos críticos deben revisarse dentro de su ventana definida (medido como KPI, ver `KPI_TREE.md`).
- Contenido que caduca (deals, precios estacionales) debe expirar automáticamente, no quedar visible como vigente.

## 4. Workflow de contenido

Estados: **Draft → Review → Approved → Published → Needs Update**.

Pipeline de producción (seed editorial, Fase 6A/6B/6C):
```
Research → Source Capture → Brief → Draft → Fact Check →
Editorial/UX Review → Monetization Policy Review → Publish →
Measure → Refresh / Improve / Prune
```

**Regla no negociable (ADR-005)**: ninguna página monetizada con ads servidos por Google puede depender de publicación automática sin revisión/curación humana — la política de Google sobre inventario de bajo valor menciona expresamente contenido generado automáticamente sin revisión (referencia R2).

## 5. Reglas por tipo de página (clasificación de intención)

| Tipo de página | Prioridad editorial |
|---|---|
| Informativa | Retención + siguiente paso; ads permitidos |
| Tutorial | Resolver tarea y recomendar herramientas contextualizadas |
| Review | Foco en affiliate/conversión, siempre con pros/cons |
| Comparación | Decisión comercial; máxima exigencia de evidencia y fuentes |
| Deal/Oferta | Conversión; evitar distracciones; expiración obligatoria |
| Tool/Calculator | Resultado útil + CTA relevante |

## 6. Prohibiciones explícitas

- No contenido fabricado presentado como testing/review propio sin haberlo realizado (ver nota de Nicho C sobre metodología basada en specs mientras no exista capacidad de testing físico).
- No auto-publicación de contenido AI sin estado de revisión y provenance (prompt/model/version registrados).
- No ranking editorial influenciado por comisión de afiliado.
- No "thin affiliate content" (páginas sin valor propio más allá del enlace de afiliado) — criterio de aceptación explícito en Fase 6A.
- No indexación accidental de páginas admin/drafts (control técnico, auditado por A6 en Fase 8).

## 7. Accesibilidad y presentación (WCAG AA baseline)

- Teclado, foco, contraste, labels, alt text, reduced motion.
- Mobile-first real; tablas con patrones responsivos diseñados, no scroll horizontal indiscriminado.
- Animación limitada a microinteracciones y transiciones de estado — nada que perjudique CLS o distraiga de la conversión.

## 8. Corrección y transparencia

- Política de corrección de errores factuales debe existir y ser pública (página "Editorial Policy").
- Cambios sustantivos en recomendaciones/rankings se reflejan en el changelog de la página.

## 9. Criterios de auditoría (A6 — Search/Content Reviewer)

- [ ] Cada página aporta valor propio verificable (no thin affiliate)
- [ ] Fuentes y `checked_at` presentes en todo claim de precio/especificación
- [ ] Contenido distingue hechos estables vs. datos que caducan
- [ ] Disclosure de afiliación visible
- [ ] Deals/ofertas expiran automáticamente
- [ ] No hay contenido auto-generado sin revisión humana publicado con ads activos

## 10. Referencias

R1 — Google Publisher Policies (more ads than publisher-content) · R2 — Google Publisher Policies (low-value/auto-generated content) · R3 — Google AdSense compliance. Ver `PROJECT_BLUEPRINT.md` §15 para el listado completo.
