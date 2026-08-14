// Types, queries y repositorios sobre Supabase Postgres. Cliente público (solo lectura,
// anon key) desde Fase 6A — wiring de auth/sesión sigue pendiente (backlog 409).
export { createPublicSupabaseClient } from "./client";
export * from "./catalog";
export * from "./content";
export * from "./analytics";
export * from "./admin-analytics";
export * from "./sites";
export * from "./admin-ads";
export * from "./admin-affiliate";
export * from "./admin-products";
export * from "./admin-content";
export * from "./admin-acquisition";
export * from "./admin-operations";
export * from "./admin-users";
