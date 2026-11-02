import { contentId, parseContentUser } from "@/components/content/content-data";
import { parsePublicArticle } from "./article-reader-data";
import { publishedDate } from "./articles-data";
import type { User } from "@/lib/auth";
export interface ArticleDraft {
  title: string;
  content: string;
  roadmapId: string;
  conceptId: string;
}
export interface OwnArticle {
  id: string;
  title: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  roadmapId: string | null;
  conceptId: string | null;
}
export interface OwnArticlesLibrary {
  user: User;
  articles: OwnArticle[];
}
export const emptyArticleDraft: ArticleDraft = {
  title: "",
  content: "",
  roadmapId: "",
  conceptId: "",
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function articleDraftErrors(draft: ArticleDraft) {
  return {
    title: !draft.title.trim()
      ? "Give your article a title."
      : draft.title.trim().length > 200
        ? "Use 200 characters or fewer for the title."
        : undefined,
    content: !draft.content.trim()
      ? "Write your article in Markdown before publishing."
      : undefined,
    roadmapId:
      draft.roadmapId.trim() && !uuid.test(draft.roadmapId.trim())
        ? "Use a valid roadmap UUID, or leave this blank."
        : undefined,
    conceptId:
      draft.conceptId.trim() && !uuid.test(draft.conceptId.trim())
        ? "Use a valid lesson UUID, or leave this blank."
        : undefined,
  };
}
export function articleBody(draft: ArticleDraft) {
  if (Object.values(articleDraftErrors(draft)).some(Boolean))
    throw new Error("Check the article fields.");
  return {
    title: draft.title.trim(),
    content: draft.content,
    ...(draft.roadmapId.trim() ? { roadmapId: draft.roadmapId.trim() } : {}),
    ...(draft.conceptId.trim() ? { conceptId: draft.conceptId.trim() } : {}),
  };
}
export function parseOwnArticle(raw: unknown, userId: string): OwnArticle {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Article metadata is incomplete.");
  const row = raw as Record<string, unknown>;
  const id = contentId(row.id);
  if (
    row.authorId !== userId ||
    typeof row.title !== "string" ||
    !row.title.trim() ||
    row.title.length > 200
  )
    throw new Error("Article ownership or title changed.");
  return {
    id,
    title: row.title,
    authorId: userId,
    createdAt: publishedDate(row.createdAt),
    updatedAt: publishedDate(row.updatedAt),
    roadmapId: row.roadmapId == null ? null : contentId(row.roadmapId),
    conceptId: row.conceptId == null ? null : contentId(row.conceptId),
  };
}
export function parseOwnArticles(
  user: unknown,
  raw: unknown,
): OwnArticlesLibrary {
  const account = parseContentUser(user);
  if (!Array.isArray(raw)) throw new Error("Article library is incomplete.");
  const seen = new Set<string>();
  const articles: OwnArticle[] = [];
  for (const value of raw) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Article ownership is incomplete.");
    const row = value as Record<string, unknown>;
    if (row.authorId != null) contentId(row.authorId);
    if (row.authorId !== account.id) continue;
    const article = parseOwnArticle(row, account.id);
    if (seen.has(article.id)) throw new Error("Duplicate article returned.");
    seen.add(article.id);
    articles.push(article);
  }
  return { user: account, articles };
}
export function parseArticleSave(
  raw: unknown,
  ownerId: string,
  draft: ArticleDraft,
) {
  const metadata = parseOwnArticle(raw, ownerId);
  const article = parsePublicArticle(raw, metadata.id),
    body = articleBody(draft);
  if (
    article.title !== body.title ||
    article.content !== body.content ||
    metadata.roadmapId !== (body.roadmapId ?? null) ||
    metadata.conceptId !== (body.conceptId ?? null)
  )
    throw new Error("Article save does not match your submission.");
  return metadata;
}
export const ownArticleFingerprint = (article: OwnArticle) =>
  JSON.stringify([
    article.id,
    article.authorId,
    article.title,
    article.createdAt,
    article.updatedAt,
    article.roadmapId,
    article.conceptId,
  ]);
export type OwnArticleAction =
  | { kind: "create"; draft: ArticleDraft }
  | { kind: "delete"; article: OwnArticle };
export interface ArticleRecovery {
  library: OwnArticlesLibrary;
  candidates: OwnArticle[];
  removed: boolean;
}
