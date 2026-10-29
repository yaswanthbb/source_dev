import { contentId } from "@/components/content/content-data";
export const ARTICLES_PER_PAGE = 12;
export interface ArticlesRequest {
  search: string;
  page: number;
  issue?: string;
}
export interface ArticleSummary {
  id: string;
  title: string;
  authorName: string | null;
  createdAt: string;
  excerpt: string | null;
}
export type ArticlesResult =
  | {
      kind: "ready";
      request: ArticlesRequest;
      items: ArticleSummary[];
      total: number;
      page: number;
      pages: number;
    }
  | {
      kind: "error" | "invalid" | "loading";
      request: ArticlesRequest;
      message?: string;
    };
export function articlesRequest(
  query: Record<string, string | string[] | undefined>,
): ArticlesRequest {
  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (
    Array.isArray(query.search) ||
    search.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(search)
  )
    return {
      search,
      page: 1,
      issue:
        "Use one title search of 200 characters or fewer, without control characters.",
    };
  if (
    query.page !== undefined &&
    (typeof query.page !== "string" ||
      !/^[1-9]\d*$/.test(query.page) ||
      !Number.isSafeInteger(Number(query.page)))
  )
    return { search, page: 1, issue: "Use a positive whole page number." };
  return { search, page: query.page ? Number(query.page) : 1 };
}
export function articlesHref(search: string, page = 1, basePath = "/articles") {
  if (
    !/^\/[a-z0-9/-]+$/i.test(basePath) ||
    basePath.includes("//") ||
    !Number.isSafeInteger(page) ||
    page < 1
  )
    throw new Error("Invalid article navigation.");
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  return `${basePath}${params.size ? `?${params.toString()}` : ""}`;
}
// A plain-text preview, never a Markdown/HTML renderer or a source of remote media.
export function articleExcerpt(content: string): string | null {
  const text = content
    .slice(0, 64000)
    .replace(/```[^\n]*\n[\s\S]*?(?:```|$)/g, " ")
    .replace(/~~~[^\n]*\n[\s\S]*?(?:~~~|$)/g, " ")
    .replace(/<!--[\s\S]*?(?:-->|$)/g, " ")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s*\[[^\]]+\]:[^\n]*$/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[`*~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  const letters = Array.from(text);
  if (letters.length <= 220) return text;
  const start = letters.slice(0, 220).join(""),
    boundary = start.lastIndexOf(" ");
  return `${(boundary > 150 ? start.slice(0, boundary) : start).trimEnd()}…`;
}
export function publishedDate(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error("Article dates are incomplete.");
  const day = value.slice(0, 10),
    calendar = new Date(`${day}T00:00:00Z`);
  if (
    !Number.isFinite(calendar.getTime()) ||
    calendar.toISOString().slice(0, 10) !== day
  )
    throw new Error("Article dates are incomplete.");
  return value;
}
export function parsePublicArticles(raw: unknown): ArticleSummary[] {
  if (!Array.isArray(raw)) throw new Error("Article list is incomplete.");
  const ids = new Set<string>();
  return raw.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Article metadata is incomplete.");
    const row = value as Record<string, unknown>,
      id = contentId(row.id);
    if (
      ids.has(id) ||
      typeof row.title !== "string" ||
      !row.title.trim() ||
      row.title.trim().length > 200
    )
      throw new Error("Article metadata is incomplete.");
    ids.add(id);
    let authorName: string | null = null;
    if (row.author != null) {
      if (typeof row.author !== "object" || Array.isArray(row.author))
        throw new Error("Article author metadata is incomplete.");
      const name = (row.author as Record<string, unknown>).name;
      if (name != null && typeof name !== "string")
        throw new Error("Article author metadata is incomplete.");
      authorName = typeof name === "string" ? name.trim() || null : null;
    }
    if (row.content != null && typeof row.content !== "string")
      throw new Error("Article text is incomplete.");
    return {
      id,
      title: row.title.trim(),
      authorName,
      createdAt: publishedDate(row.createdAt),
      excerpt:
        typeof row.content === "string" ? articleExcerpt(row.content) : null,
    };
  });
}
export function articlePage(
  items: ArticleSummary[],
  request: ArticlesRequest,
): Extract<ArticlesResult, { kind: "ready" }> {
  const pages = Math.max(1, Math.ceil(items.length / ARTICLES_PER_PAGE)),
    page = Math.min(request.page, pages);
  return {
    kind: "ready",
    request,
    items: items.slice(
      (page - 1) * ARTICLES_PER_PAGE,
      page * ARTICLES_PER_PAGE,
    ),
    total: items.length,
    page,
    pages,
  };
}
export function articleDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
