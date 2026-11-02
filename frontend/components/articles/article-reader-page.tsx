"use client";
import Link from "next/link";
import { useUiMode } from "@/providers/ui-mode-provider";
import { ArticleReaderView } from "./article-reader-view";
import { CliArticleReader } from "./cli-article-reader";
import type { ArticleReaderResult } from "./article-reader-data";
import modeStyles from "./articles.module.css";
export function ArticleReaderPage({
  result,
  retryHref = "/articles",
}: {
  result: ArticleReaderResult;
  retryHref?: string;
}) {
  const { setMode } = useUiMode();
  return (
    <>
      <div className={modeStyles.guiMode}>
        <ArticleReaderView
          result={result}
          retryHref={retryHref}
          onClassic={() => setMode("cli", { navigate: false })}
        />
      </div>
      <div className={modeStyles.classicMode}>
        <div className="bg-[#0a0e14] text-[#e6edf3] px-4 py-3 font-mono">
          <button
            className="border border-current rounded px-4 min-h-11"
            type="button"
            onClick={() => setMode("gui", { navigate: false })}
          >
            Open GUI reader
          </button>
        </div>
        {result.kind === "ready" ? (
          <CliArticleReader article={result.article} />
        ) : (
          <main className="min-h-screen bg-[#0a0e14] text-[#e6edf3] px-5 py-12 font-mono">
            <h1>
              {result.kind === "loading"
                ? "Loading article…"
                : result.kind === "missing"
                  ? "Article not found"
                  : "Article unavailable"}
            </h1>
            <p role={result.kind === "loading" ? "status" : undefined}>
              {result.kind === "loading"
                ? "Fetching this public article."
                : result.kind === "missing"
                  ? "It may have been removed, or the address is incorrect."
                  : "The article could not be loaded. Try a fresh read."}
            </p>
            {result.kind === "error" && (
              <a
                href={retryHref}
                className="inline-flex items-center min-h-11 underline mr-5"
              >
                Try again
              </a>
            )}
            <Link
              href="/articles"
              className="inline-flex items-center min-h-11 underline"
            >
              All articles
            </Link>
          </main>
        )}
      </div>
    </>
  );
}
