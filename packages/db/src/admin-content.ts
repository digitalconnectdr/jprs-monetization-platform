import type { SupabaseClient } from "@supabase/supabase-js";

export type PendingContentRow = {
  contentVersionId: string;
  contentItemId: string;
  title: string;
  siteId: string;
  contentType: string;
  reviewState: string;
  createdAt: string;
};

export type ContentSummary = {
  itemsByStatus: { status: string; count: number }[];
  versionsByReviewState: { reviewState: string; count: number }[];
  pendingEditorialReview: PendingContentRow[];
};

/**
 * Cola real de aprobación editorial (ADR-005) — content_versions en
 * pending_editorial_review, con el título del content_item asociado. Es el mismo
 * contenido que hoy el propietario funcional solo puede ver si el agente se lo
 * describe manualmente; este módulo lo hace visible directamente en el dashboard.
 */
export async function getContentSummary(client: SupabaseClient): Promise<ContentSummary> {
  const [{ data: items }, { data: versions }, { data: pending, error: pendingError }] = await Promise.all([
    client.from("content_items").select("status"),
    client.from("content_versions").select("review_state"),
    client
      .from("content_versions")
      // content_items<->content_versions tiene 2 FKs cruzadas (content_item_id y
      // current_version_id) — PostgREST no puede elegir sola cuál usar para el
      // embed (PGRST201, "more than one relationship was found"); se desambigua con
      // el nombre exacto del constraint many-to-one que sí queremos.
      .select(
        "id, content_item_id, review_state, created_at, content_item:content_items!content_versions_content_item_id_fkey(id,title,site_id,content_type)"
      )
      .eq("review_state", "pending_editorial_review")
      .order("created_at", { ascending: true }),
  ]);
  if (pendingError) throw pendingError;

  const itemsByStatus = new Map<string, number>();
  for (const row of items ?? []) {
    itemsByStatus.set(row.status, (itemsByStatus.get(row.status) ?? 0) + 1);
  }
  const versionsByReviewState = new Map<string, number>();
  for (const row of versions ?? []) {
    versionsByReviewState.set(row.review_state, (versionsByReviewState.get(row.review_state) ?? 0) + 1);
  }

  const pendingEditorialReview: PendingContentRow[] = (pending ?? []).flatMap((row) => {
    const item = Array.isArray(row.content_item) ? row.content_item[0] : row.content_item;
    if (!item) return [];
    return [
      {
        contentVersionId: row.id,
        contentItemId: item.id,
        title: item.title,
        siteId: item.site_id,
        contentType: item.content_type,
        reviewState: row.review_state,
        createdAt: row.created_at,
      },
    ];
  });

  return {
    itemsByStatus: Array.from(itemsByStatus.entries()).map(([status, count]) => ({ status, count })),
    versionsByReviewState: Array.from(versionsByReviewState.entries()).map(([reviewState, count]) => ({
      reviewState,
      count,
    })),
    pendingEditorialReview,
  };
}
