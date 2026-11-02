import apiClient from "@/lib/api-client";
import type { User } from "@/lib/auth";
import { contentId } from "@/components/content/content-data";
import { contentUnavailable } from "@/components/content/content-client";
import {
  account,
  readArticle,
  sessionGuard,
  writeRefused,
  ArticleWriteFailure,
} from "./own-articles-client";
import {
  parseEditableArticle,
  articleEditFingerprint,
  articleEditBody,
  articleMatchesDraft,
  type ArticleEditorContext,
} from "./article-editor-data";
import type { ArticleDraft } from "./own-articles-data";
export class ArticleEditorFailure extends ArticleWriteFailure {
  constructor(
    message: string,
    public conflict = false,
    public missing = false,
    uncertain = false,
    unavailable = false,
  ) {
    super(message, uncertain, unavailable);
  }
}
export async function loadArticleEditor(
  id: string,
  signal?: AbortSignal,
  expected?: Pick<User, "id" | "role">,
): Promise<ArticleEditorContext> {
  try {
    contentId(id);
  } catch {
    throw new ArticleEditorFailure(
      "This article address is invalid.",
      false,
      true,
      false,
      true,
    );
  }
  const guard = sessionGuard(),
    user = await account(expected, signal);
  guard();
  let raw: unknown;
  try {
    raw = await readArticle(id, signal);
  } catch (error) {
    throw new ArticleEditorFailure(
      "The saved article couldn’t load. Your local writing is kept; check again before saving.",
      false,
      false,
      false,
      contentUnavailable(error),
    );
  }
  guard();
  if (raw === undefined)
    throw new ArticleEditorFailure(
      "This article was removed or no longer exists.",
      false,
      true,
      false,
      true,
    );
  try {
    return { user, article: parseEditableArticle(raw, user, id) };
  } catch {
    throw new ArticleEditorFailure(
      "This article’s identity, ownership or saved data couldn’t be confirmed. Cached text is hidden; reload or sign in with authoring access.",
      false,
      false,
      false,
      true,
    );
  }
}
export async function saveArticleEdit(
  before: ArticleEditorContext,
  draft: ArticleDraft,
): Promise<ArticleEditorContext> {
  let body: ReturnType<typeof articleEditBody>;
  try {
    body = articleEditBody(draft);
  } catch {
    throw new ArticleEditorFailure("Check the article fields before saving.");
  }
  if (articleMatchesDraft(before.article, draft))
    throw new ArticleEditorFailure("There are no changes to save.");
  const guard = sessionGuard(),
    current = await loadArticleEditor(
      before.article.id,
      undefined,
      before.user,
    );
  guard();
  if (
    articleEditFingerprint(current.article) !==
    articleEditFingerprint(before.article)
  )
    throw new ArticleEditorFailure(
      "The saved article changed after you opened it. Your draft is kept. Check the latest saved text and choose how to continue.",
      true,
    );
  let raw: unknown;
  try {
    raw = (
      await apiClient.patch(`/articles/${current.article.id}`, body, {
        timeout: 12000,
      })
    ).data;
  } catch (error) {
    throw writeRefused(error);
  }
  try {
    guard();
    const saved = parseEditableArticle(raw, current.user, current.article.id);
    if (
      saved.authorId !== current.article.authorId ||
      saved.createdAt !== current.article.createdAt ||
      !articleMatchesDraft(saved, draft)
    )
      throw new Error();
    const checked = await loadArticleEditor(
      current.article.id,
      undefined,
      current.user,
    );
    guard();
    if (
      articleEditFingerprint(saved) !== articleEditFingerprint(checked.article)
    )
      throw new Error();
    return checked;
  } catch (error) {
    throw new ArticleEditorFailure(
      "Saving couldn’t be fully confirmed. Your edit may already be public. Check saved state before another save; an earlier request may still finish.",
      false,
      error instanceof ArticleEditorFailure && error.missing,
      true,
      contentUnavailable(error),
    );
  }
}
