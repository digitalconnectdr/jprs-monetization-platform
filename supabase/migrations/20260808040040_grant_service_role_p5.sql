-- GRANT explícito a service_role para las tablas nuevas de Fase 5 — desde el día uno
-- (como en Fase 4), y **sin UPDATE en las tablas append-only** desde el día uno
-- (lección de F-05, docs/audits/P4_AUDIT.md: en Fase 4 el GRANT ALL inicial le dio a
-- service_role la capacidad de sobrescribir histórico, y hubo que revocarlo después de
-- la auditoría). affiliate_terms/affiliate_offers/affiliate_clicks/roe_scores/
-- lead_revenue/revenue_events son append-only — service_role solo recibe
-- select/insert/delete, nunca update.

grant all on public.affiliate_programs, public.affiliate_links to service_role;
grant select, insert, delete on public.affiliate_terms, public.affiliate_offers, public.affiliate_clicks to service_role;
grant execute on function public.record_affiliate_click(text, uuid, text, uuid, uuid, text, text, text) to service_role;

grant all on public.ad_slots, public.monetization_rules, public.sponsored_campaigns, public.sponsorship_placements to service_role;
grant select, insert, delete on public.roe_scores to service_role;

grant all on public.lead_forms, public.lead_routes, public.lead_submissions to service_role;
grant select, insert, delete on public.lead_revenue to service_role;

grant select, insert, delete on public.revenue_events to service_role;
grant execute on function public.import_revenue_events(jsonb) to service_role;
