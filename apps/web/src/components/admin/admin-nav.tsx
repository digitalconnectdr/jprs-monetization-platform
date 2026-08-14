"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MODULES: { href: string; label: string }[] = [
  { href: "/admin", label: "Executive" },
  { href: "/admin/ads", label: "Ads" },
  { href: "/admin/affiliate", label: "Affiliate" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/acquisition", label: "Acquisition" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/operations", label: "Operations" },
];

/** KPI_TREE.md §5 — un módulo por tab. `Users` incluye la gestión de roles (backlog 413), visible para todos pero solo editable por super_admin dentro de esa página. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-border" aria-label="Admin sections">
      {MODULES.map((mod) => {
        const isActive = mod.href === "/admin" ? pathname === "/admin" : pathname.startsWith(mod.href);
        return (
          <Link
            key={mod.href}
            href={mod.href}
            className={`rounded-t-md px-3 py-2 text-sm transition-colors duration-fast ${
              isActive ? "border-b-2 border-primary font-semibold text-ink" : "text-muted hover:text-ink"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {mod.label}
          </Link>
        );
      })}
    </nav>
  );
}
