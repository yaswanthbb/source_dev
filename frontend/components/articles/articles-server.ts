import "server-only";
import {
  parsePublicArticles,
  articlePage,
  type ArticlesRequest,
  type ArticlesResult,
} from "./articles-data";
/** Anonymous public listing only: never forward account cookies or authorization. */
export async function loadPublicArticles(
  request: ArticlesRequest,
  fetcher: typeof fetch = fetch,
  base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
): Promise<ArticlesResult> {
  if (request.issue)
    return { kind: "invalid", request, message: request.issue };
  const query = request.search
    ? `?search=${encodeURIComponent(request.search)}`
    : "";
  try {
    const response = await fetcher(
      `${base.replace(/\/+$/, "")}/articles${query}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!response.ok) throw new Error();
    return articlePage(parsePublicArticles(await response.json()), request);
  } catch {
    return {
      kind: "error",
      request,
      message:
        "The public article list could not be loaded. Try again; your search is kept in the address bar.",
    };
  }
}
