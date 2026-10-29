import "server-only";
import { contentId } from "@/components/content/content-data";
import {
  parsePublicArticle,
  type ArticleReaderResult,
} from "./article-reader-data";
/** One fresh public read, without forwarding account credentials. Only 404 means missing. */
export async function loadPublicArticle(
  id: string,
  fetcher: typeof fetch = fetch,
  base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
): Promise<ArticleReaderResult> {
  try {
    contentId(id);
  } catch {
    return { kind: "missing" };
  }
  try {
    const response = await fetcher(
      `${base.replace(/\/+$/, "")}/articles/${encodeURIComponent(id)}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (response.status === 404) return { kind: "missing" };
    if (!response.ok) return { kind: "error" };
    return {
      kind: "ready",
      article: parsePublicArticle(await response.json(), id),
    };
  } catch {
    return { kind: "error" };
  }
}
