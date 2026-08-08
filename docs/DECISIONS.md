# DECISIONS.md — Architecture Decision Records

Fuente: ADR-001 a ADR-008 provienen del blueprint original (`.docx`, sección "Decisiones arquitectónicas iniciales"). ADR-009 es una decisión tomada dentro de este proyecto (ver "Detalle" más abajo). Registro append-only: nunca se borra una decisión, se supera con un nuevo ADR que referencia al anterior.

| ADR | Decisión | Estado |
|---|---|---|
| ADR-001 | Un núcleo multi-property en lugar de tres proyectos aislados. | ACCEPTED |
| ADR-002 | Next.js + TypeScript como aplicación principal sobre Vercel. | ACCEPTED |
| ADR-003 | Supabase Postgres/Auth/Storage/RLS como data core. | ACCEPTED |
| ADR-004 | ROE (Revenue Optimization Engine) separado de Product Quality Score. | ACCEPTED |
| ADR-005 | No auto-publicación monetizada sin revisión/curación humana. | ACCEPTED |
| ADR-006 | Review cruzado Codex↔Claude Code + CI determinístico obligatorio. | ACCEPTED |
| ADR-007 | Lanzamiento vertical por oleadas, no simultáneo masivo (Software/AI → Travel → Consumer Tech). | ACCEPTED |
| ADR-008 | Paid acquisition solo con unit economics positivos; no AdSense arbitrage. | ACCEPTED |
| ADR-009 | Nombre comercial de la plataforma: **Decidero** (provisional). | ACCEPTED — PROVISIONAL, sujeto a cambio |
| ADR-010 | Un solo proyecto Supabase (con Database Branching vía GitHub) en lugar de 3 proyectos separados dev/staging/prod. | ACCEPTED |
| ADR-011 | Control de compensación para revisión de PRs mientras exista una sola cuenta con acceso al repo (excepción explícita a ADR-006). | ACCEPTED — TEMPORAL, con disparador de revisión |
| ADR-012 | Corrección de ADR-010: Database Branching requiere plan Pro de Supabase (el proyecto está en FREE) — migraciones se aplican directo al proyecto único vía PR + CLI, sin preview DB por ahora. | ACCEPTED |

## Detalle

### ADR-001 — Núcleo multi-property
**Contexto**: se necesitan 3 verticales con economías distintas (Software/AI, Travel, Consumer Tech) sin triplicar infraestructura.
**Decisión**: un solo backend/admin, verticales identificadas por `site_id`/`niche_id`, con posibilidad de rutas/subdominios/dominios independientes por vertical.
**Consecuencia**: toda tabla monetizable debe incluir `site_id`/`niche_id` (regla de datos, ver `PROJECT_CHARTER.md`).

### ADR-002 — Next.js + TypeScript sobre Vercel
**Estado**: ACCEPTED (confirmado al cierre de Fase 0, 2026-08-07). Es el stack recomendado por el blueprint original; no se evaluaron alternativas formalmente (no se identificó ningún requisito del proyecto — SSR/ISR editorial, ecosistema de comparadores, integración nativa con Vercel/Supabase — que lo desaconsejara), por lo que se confirma sin bloquear el inicio de Fase 1.

### ADR-003 — Supabase como data core
**Decisión**: Postgres + Auth + Storage + RLS + Edge Functions + Cron + Queues, todo dentro de Supabase.
**Razón**: fuente única de verdad relacional, RLS server-side obligatorio (no solo ocultar UI), jobs recurrentes nativos (R4, R5).

### ADR-004 — ROE separado del Quality Score
**Decisión**: el Revenue Optimization Engine decide mezcla de monetización (placement/CTA); el Quality Score decide ranking editorial. Son señales independientes — firewall editorial no negociable.
**Razón**: evitar que la comisión de afiliado más alta distorsione la recomendación al usuario (riesgo identificado en pre-mortem).

### ADR-005 — No auto-publicación sin revisión humana
**Decisión**: ningún contenido monetizado con ads puede publicarse por pipeline AI sin aprobación humana.
**Razón**: política de Google sobre contenido automático no revisado (R2); riesgo de policy violation y de contenido genérico de baja calidad.

### ADR-006 — Review cruzado Codex↔Claude + CI determinístico
**Decisión**: el autor de un cambio nunca es su único auditor. GitHub debe exigir status checks determinísticos antes de merge (R7). Una revisión de AI es evidencia auxiliar, no sustituto de tests.
**Razón**: mitigar el riesgo de pre-mortem "AI introduce errores de código" mediante independencia estructural.

### ADR-007 — Lanzamiento por oleadas
**Decisión**: Software/AI primero (validar tracking/monetización) → Travel segundo (validar volumen/social) → Consumer Tech tercero (validar commerce + short-form).
**Razón**: mitigar el riesgo "dilución por 3 nichos" — evitar que cada vertical quede superficial por falta de foco.

### ADR-008 — Paid acquisition disciplinado
**Decisión**: Google/Meta/TikTok Ads solo cuando expected contribution margin > CAC. Nunca para arbitraje de AdSense.
**Razón**: sostenibilidad económica; evitar quemar presupuesto en tráfico que no cubre su propio costo.

### ADR-009 — Nombre comercial: Decidero (provisional)
**Contexto**: el blueprint original indica "Nombre comercial: pendiente de definir". Se investigaron 11 candidatos por screening informal de conflictos (empresas/marcas/dominios existentes en espacios de reviews, SaaS, comparadores, travel, marketing). `Decidero` resultó ser el candidato sin conflicto comercial detectado, alineado con el posicionamiento de "plataforma de decisión/comparación".

**Decisión**: se adopta **Decidero** como nombre comercial de trabajo para poder avanzar con el proyecto. Se marca **PROVISIONAL** porque:
- No se ha hecho una búsqueda formal de marca (USPTO TESS / EUIPO / registros nacionales) — solo screening informal por búsqueda web.
- No se ha verificado disponibilidad real de dominio en un registrador.
- El propietario funcional puede decidir cambiarlo más adelante (rebranding).

**Consecuencia obligatoria — el sistema debe soportar un rename sin fricción**:
- El nombre de marca (`Decidero`) **nunca se hardcodea** disperso en código, UI strings, metadata SEO, seeds de base de datos o nombres de servicios/paquetes internos. Vive en un único punto de configuración (branding config) desde el inicio de Fase 1.
- El slug técnico del repositorio/carpeta (`jprs-monetization-platform`) es intencionalmente distinto del nombre comercial — no se renombra el repo cada vez que cambie la marca.
- `site_id`/`niche_id` y demás identificadores de datos son slugs técnicos estables, no derivados del nombre comercial.
- Dominio, logos, metadata OG y legal (Terms/Privacy) deben quedar identificados como "brand-dependent assets" fáciles de sustituir — se documentará como tarea técnica explícita en Fase 1 (ver `MASTER_BACKLOG.md`, ID 108).

**Acción pendiente antes de Fase 11 (launch)**: búsqueda formal de marca + registro de dominio + confirmación final del propietario funcional. Si el nombre cambia, este ADR se supera con un ADR nuevo (nunca se edita este registro retroactivamente).

### ADR-010 — Un solo proyecto Supabase con Database Branching
**Contexto**: el blueprint original pedía "Crear proyectos Supabase dev/staging/prod o estrategia equivalente de environments" (backlog 103). Al crear el proyecto Supabase (`jprs-monetization-platform`, región US East/N. Virginia, con "Automatically expose new tables" desactivado y "Enable automatic RLS" activado) se conectó GitHub directamente, lo que habilita **Database Branching**: cada rama/PR de git puede generar una rama de base de datos aislada (schema + datos propios), construida a partir de `supabase/migrations/`, análoga a los Preview Deployments de Vercel.

**Decisión**: usar **un solo proyecto Supabase** como entorno único, con Database Branching como mecanismo de aislamiento por rama/PR, en lugar de mantener 3 proyectos Supabase separados y sincronizados manualmente.

**Consecuencias**:
- El proyecto Supabase conectado a GitHub actúa como la base de datos de producción (rama principal).
- Ramas/PRs pueden obtener su propia base de datos de preview vía branching, en vez de compartir un único ambiente de "staging" persistente.
- `supabase/migrations/` es la única fuente de verdad del schema — nunca se edita el schema manualmente desde el dashboard en producción.
- Reduce costo y complejidad operativa frente a mantener 3 proyectos sincronizados a mano.
- Riesgo aceptado: no existe un "staging" persistente y estable, solo branches temporales. Si más adelante se necesita un ambiente de staging de larga duración (por ejemplo, para QA manual sostenido), se revisará esta decisión con un ADR nuevo — no se reinterpreta este registro.
- Ninguna migración se aplica directamente contra el proyecto de producción sin pasar por PR + revisión, consistente con la regla de `main` protegida (ADR de branch protection, backlog 105).

### ADR-011 — Control de compensación para revisión de PRs (excepción explícita a ADR-006)
**Contexto**: la auditoría independiente de cierre de Fase 1 (`docs/audits/P1_AUDIT.md`) encontró que los primeros 2 PRs mergeados a `main` se auto-aprobaron sin revisión real — la checkbox "Revisión independiente de otro agente/persona" quedó sin marcar en ambos, y aun así se mergearon. Causa raíz: `digitalconnectdr` es la única cuenta con acceso de escritura al repositorio. GitHub no permite que el autor de un PR apruebe su propio PR para satisfacer un `required_approving_review_count`, así que exigir 1 aprobación humana bloquearía por completo la capacidad de mergear nada mientras exista una sola cuenta.

**Decisión**: mientras `digitalconnectdr` sea la única cuenta con acceso de escritura al repo:
- `required_approving_review_count` se mantiene en **0** (no se puede subir sin agregar una segunda cuenta revisora).
- `enforce_admins` se activa en **true** — ni el admin puede saltarse el check de CI requerido ni hacer force-push, aunque no haya revisión de PR.
- **Control de compensación obligatorio**: todo PR que toque áreas de riesgo (Auth, RBAC, RLS, secrets, monetización/affiliate — coincide con la matriz de independencia de `PROJECT_BLUEPRINT.md` §10.1) debe llevar adjunto, antes de mergear, un reporte de auditoría de un agente independiente (mismo patrón usado para cerrar Fase 0 y Fase 1), documentado en `docs/audits/`. Esto sustituye la aprobación humana de GitHub, no la reemplaza formalmente — es la mejor aproximación disponible a "el autor nunca es su único auditor" (ADR-006) dado el contexto real de un solo operador.
- Los PRs que no tocan áreas de riesgo (solo documentación, config no sensible) pueden mergearse sin auditoría de agente adjunta, pero siempre con `enforce_admins`+CI en verde como mínimo.

**Disparador de revisión de este ADR**: en cuanto se agregue una segunda cuenta con acceso de escritura al repo (humana o de otro agente con credenciales propias), o al iniciar Fase 2 (Auth/RBAC/RLS) como mínimo, se debe revisar si subir `required_approving_review_count` a 1+ es ya viable y deseable. Este ADR se supera con uno nuevo si la decisión cambia — nunca se edita retroactivamente.

**Consecuencia inmediata**: los PRs de Fase 1 que corrigen los hallazgos de esta misma auditoría (F-03 a F-08) se consideran de bajo riesgo (documentación + config no sensible), no requieren un segundo reporte de auditoría adjunto.

**Revisión al inicio de Fase 2 (2026-08-08)**: se cumplió el disparador de revisión. `digitalconnectdr` sigue siendo la única cuenta con acceso de escritura al repo — no cambió nada respecto al contexto original. Se mantiene el control de compensación sin modificaciones: los PRs de Fase 2 (Auth/RBAC/RLS, la zona de mayor riesgo del proyecto) llevan auditoría de agente independiente obligatoria adjunta antes de mergear, sin excepción.

### ADR-012 — Corrección de ADR-010: Database Branching no está disponible en el plan actual
**Contexto**: al iniciar Fase 2 y vincular el CLI de Supabase al proyecto (`supabase link`), se intentó crear una branch de prueba para validar el flujo de preview-por-PR descrito en ADR-010. La API de Supabase respondió: `402 — "Branching is supported only on the Pro plan or above"`. El proyecto (`jprs-monetization-platform`, organización `DigitalConnectDR`) está en el plan **FREE**. ADR-010 asumió disponibilidad de branching porque GitHub estaba conectado al crear el proyecto, sin verificar el plan — esa verificación no se hizo en su momento y resultó ser necesaria.

**Decisión**: mientras el proyecto esté en plan FREE, las migraciones de `supabase/migrations/` se revisan en PR como código SQL (sin preview DB real) y se aplican directamente al único proyecto Supabase (`supabase db push`) después de mergear a `main`, no antes. Riesgo aceptado explícitamente por el propietario funcional: no hay datos reales de usuarios todavía, por lo que aplicar migraciones directo al proyecto único es de bajo riesgo en esta etapa.

**Consecuencias**:
- No se puede probar una migración contra una base de datos aislada antes de mergear — la revisión de PR (SQL + auditoría de agente para PRs de riesgo, ver ADR-011) es el único control antes de aplicar.
- Alternativa disponible sin costo: Supabase local vía Docker (`supabase start`) para probar antes de aplicar — no se usa por defecto en Fase 2 (Docker Desktop no estaba corriendo al tomar esta decisión), pero queda disponible si se necesita mayor confianza antes de una migración particularmente riesgosa.
- Todas las referencias a "Database Branching" en `PROJECT_BLUEPRINT.md`, `docs/phases/P1_REPORT.md` y `MASTER_BACKLOG.md` (ítem 103) deben leerse con esta corrección — el mecanismo de aislamiento real hoy es "un solo proyecto, migraciones directas post-merge", no branching automático.
- Este ADR no revierte ADR-010 en su decisión principal (un solo proyecto Supabase en vez de 3) — solo corrige el mecanismo de aislamiento por rama, que no está disponible.

**Disparador de revisión**: si se decide subir a plan Pro de Supabase (decisión de costo del propietario funcional), este ADR se supera con uno nuevo que reactive el flujo de branching descrito originalmente en ADR-010.
