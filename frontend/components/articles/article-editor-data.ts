import type { User } from "@/lib/auth";
import { contentId } from "@/components/content/content-data";
import { parsePublicArticle } from "./article-reader-data";
import { articleBody, type ArticleDraft } from "./own-articles-data";
export interface EditableArticle {
  id: string;
  title: string;
  content: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  roadmapId: string | null;
  conceptId: string | null;
}
export interface ArticleEditorContext {
  user: User;
  article: EditableArticle;
}
export function parseEditableArticle(
  raw: unknown,
  user: User,
  id: string,
): EditableArticle {
  const publicArticle = parsePublicArticle(raw, id),
    row = raw as Record<string, unknown>;
  if (row.authorId !== null && typeof row.authorId !== "string")
    throw new Error("Article ownership is incomplete.");
  const authorId = row.authorId === null ? null : contentId(row.authorId);
  if (user.role !== "admin" && authorId !== user.id)
    throw new Error("Article authoring access changed.");
  return {
    id: publicArticle.id,
    title: publicArticle.title,
    content: publicArticle.content,
    authorName: publicArticle.authorName,
    authorId,
    createdAt: publicArticle.createdAt,
    updatedAt: publicArticle.updatedAt,
    roadmapId: row.roadmapId == null ? null : contentId(row.roadmapId),
    conceptId: row.conceptId == null ? null : contentId(row.conceptId),
  };
}
export const articleEditDraft = (article: EditableArticle): ArticleDraft => ({
  title: article.title,
  content: article.content,
  roadmapId: article.roadmapId ?? "",
  conceptId: article.conceptId ?? "",
});
export const articleEditFingerprint = (article: EditableArticle) =>
  JSON.stringify([
    article.id,
    article.authorId,
    article.title,
    article.content,
    article.createdAt,
    article.updatedAt,
    article.roadmapId,
    article.conceptId,
  ]);
export function articleEditBody(draft: ArticleDraft) {
  const body = articleBody(draft);
  return {
    ...body,
    roadmapId: body.roadmapId ?? null,
    conceptId: body.conceptId ?? null,
  };
}
export function articleMatchesDraft(
  article: EditableArticle,
  draft: ArticleDraft,
) {
  try {
    const body = articleEditBody(draft);
    return (
      article.title === body.title &&
      article.content === body.content &&
      article.roadmapId === body.roadmapId &&
      article.conceptId === body.conceptId
    );
  } catch {
    return false;
  }
}
