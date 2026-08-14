import type { SupabaseClient } from "@supabase/supabase-js";

export type ProductsSummary = {
  productsByStatus: { status: string; count: number }[];
  productsBySite: { siteId: string; count: number }[];
  productsWithFreshPrice: number;
  productsWithAnyPrice: number;
  productsWithFreshFeatures: number;
  productsWithAnyFeatures: number;
};

/** Última fila (mayor checked_at) por product_id. */
function latestCheckedAtByProduct(rows: { product_id: string; checked_at: string }[]): Map<string, string> {
  const latest = new Map<string, string>();
  for (const row of rows) {
    const existing = latest.get(row.product_id);
    if (!existing || row.checked_at > existing) latest.set(row.product_id, row.checked_at);
  }
  return latest;
}

/**
 * Freshness real (no `freshness_checks`, que es super_admin-only) — calculado sobre
 * `product_prices`/`product_features` (append-only, legibles por cualquier rol),
 * tomando el `checked_at` MÁS RECIENTE por producto (no el promedio de todo el
 * histórico, que subestimaría freshness en productos con muchas filas viejas).
 */
export async function getProductsSummary(client: SupabaseClient): Promise<ProductsSummary> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: products }, { data: prices }, { data: features }] = await Promise.all([
    client.from("products").select("status, site_id"),
    client.from("product_prices").select("product_id, checked_at"),
    client.from("product_features").select("product_id, checked_at"),
  ]);

  const productsByStatus = new Map<string, number>();
  const productsBySite = new Map<string, number>();
  for (const row of products ?? []) {
    productsByStatus.set(row.status, (productsByStatus.get(row.status) ?? 0) + 1);
    productsBySite.set(row.site_id, (productsBySite.get(row.site_id) ?? 0) + 1);
  }

  const latestPriceCheck = latestCheckedAtByProduct(prices ?? []);
  const latestFeatureCheck = latestCheckedAtByProduct(features ?? []);

  return {
    productsByStatus: Array.from(productsByStatus.entries()).map(([status, count]) => ({ status, count })),
    productsBySite: Array.from(productsBySite.entries()).map(([siteId, count]) => ({ siteId, count })),
    productsWithAnyPrice: latestPriceCheck.size,
    productsWithFreshPrice: Array.from(latestPriceCheck.values()).filter((d) => d >= thirtyDaysAgo).length,
    productsWithAnyFeatures: latestFeatureCheck.size,
    productsWithFreshFeatures: Array.from(latestFeatureCheck.values()).filter((d) => d >= thirtyDaysAgo).length,
  };
}
