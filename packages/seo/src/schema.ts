import { getSiteUrl } from "./site-url";

/**
 * JSON-LD builders (schema.org) — Fase 8, backlog 803. Cada builder solo incluye
 * campos que tenemos como HECHO real en la base de datos. Nunca se inventan campos
 * "esperados" por rich results (ej. `aggregateRating`/`review`: no hay reseñas reales
 * todavía, así que no aparecen — un Product schema sin rating es válido y honesto,
 * uno con un rating inventado no lo es).
 */

export function organizationSchema(params: { name: string; description: string }) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: params.name,
    url: siteUrl,
    description: params.description,
  };
}

export function websiteSchema(params: { name: string }) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: params.name,
    url: siteUrl,
  };
}

export function breadcrumbListSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * `price`/`priceCurrency` reflejan el último `product_prices` sembrado (source real,
 * ver docs/DATA_DICTIONARY.md) — nunca `availability` (no existe esa señal en el
 * schema de catálogo) ni `aggregateRating` (no hay reseñas reales todavía).
 */
export function productSchema(params: {
  name: string;
  description: string;
  url: string;
  brand: string | null;
  price: number | null;
  priceCurrency: string | null;
  priceValidUntil: string | null;
}) {
  const offers =
    params.price !== null && params.priceCurrency !== null
      ? {
          "@type": "Offer",
          url: params.url,
          price: params.price,
          priceCurrency: params.priceCurrency,
          ...(params.priceValidUntil ? { priceValidUntil: params.priceValidUntil.slice(0, 10) } : {}),
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: params.name,
    description: params.description,
    url: params.url,
    ...(params.brand ? { brand: { "@type": "Brand", name: params.brand } } : {}),
    ...(offers ? { offers } : {}),
  };
}
