/** Nota condicional reutilizada en cada módulo del dashboard para documentar, en vez de ocultar, qué datos quedan fuera del alcance real de un rol scoped a un site (RLS). */
export function ScopeNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-md border border-border bg-surface p-3 text-xs text-muted">{children}</p>;
}
