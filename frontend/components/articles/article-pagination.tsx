import { ArrowLeft, ArrowRight } from "lucide-react";
import { articlesHref, type ArticlesResult } from "./articles-data";
import styles from "./articles.module.css";
export function ArticlePagination({
  result,
  classic = false,
  basePath = "/articles",
}: {
  result: ArticlesResult;
  classic?: boolean;
  basePath?: string;
}) {
  if (result.kind !== "ready" || result.pages <= 1) return null;
  const target = classic ? "classic-article-results" : "public-article-results";
  return (
    <nav
      className={classic ? styles.classicPagination : styles.pagination}
      aria-label="Article pagination"
    >
      {result.page > 1 ? (
        <a
          href={`${articlesHref(result.request.search, result.page - 1, basePath)}#${target}`}
          rel="prev"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Previous articles
        </a>
      ) : (
        <span aria-disabled="true">Previous articles</span>
      )}
      <p>
        Page {result.page} of {result.pages}
      </p>
      {result.page < result.pages ? (
        <a
          href={`${articlesHref(result.request.search, result.page + 1, basePath)}#${target}`}
          rel="next"
        >
          Next articles
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      ) : (
        <span aria-disabled="true">Next articles</span>
      )}
    </nav>
  );
}
