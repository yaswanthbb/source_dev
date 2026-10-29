import apiClient from "@/lib/api-client";
import { getToken, type User } from "@/lib/auth";
import { contentId, parseContentUser } from "@/components/content/content-data";
import {
  ContentFailure,
  contentUnavailable,
} from "@/components/content/content-client";
import {
  articleBody,
  parseOwnArticle,
  parseOwnArticles,
  parseArticleSave,
  ownArticleFingerprint,
  type ArticleDraft,
  type OwnArticle,
  type OwnArticlesLibrary,
  type OwnArticleAction,
  type ArticleRecovery,
} from "./own-articles-data";
const timeout = 12000;
export class ArticleWriteFailure extends ContentFailure {
  constructor(
    message: string,
    uncertain = false,
    unavailable = false,
    public articleId?: string,
  ) {
    super(message, uncertain, unavailable);
  }
}
const status = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;
const accountChanged = () =>
  new ArticleWriteFailure(
    "Your account or authoring access changed. Reload before continuing.",
    false,
    true,
  );
export function sessionGuard() {
  const token = getToken();
  return () => {
    if (getToken() !== token) throw accountChanged();
  };
}
export async function account(
  expected?: Pick<User, "id" | "role">,
  signal?: AbortSignal,
) {
  try {
    const raw = (await apiClient.get("/users/me", { timeout, signal })).data;
    let user: User;
    try {
      user = parseContentUser(raw);
    } catch {
      throw accountChanged();
    }
    if (expected && (expected.id !== user.id || expected.role !== user.role))
      throw accountChanged();
    return user;
  } catch (error) {
    if (error instanceof ContentFailure) throw error;
    throw new ArticleWriteFailure(
      "Your current account couldn’t be checked. Reload your articles before continuing.",
      false,
      contentUnavailable(error),
    );
  }
}
export async function loadOwnArticles(
  signal?: AbortSignal,
  expected?: Pick<User, "id" | "role">,
): Promise<OwnArticlesLibrary> {
  const guard = sessionGuard();
  const user = await account(expected, signal);
  guard();
  let raw: unknown;
  try {
    raw = (await apiClient.get("/articles", { timeout, signal })).data;
  } catch (error) {
    throw new ArticleWriteFailure(
      "Your article library couldn’t load. Your draft is kept; recheck before publishing.",
      false,
      contentUnavailable(error),
    );
  }
  guard();
  try {
    return parseOwnArticles(user, raw);
  } catch {
    throw new ArticleWriteFailure(
      "Article ownership or metadata couldn’t be confirmed. Cached articles and drafts are hidden; reload.",
      false,
      true,
    );
  }
}
export async function readArticle(id: string, signal?: AbortSignal) {
  try {
    return (
      await apiClient.get(`/articles/${contentId(id)}`, { timeout, signal })
    ).data as unknown;
  } catch (error) {
    if (status(error) === 404) return undefined;
    throw error;
  }
}
export function writeRefused(error: unknown) {
  const code = status(error),
    uncertain = !code || code >= 500 || code === 408;
  return new ArticleWriteFailure(
    uncertain
      ? "The result couldn’t be confirmed. An earlier request may still finish. Check saved articles before trying again."
      : "The server refused this change. Check your fields and authoring access; your draft is kept.",
    uncertain,
    code === 401 || code === 403,
  );
}
export async function publishOwnArticle(
  before: OwnArticlesLibrary,
  draft: ArticleDraft,
) {
  let body: ReturnType<typeof articleBody>;
  try {
    body = articleBody(draft);
  } catch {
    throw new ArticleWriteFailure(
      "Check the article fields before publishing.",
    );
  }
  const guard = sessionGuard();
  const current = await loadOwnArticles(undefined, before.user);
  guard();
  let raw: unknown;
  try {
    raw = (await apiClient.post("/articles", body, { timeout })).data;
  } catch (error) {
    throw writeRefused(error);
  }
  let id: string | undefined;
  try {
    id = contentId((raw as { id?: unknown })?.id);
  } catch {}
  try {
    guard();
    const saved = parseArticleSave(raw, current.user.id, draft);
    const checked = await readArticle(saved.id);
    guard();
    if (
      ownArticleFingerprint(
        parseArticleSave(checked, current.user.id, draft),
      ) !== ownArticleFingerprint(saved)
    )
      throw new Error();
    const library = await loadOwnArticles(undefined, current.user);
    guard();
    if (
      !library.articles.some(
        (row) => ownArticleFingerprint(row) === ownArticleFingerprint(saved),
      )
    )
      throw new Error();
    return { article: saved, library };
  } catch (error) {
    throw new ArticleWriteFailure(
      "Publishing couldn’t be fully confirmed. The article may already be public. Check saved articles; an earlier request may still finish.",
      true,
      contentUnavailable(error),
      id,
    );
  }
}
export async function deleteOwnArticle(
  before: OwnArticlesLibrary,
  selected: OwnArticle,
) {
  const guard = sessionGuard();
  const current = await loadOwnArticles(undefined, before.user);
  guard();
  const row = current.articles.find((item) => item.id === selected.id);
  if (!row || ownArticleFingerprint(row) !== ownArticleFingerprint(selected))
    throw new ArticleWriteFailure(
      "This article changed or was removed. Recheck your list and review it before deleting.",
    );
  try {
    const raw = await readArticle(row.id);
    guard();
    if (
      ownArticleFingerprint(parseOwnArticle(raw, current.user.id)) !==
      ownArticleFingerprint(row)
    )
      throw new Error();
  } catch (error) {
    throw new ArticleWriteFailure(
      "The article’s current ownership or saved version couldn’t be checked. No deletion was sent. Recheck before continuing.",
      false,
      contentUnavailable(error),
    );
  }
  let ack: unknown;
  try {
    guard();
    ack = (await apiClient.delete(`/articles/${row.id}`, { timeout })).data;
  } catch (error) {
    throw writeRefused(error);
  }
  try {
    guard();
    if (
      !ack ||
      typeof ack !== "object" ||
      (ack as { success?: unknown }).success !== true
    )
      throw new Error();
    if ((await readArticle(row.id)) !== undefined) throw new Error();
    guard();
    const library = await loadOwnArticles(undefined, current.user);
    guard();
    if (library.articles.some((item) => item.id === row.id)) throw new Error();
    return library;
  } catch (error) {
    throw new ArticleWriteFailure(
      "Deletion couldn’t be fully confirmed. Check this article’s saved state before another change; an earlier request may still finish.",
      true,
      contentUnavailable(error),
      row.id,
    );
  }
}
/** Read-only recovery never repeats a POST or DELETE. */
export async function checkOwnArticleAction(
  before: OwnArticlesLibrary,
  action?: OwnArticleAction,
  knownId?: string,
): Promise<ArticleRecovery> {
  const guard = sessionGuard();
  try {
    const library = await loadOwnArticles(undefined, before.user);
    guard();
    if (action?.kind === "delete") {
      const raw = await readArticle(action.article.id);
      guard();
      if (raw !== undefined) parseOwnArticle(raw, library.user.id);
      if (
        raw === undefined &&
        library.articles.some((row) => row.id === action.article.id)
      )
        throw new Error();
      return { library, candidates: [], removed: raw === undefined };
    }
    const prior = new Set(before.articles.map((row) => row.id));
    const candidates =
      action?.kind === "create"
        ? library.articles.filter((row) =>
            knownId
              ? row.id === knownId
              : !prior.has(row.id) && row.title === action.draft.title.trim(),
          )
        : [];
    return { library, candidates, removed: false };
  } catch (error) {
    if (error instanceof ContentFailure) throw error;
    throw new ArticleWriteFailure(
      "Saved state couldn’t be checked. Keep changes paused and try the read-only check again.",
      false,
      contentUnavailable(error),
    );
  }
}
