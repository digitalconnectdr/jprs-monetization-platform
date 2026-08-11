// Types, queries y repositorios sobre Supabase Postgres. Cliente público (solo lectura,
// anon key) desde Fase 6A — wiring de auth/sesión sigue pendiente (backlog 409).
export { createPublicSupabaseClient } from "./client";
export * from "./catalog";
export * from "./content";
export * from "./analytics";
