"use client";
import Link from "next/link";
import { articlesHref, type ArticlesResult } from "./articles-data";
import { ArticlePagination } from "./article-pagination";
export function CliArticles({
  result,
  basePath = "/articles",
}: {
  result: ArticlesResult;
  basePath?: string;
}) {
  const articles = result.kind === "ready" ? result.items : [];
  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e6edf3] font-mono">
      <header className="border-b border-[#21262d] px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight">
          <span className="text-[#3fb950]">■ </span>source:dev
        </Link>
        <nav className="flex items-center gap-3 text-[12px]">
          <Link
            href="/developer/dashboard"
            className="text-[#8b949e] hover:text-[#e6edf3]"
          >
            APP
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg bg-[#3fb950] text-[#0a0e14] font-bold"
          >
            SIGN IN
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <p className="text-[11px] tracking-widest text-[#8b949e]">
            ┌─[ articles :: hand-written ]
          </p>
          <h1
            id="classic-article-results"
            tabIndex={-1}
            className="text-2xl sm:text-3xl font-bold mt-1"
          >
            Notes from developers
          </h1>
          <p className="text-[13px] text-[#8b949e] mt-1">
            {"// public discovery funnel — full articles, no login required"}
          </p>
        </div>

        <form
          action={`${basePath}#classic-article-results`}
          method="GET"
          role="search"
          aria-label="Search public article titles in classic appearance"
          className="flex gap-2"
        >
          <input
            id="classic-article-search"
            aria-label="Search article titles"
            maxLength={200}
            name="search"
            defaultValue={result.request.search}
            placeholder="filter by title..."
            className="flex-1 px-3 py-2 rounded-lg text-[13px] bg-[#161b22] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-[12px] font-bold bg-[#3fb950] text-[#0a0e14]"
          >
            FILTER
          </button>
        </form>

        {result.kind === "error" || result.kind === "invalid" ? (
          <div role="alert">
            <p>{result.message}</p>
            <a
              href={
                result.kind === "invalid"
                  ? basePath
                  : articlesHref(
                      result.request.search,
                      result.request.page,
                      basePath,
                    )
              }
            >
              RELOAD ARTICLES
            </a>
          </div>
        ) : result.kind === "loading" ? (
          <p role="status">LOADING ARTICLES…</p>
        ) : articles.length === 0 ? (
          <p className="text-[13px] text-[#8b949e]">
            {result.request.search
              ? "No matching article titles. Try another search."
              : "No articles yet — be the first to write one."}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {articles.map((a) => (
              <Link
                key={a.id}
                prefetch={false}
                href={`/articles/${a.id}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-[#161b22] transition-colors"
              >
                <span className="font-bold text-[14px] truncate">
                  {a.title}
                </span>
                <span className="text-[11px] text-[#8b949e] shrink-0">
                  {a.authorName ?? "anon"} · {a.createdAt.slice(0, 10)}
                </span>
              </Link>
            ))}
          </div>
        )}

        <ArticlePagination result={result} classic basePath={basePath} />
        <p className="text-[12px] text-[#8b949e]">
          Developers:{" "}
          <Link href="/developer/articles" className="text-[#3fb950] font-bold">
            write one ➔
          </Link>
        </p>
      </main>
    </div>
  );
}
