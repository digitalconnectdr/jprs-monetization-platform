import Link from "next/link";
import { breadcrumbListSchema, getSiteUrl } from "@platform/seo";

export type BreadcrumbItem = { name: string; href: string };

/**
 * Breadcrumb visible + BreadcrumbList JSON-LD (Fase 8, backlog 803/804) — una sola
 * fuente de datos para ambos, en vez de mantener la jerarquía visible y la
 * estructurada por separado. `href` es relativo (incluye el locale, ej. "/en/travel");
 * se resuelve a absoluto para el JSON-LD acá, no en cada page.tsx.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const siteUrl = getSiteUrl();
  const schema = breadcrumbListSchema(items.map((item) => ({ name: item.name, url: `${siteUrl}${item.href}` })));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === items.length - 1 ? (
                <span aria-current="page" className="text-ink">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="underline-offset-2 hover:text-ink hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
