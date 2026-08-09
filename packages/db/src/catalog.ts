import type { SupabaseClient } from "@supabase/supabase-js";

export type CategorySummary = { id: string; slug: string; name: string };

export type LatestPrice = {
  amount: number;
  currency: string;
  priceType: string;
  checkedAt: string;
  source: string;
  expiresAt: string | null;
};

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  vendorName: string | null;
  vendorWebsiteUrl: string | null;
  latestPrice: LatestPrice | null;
};

export type ProductFeatureRow = {
  featureKey: string;
  featureValue: string;
  source: string;
  checkedAt: string;
  confidence: string;
};

export type ProductDetail = ProductSummary & {
  features: ProductFeatureRow[];
};

export type ProductDeal = ProductSummary & {
  categorySlug: string;
  latestPrice: LatestPrice & { expiresAt: string };
};

async function getSiteId(client: SupabaseClient, siteSlug: string): Promise<string | null> {
  const { data } = await client.from("sites").select("id").eq("slug", siteSlug).maybeSingle();
  return data?.id ?? null;
}

async function getCategoryId(client: SupabaseClient, nicheId: string, categorySlug: string): Promise<string | null> {
  const { data } = await client
    .from("categories")
    .select("id")
    .eq("niche_id", nicheId)
    .eq("slug", categorySlug)
    .maybeSingle();
  return data?.id ?? null;
}

async function getSiteNicheId(client: SupabaseClient, siteSlug: string): Promise<{ siteId: string; nicheId: string } | null> {
  const { data } = await client.from("sites").select("id,niche_id").eq("slug", siteSlug).maybeSingle();
  if (!data) return null;
  return { siteId: data.id, nicheId: data.niche_id };
}

/** Última fila (mayor checked_at) por product_id — product_prices es append-only, no hay "el" precio salvo por convención de fecha. */
function latestByProductId<T extends { product_id: string; checked_at: string }>(rows: T[]): Map<string, T> {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const existing = latest.get(row.product_id);
    if (!existing || row.checked_at > existing.checked_at) latest.set(row.product_id, row);
  }
  return latest;
}

export async function getCategoriesForNiche(client: SupabaseClient, nicheSlug: string): Promise<CategorySummary[]> {
  const { data: niche } = await client.from("niches").select("id").eq("slug", nicheSlug).maybeSingle();
  if (!niche) return [];
  const { data } = await client
    .from("categories")
    .select("id,slug,name")
    .eq("niche_id", niche.id)
    .order("name");
  return data ?? [];
}

export async function getProductsForCategory(
  client: SupabaseClient,
  siteSlug: string,
  categorySlug: string
): Promise<ProductSummary[]> {
  const siteNiche = await getSiteNicheId(client, siteSlug);
  if (!siteNiche) return [];
  const categoryId = await getCategoryId(client, siteNiche.nicheId, categorySlug);
  if (!categoryId) return [];

  const { data: products } = await client
    .from("products")
    .select("id,slug,name,vendor:vendors(name,website_url)")
    .eq("site_id", siteNiche.siteId)
    .eq("category_id", categoryId)
    .eq("status", "published")
    .order("name");

  if (!products || products.length === 0) return [];

  const productIds = products.map((p) => p.id);
  const { data: prices } = await client
    .from("product_prices")
    .select("product_id,amount,currency,price_type,checked_at,source,expires_at")
    .in("product_id", productIds)
    .or(`price_type.neq.sale,expires_at.gt.${new Date().toISOString()}`)
    .order("checked_at", { ascending: false });

  const latestPrices = latestByProductId(prices ?? []);

  return products.map((p) => {
    const vendor = Array.isArray(p.vendor) ? p.vendor[0] : p.vendor;
    const price = latestPrices.get(p.id);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      vendorName: vendor?.name ?? null,
      vendorWebsiteUrl: vendor?.website_url ?? null,
      latestPrice: price
        ? {
            amount: Number(price.amount),
            currency: price.currency,
            priceType: price.price_type,
            checkedAt: price.checked_at,
            source: price.source,
            expiresAt: price.expires_at,
          }
        : null,
    };
  });
}

export async function getProduct(client: SupabaseClient, siteSlug: string, productSlug: string): Promise<ProductDetail | null> {
  const siteId = await getSiteId(client, siteSlug);
  if (!siteId) return null;

  const { data: product } = await client
    .from("products")
    .select("id,slug,name,vendor:vendors(name,website_url)")
    .eq("site_id", siteId)
    .eq("slug", productSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!product) return null;

  const [{ data: prices }, { data: features }] = await Promise.all([
    client
      .from("product_prices")
      .select("product_id,amount,currency,price_type,checked_at,source,expires_at")
      .eq("product_id", product.id)
      .or(`price_type.neq.sale,expires_at.gt.${new Date().toISOString()}`)
      .order("checked_at", { ascending: false })
      .limit(1),
    client
      .from("product_features")
      .select("feature_key,feature_value,source,checked_at,confidence,product_id")
      .eq("product_id", product.id)
      .order("checked_at", { ascending: false }),
  ]);

  const seenKeys = new Set<string>();
  const latestFeatures: ProductFeatureRow[] = [];
  for (const f of features ?? []) {
    if (seenKeys.has(f.feature_key)) continue;
    seenKeys.add(f.feature_key);
    latestFeatures.push({
      featureKey: f.feature_key,
      featureValue: f.feature_value,
      source: f.source,
      checkedAt: f.checked_at,
      confidence: f.confidence,
    });
  }

  const vendor = Array.isArray(product.vendor) ? product.vendor[0] : product.vendor;
  const price = prices?.[0];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    vendorName: vendor?.name ?? null,
    vendorWebsiteUrl: vendor?.website_url ?? null,
    latestPrice: price
      ? {
          amount: Number(price.amount),
          currency: price.currency,
          priceType: price.price_type,
          checkedAt: price.checked_at,
          source: price.source,
          expiresAt: price.expires_at,
        }
      : null,
    features: latestFeatures,
  };
}

/**
 * Ofertas activas: una sale vencida queda en el ledger para auditoría, pero no puede
 * aparecer al visitante. RLS aplica el mismo filtro para impedir su lectura directa.
 */
export async function getActiveDeals(client: SupabaseClient, siteSlug: string): Promise<ProductDeal[]> {
  const siteNiche = await getSiteNicheId(client, siteSlug);
  if (!siteNiche) return [];

  const { data: products } = await client
    .from("products")
    .select("id,slug,name,category:categories(slug),vendor:vendors(name,website_url)")
    .eq("site_id", siteNiche.siteId)
    .eq("status", "published")
    .order("name");

  if (!products || products.length === 0) return [];

  const productIds = products.map((product) => product.id);
  const { data: prices } = await client
    .from("product_prices")
    .select("product_id,amount,currency,price_type,checked_at,source,expires_at")
    .in("product_id", productIds)
    .eq("price_type", "sale")
    .gt("expires_at", new Date().toISOString())
    .order("checked_at", { ascending: false });

  const latestPrices = latestByProductId(prices ?? []);

  return products.flatMap((product) => {
    const price = latestPrices.get(product.id);
    const category = Array.isArray(product.category) ? product.category[0] : product.category;
    const vendor = Array.isArray(product.vendor) ? product.vendor[0] : product.vendor;
    if (!price?.expires_at || !category?.slug) return [];

    return [
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        categorySlug: category.slug,
        vendorName: vendor?.name ?? null,
        vendorWebsiteUrl: vendor?.website_url ?? null,
        latestPrice: {
          amount: Number(price.amount),
          currency: price.currency,
          priceType: price.price_type,
          checkedAt: price.checked_at,
          source: price.source,
          expiresAt: price.expires_at,
        },
      },
    ];
  });
}
