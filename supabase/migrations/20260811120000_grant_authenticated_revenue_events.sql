-- Backlog 409: hallazgo real durante la primera sesión autenticada real contra el
-- proyecto (hasta ahora, todas las queries de dev/test usaban service_role o anon).
-- revenue_events tiene una policy RLS correcta (revenue_events_super_admin_select,
-- Fase 5) pero el GRANT de tabla a `authenticated` nunca se agregó — a diferencia de
-- roe_scores (misma fase, sí lo tiene). Postgres deniega en la capa de GRANT antes de
-- evaluar RLS, así que la policy nunca era alcanzable para un usuario real logueado.
-- Mismo patrón de "GRANT ausente detectado solo con una sesión autenticada real" que
-- motivó backlog 411 (revisión sistemática pendiente de Fases 2/4).
grant select on public.revenue_events to authenticated;
