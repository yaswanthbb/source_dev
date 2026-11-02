import apiClient from "@/lib/api-client";
import { getToken, type User } from "@/lib/auth";
import {
  adminGuard,
  loadAdminAccount,
  AdminDashboardFailure,
} from "@/components/admin-dashboard/admin-dashboard-client";
import { contentId } from "@/components/content/content-data";
import {
  parseEditableArticle,
  type EditableArticle,
} from "@/components/articles/article-editor-data";
export type ModerationArticle = EditableArticle & { slug: string };
export type ArticleRow = Omit<ModerationArticle, "content">;
export interface AdminArticlesLibrary {
  user: User;
  articles: ArticleRow[];
  checkedAt: string;
}
export interface AdminArticleDetail {
  article: ModerationArticle;
  checkedAt: string;
}
export interface AdminArticleRecovery {
  library: AdminArticlesLibrary;
  detail?: AdminArticleDetail;
  removed: boolean;
}
export class AdminArticlesFailure extends Error {
  constructor(
    message: string,
    public uncertain = false,
    public unavailable = false,
  ) {
    super(message);
  }
}
const options = { timeout: 12000 };
const denied = (e: unknown) =>
  e instanceof AdminDashboardFailure || e instanceof AdminArticlesFailure
    ? e.unavailable
    : [401, 403].includes(
        (e as { response?: { status?: number } })?.response?.status ?? 0,
      );
const failure = (e: unknown, message: string, uncertain = false) =>
  new AdminArticlesFailure(message, uncertain, denied(e));
function guardFor(session: string | null) {
  try {
    const guard = adminGuard(session);
    return () => {
      try {
        guard();
      } catch (e) {
        throw failure(
          e,
          "Your session changed. Cached moderation data is hidden.",
        );
      }
    };
  } catch (e) {
    throw failure(e, "Your session changed. Cached moderation data is hidden.");
  }
}
export function parseModerationArticle(
  raw: unknown,
  user: User,
  id: string,
): ModerationArticle {
  const article = parseEditableArticle(raw, user, id),
    row = raw as Record<string, unknown>;
  if (user.role !== "admin" || typeof row.slug !== "string")
    throw new Error("Article metadata incomplete.");
  return { ...article, title: row.title as string, slug: row.slug };
}
export function articleRow(article: ModerationArticle): ArticleRow {
  return {
    id: article.id,
    title: article.title,
    authorId: article.authorId,
    authorName: article.authorName,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    roadmapId: article.roadmapId,
    conceptId: article.conceptId,
    slug: article.slug,
  };
}
export const moderationVersion = (article: ModerationArticle | ArticleRow) =>
  JSON.stringify(article);
export function parseAdminArticles(raw: unknown, user: User): ArticleRow[] {
  if (!Array.isArray(raw)) throw new Error("Article list incomplete.");
  const rows = raw.map((value) =>
    articleRow(
      parseModerationArticle(
        value,
        user,
        contentId((value as { id?: unknown })?.id),
      ),
    ),
  );
  if (new Set(rows.map((row) => row.id)).size !== rows.length)
    throw new Error("Duplicate article.");
  return rows;
}
export async function loadAdminArticles(
  expected?: User,
  signal?: AbortSignal,
  session = getToken(),
): Promise<AdminArticlesLibrary> {
  const guard = guardFor(session);
  try {
    const user = await loadAdminAccount(expected, signal, session);
    const response = await apiClient.get("/articles", { ...options, signal });
    guard();
    const articles = parseAdminArticles(response.data, user);
    await loadAdminAccount(user, signal, session);
    guard();
    return { user, articles, checkedAt: new Date().toISOString() };
  } catch (e) {
    throw failure(
      e,
      "The article library couldn’t be checked. Previous list values are hidden.",
    );
  }
}
async function readCurrent(
  user: User,
  id: string,
  session: string | null,
): Promise<ModerationArticle | undefined> {
  const guard = guardFor(session);
  await loadAdminAccount(user, undefined, session);
  let raw: unknown;
  try {
    raw = (await apiClient.get(`/articles/${contentId(id)}`, options)).data;
  } catch (e) {
    guard();
    if ((e as { response?: { status?: number } })?.response?.status !== 404)
      throw e;
    await loadAdminAccount(user, undefined, session);
    guard();
    return undefined;
  }
  guard();
  const article = parseModerationArticle(raw, user, id);
  await loadAdminAccount(user, undefined, session);
  guard();
  return article;
}
export async function inspectAdminArticle(
  library: AdminArticlesLibrary,
  row: ArticleRow,
  session = getToken(),
): Promise<AdminArticleDetail> {
  try {
    const article = await readCurrent(library.user, row.id, session);
    if (
      !article ||
      moderationVersion(articleRow(article)) !== moderationVersion(row)
    )
      throw new Error();
    return { article, checkedAt: new Date().toISOString() };
  } catch (e) {
    throw failure(
      e,
      "This article changed, was removed or couldn’t be checked. Refresh the list before reviewing it.",
    );
  }
}
export function moderationReason(reason: string) {
  const text = reason.trim();
  if (!text || text.length > 2000)
    throw new AdminArticlesFailure(
      "Write a specific reason using 1–2000 characters.",
    );
  return text;
}
export async function removeAdminArticle(
  library: AdminArticlesLibrary,
  before: AdminArticleDetail,
  reason: string,
  session = getToken(),
): Promise<AdminArticlesLibrary> {
  const text = moderationReason(reason),
    guard = guardFor(session);
  const fresh = await loadAdminArticles(library.user, undefined, session),
    row = fresh.articles.find((a) => a.id === before.article.id);
  if (
    !row ||
    moderationVersion(row) !== moderationVersion(articleRow(before.article))
  )
    throw new AdminArticlesFailure(
      "This article changed or was removed. Refresh and review its current version before deleting.",
    );
  const current = await inspectAdminArticle(fresh, row, session);
  if (moderationVersion(current.article) !== moderationVersion(before.article))
    throw new AdminArticlesFailure(
      "The full article text changed. Refresh and review it before deleting.",
    );
  guard();
  try {
    const response = await apiClient.delete(`/articles/admin/${row.id}`, {
      ...options,
      data: { reason: text },
    });
    guard();
    if (
      !response.data ||
      typeof response.data !== "object" ||
      response.data.success !== true
    )
      throw new Error();
    if (await readCurrent(fresh.user, row.id, session)) throw new Error();
    const saved = await loadAdminArticles(fresh.user, undefined, session);
    guard();
    if (saved.articles.some((a) => a.id === row.id)) throw new Error();
    return saved;
  } catch (e) {
    throw failure(
      e,
      "Deletion isn’t confirmed. The article may be removed and an author notification may already exist. Pause deletions and check saved state; the earlier request may still finish.",
      true,
    );
  }
}
/** GET only. A successful recovery does not cancel an earlier DELETE. */
export async function recoverAdminArticle(
  user: User,
  id: string,
  session = getToken(),
): Promise<AdminArticleRecovery> {
  try {
    contentId(id);
    const library = await loadAdminArticles(user, undefined, session),
      article = await readCurrent(library.user, id, session),
      row = library.articles.find((a) => a.id === id);
    if (!article && row) throw new Error();
    if (
      article &&
      (!row ||
        moderationVersion(row) !== moderationVersion(articleRow(article)))
    )
      throw new Error();
    return {
      library,
      detail: article
        ? { article, checkedAt: new Date().toISOString() }
        : undefined,
      removed: !article,
    };
  } catch (e) {
    throw failure(
      e,
      "Saved state couldn’t be confirmed. Keep deletions paused and try the read-only check again.",
    );
  }
}
