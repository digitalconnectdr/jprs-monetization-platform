import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentBlockData = {
  blockType: string;
  blockData: Record<string, unknown>;
  sortOrder: number;
};

export type ContentSourceRow = {
  sourceUrl: string;
  sourceLabel: string | null;
  checkedAt: string;
};

export type ContentDetail = {
  id: string;
  slug: string;
  title: string;
  contentType: string;
  blocks: ContentBlockData[];
  sources: ContentSourceRow[];
  linkedProductIds: string[];
};

/** Slugs de contenido published de un site — usado por app/sitemap.ts (Fase 8, backlog 802). */
export async function listPublishedContentSlugs(client: SupabaseClient, siteSlug: string): Promise<string[]> {
  const { data: site } = await client.from("sites").select("id").eq("slug", siteSlug).maybeSingle();
  if (!site) return [];

  const { data } = await client.from("content_items").select("slug").eq("site_id", site.id).eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}

/** Solo lee content_items status=published — coherente con la policy RLS pública (Fase 4). */
export async function getPublishedContentItem(
  client: SupabaseClient,
  siteSlug: string,
  contentSlug: string
): Promise<ContentDetail | null> {
  const { data: site } = await client.from("sites").select("id").eq("slug", siteSlug).maybeSingle();
  if (!site) return null;

  const { data: item } = await client
    .from("content_items")
    .select("id,slug,title,content_type,current_version_id")
    .eq("site_id", site.id)
    .eq("slug", contentSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!item || !item.current_version_id) return null;

  const [{ data: blocks }, { data: sources }, { data: links }] = await Promise.all([
    client
      .from("content_blocks")
      .select("block_type,block_data,sort_order")
      .eq("content_version_id", item.current_version_id)
      .order("sort_order"),
    client
      .from("content_sources")
      .select("source_url,source_label,checked_at")
      .eq("content_version_id", item.current_version_id),
    client.from("content_product_links").select("product_id").eq("content_item_id", item.id),
  ]);

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    contentType: item.content_type,
    blocks: (blocks ?? []).map((b) => ({
      blockType: b.block_type,
      blockData: (b.block_data as Record<string, unknown>) ?? {},
      sortOrder: b.sort_order,
    })),
    sources: (sources ?? []).map((s) => ({
      sourceUrl: s.source_url,
      sourceLabel: s.source_label,
      checkedAt: s.checked_at,
    })),
    linkedProductIds: (links ?? []).map((l) => l.product_id),
  };
}
