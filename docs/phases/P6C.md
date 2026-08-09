# Fase 6C — Consumer Tech & Smart Home

Fuente: `docs/PROJECT_BLUEPRINT.md` §3 (Nicho C), §11 y §15; `docs/CONTENT_POLICY.md`; `docs/MONETIZATION_POLICY.md`. Iniciada 2026-08-09, después de los verticales Software/AI (6A) y Travel (6B), conforme a ADR-007.

## Scope verificable de esta iteración

- **621 — Taxonomía**: se habilitan las siete categorías especificadas en el blueprint: Smart home, Networking, Audio, Monitors, Accessories, Home office y Creator gear. `creator-gear` completa la categoría que el shell de Fase 3 todavía no exponía.
- **621/622 — Catálogo de Networking**: se siembran tres sistemas mesh reales de tres proveedores (eero 7, Google Nest Wifi Pro y TP-Link Deco BE63). Solo los precios que se pudieron contrastar en la página oficial del fabricante se muestran como precios; las especificaciones mantienen URL de fuente, fecha de comprobación y confianza.
- **622 — Commerce templates**: las páginas genéricas de categoría y producto se reutilizan para el catálogo real. Se agrega una ruta de ofertas que solo consulta precios `sale` vigentes.
- **623 — Product Finder**: `Mesh Wi-Fi Finder` permite filtrar el catálogo por Wi-Fi 7, Ethernet multi-gig y hub de hogar inteligente. Es un filtro de requisitos publicados, no un ranking editorial ni una promesa de rendimiento.
- **624 — Expiración de ofertas**: todo precio `sale` requiere `expires_at`; la política RLS de lectura pública y las consultas de catálogo excluyen automáticamente una oferta vencida o inválida sin vencimiento. No se actualiza ni borra el historial. La comprobación queda acompañada de una prueba reproducible contra Supabase tras aplicar la migración aprobada. No se introduce un cron prematuro: las operaciones programadas siguen siendo responsabilidad de Fase 9.
- **625 — Contenido**: se prepara una comparativa de especificaciones, con fuentes oficiales y metodología explícita, en `pending_editorial_review`. No se aprueba ni publica automáticamente (ADR-005).

## Límites explícitos

- El target del blueprint de 12–18 páginas comerciales y 8–12 guías/deals no se pretende completar en una sola iteración. Se entrega un slice verificable de Networking; las demás categorías se mantienen como trabajo editorial posterior.
- No se afirma testing físico, cobertura real ni rendimiento medido. La herramienta y la comparación usan únicamente especificaciones que publican los fabricantes.
- No se activan programas de afiliados ni enlaces de afiliado. Los enlaces siguen siendo directos a los proveedores hasta que exista aprobación formal de los programas (misma restricción que 608/618).
- La migración de schema no se aplica directamente al proyecto compartido desde esta rama, de acuerdo con ADR-012. Requiere PR, revisión independiente y aplicación posterior al merge.

## Criterios de aceptación de la iteración

- [ ] Las 7 categorías están visibles bajo `/consumer-tech` y en Discover en los 5 locales.
- [ ] El catálogo Networking muestra los tres productos con fuentes y fechas verificables.
- [ ] El finder cambia los resultados al seleccionar requisitos y no presenta su resultado como ranking.
- [ ] Los precios de oferta vencidos no son legibles por `anon` ni aparecen en las consultas públicas.
- [ ] La comparativa queda en revisión editorial, sin publicación automática.
- [ ] `typecheck`, `lint` y las pruebas aplicables pasan antes de solicitar revisión.
