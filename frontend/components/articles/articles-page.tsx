"use client";
import { useEffect } from "react";
import { useUiMode } from "@/providers/ui-mode-provider";
import { ArticlesView } from "./articles-view";
import { CliArticles } from "./cli-articles";
import type { ArticlesResult } from "./articles-data";
import styles from "./articles.module.css";
/** Public HTML stays rendered. The existing before-paint data-ui-mode script
 * selects the visible surface, including before hydration; no account fetch. */
export function ArticlesPage({
  result,
  basePath = "/articles",
}: {
  result: ArticlesResult;
  basePath?: string;
}) {
  const { setMode, ready } = useUiMode();
  useEffect(() => {
    if (
      !ready ||
      result.kind === "loading" ||
      !["#public-article-results", "#classic-article-results"].includes(
        window.location.hash,
      )
    )
      return;
    const frame = window.requestAnimationFrame(() => {
      const target = ["public-article-results", "classic-article-results"]
        .map((id) => document.getElementById(id))
        .find((element) => element && element.getClientRects().length > 0);
      target?.scrollIntoView({ behavior: "instant", block: "start" });
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ready, result]);
  return (
    <>
      <div className={styles.guiMode}>
        <ArticlesView
          result={result}
          basePath={basePath}
          onClassic={() => setMode("cli", { navigate: false })}
        />
      </div>
      <div className={styles.classicMode}>
        <div className="bg-[#0a0e14] text-[#e6edf3] px-4 py-3 font-mono">
          <button
            className="border border-current rounded px-4 min-h-11"
            type="button"
            onClick={() => setMode("gui", { navigate: false })}
          >
            Open GUI articles
          </button>
        </div>
        <CliArticles result={result} basePath={basePath} />
      </div>
    </>
  );
}
