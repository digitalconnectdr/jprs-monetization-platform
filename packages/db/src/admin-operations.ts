import type { SupabaseClient } from "@supabase/supabase-js";

export type OperationsSummary = {
  freshnessByStatus: { status: string; count: number }[];
  staleEntities: { entityType: string; entityId: string; nextCheckDueAt: string | null }[];
};

/**
 * `freshness_checks` es estrictamente `super_admin`-only (Fase 4) para todas las
 * operaciones — un admin/analyst de site ve 0 filas aquí siempre, no solo "hasta que
 * se conecte tráfico" como en otros módulos. "Jobs/sync failures" y "audit
 * findings/open backlog" de KPI_TREE.md §5 no tienen tabla real (viven en
 * docs/MASTER_BACKLOG.md, fuera de Postgres) — no se fabrican aquí.
 */
export async function getOperationsSummary(client: SupabaseClient): Promise<OperationsSummary> {
  const [{ data: checks }, { data: stale }] = await Promise.all([
    client.from("freshness_checks").select("status"),
    client
      .from("freshness_checks")
      .select("entity_type, entity_id, next_check_due_at")
      .in("status", ["due", "stale"])
      .order("next_check_due_at", { ascending: true })
      .limit(20),
  ]);

  const freshnessByStatus = new Map<string, number>();
  for (const row of checks ?? []) {
    freshnessByStatus.set(row.status, (freshnessByStatus.get(row.status) ?? 0) + 1);
  }

  return {
    freshnessByStatus: Array.from(freshnessByStatus.entries()).map(([status, count]) => ({ status, count })),
    staleEntities: (stale ?? []).map((row) => ({
      entityType: row.entity_type,
      entityId: row.entity_id,
      nextCheckDueAt: row.next_check_due_at,
    })),
  };
}
