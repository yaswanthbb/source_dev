import { contentId } from "@/components/content/content-data";
import { parsePublicArticles, publishedDate } from "./articles-data";
export interface PublicArticle {
  id: string;
  title: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  content: string;
  hasCurriculum: boolean;
}
export type ArticleReaderResult =
  | { kind: "ready"; article: PublicArticle }
  | { kind: "error" | "missing" | "loading" };
/** Project only public reading data, never the returned account object or private link IDs. */
export function parsePublicArticle(
  raw: unknown,
  requestedId: string,
): PublicArticle {
  const summary = parsePublicArticles([raw])[0];
  const row = raw as Record<string, unknown>;
  if (summary.id !== requestedId || typeof row.content !== "string")
    throw new Error("Article content is incomplete.");
  const linked = [row.roadmapId, row.conceptId].filter(
    (value) => value != null,
  );
  linked.forEach((value) => contentId(value));
  return {
    id: summary.id,
    title: summary.title,
    authorName: summary.authorName,
    createdAt: summary.createdAt,
    updatedAt: publishedDate(row.updatedAt),
    content: row.content,
    hasCurriculum: linked.length > 0,
  };
}
export function articleReaderHref(id: string) {
  return `/articles/${encodeURIComponent(contentId(id))}`;
}
