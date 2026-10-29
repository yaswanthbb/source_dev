"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, PenLine, Search } from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { PublicReadingShell } from "./public-reading-shell";
import { ArticlePagination } from "./article-pagination";
import {
  ARTICLES_PER_PAGE,
  articlesHref,
  articleDate,
  type ArticlesResult,
} from "./articles-data";
import styles from "./articles.module.css";
export function ArticlesView({
  result,
  onClassic,
  basePath = "/articles",
}: {
  result: ArticlesResult;
  onClassic: () => void;
  basePath?: string;
}) {
  const request = result.request,
    loading = result.kind === "loading";
  return (
    <PublicReadingShell onClassic={onClassic}>
      <main id="public-articles-content" tabIndex={-1} className={styles.main}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>THE DEVELOPER NOTEBOOK</p>
            <h1>
              Good ideas deserve
              <br />
              <span>a little more room.</span>
            </h1>
            <p className={styles.intro}>
              Handwritten articles from developers. Explore an explanation, a
              hard-won lesson, or a new way to see a familiar idea. Read in
              full, without an account.
            </p>
            <a className={styles.quietLink} href="#public-article-results">
              Find your next read
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <svg
            className={styles.illustration}
            viewBox="0 0 250 190"
            aria-hidden="true"
          >
            <rect x="55" y="22" width="155" height="138" rx="14" />
            <rect x="33" y="40" width="155" height="130" rx="14" />
            <path
              className={styles.draw}
              pathLength="160"
              d="M60 72h77m-77 21h103m-103 21h79m-79 21h47"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="190" cy="137" r="29" />
            <path
              d="m177 144 19-20 7 7-20 19-9 2z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </header>
        <section
          className={styles.discovery}
          aria-labelledby="public-article-results"
        >
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>A PLACE TO READ AND REFLECT</p>
              <h2 id="public-article-results" tabIndex={-1}>
                {request.search ? "Search the notebook" : "From the notebook"}
              </h2>
            </div>
            <span>
              <BookOpen size={17} aria-hidden="true" />
              Open reading
            </span>
          </div>
          <form
            key={request.search}
            className={styles.search}
            action={`${basePath}#public-article-results`}
            method="GET"
            role="search"
            aria-label="Search public article titles"
          >
            <div>
              <label htmlFor="public-article-search">
                Search article titles
              </label>
              <div className={styles.inputWrap}>
                <Search size={18} aria-hidden="true" />
                <input
                  id="public-article-search"
                  name="search"
                  type="search"
                  defaultValue={request.search}
                  maxLength={200}
                  disabled={loading}
                  aria-invalid={result.kind === "invalid"}
                  aria-describedby="public-article-search-help"
                  placeholder="What are you curious about?"
                />
              </div>
            </div>
            <button className={styles.primary} type="submit" disabled={loading}>
              Search titles
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            {request.search && (
              <Link className={styles.secondary} href={basePath}>
                Clear search
              </Link>
            )}
            <p id="public-article-search-help">
              Search matches article titles. Results arrive newest first.
            </p>
          </form>
          {result.kind === "invalid" ? (
            <GuiFeedback kind="error" title="Check the article link">
              <p>{result.message}</p>
              <a
                href="#public-article-search"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById("public-article-search")?.focus();
                }}
              >
                Edit the title search
              </a>
              <Link href={basePath}>Browse all articles</Link>
            </GuiFeedback>
          ) : result.kind === "error" ? (
            <GuiFeedback kind="error" title="The notebook couldn’t load">
              <p>{result.message}</p>
              <a href={articlesHref(request.search, request.page, basePath)}>
                Try loading articles again
              </a>
            </GuiFeedback>
          ) : loading ? (
            <>
              <GuiFeedback kind="loading" title="Loading public articles">
                <p>Checking the latest titles and authors.</p>
              </GuiFeedback>
              <div className={styles.skeletons} aria-hidden="true">
                <div />
                <div />
                <div />
                <div />
              </div>
            </>
          ) : (
            result.kind === "ready" && (
              <>
                <p className={styles.results} role="status" aria-atomic="true">
                  {result.total ? (
                    <>
                      Showing {(result.page - 1) * ARTICLES_PER_PAGE + 1}–
                      {(result.page - 1) * ARTICLES_PER_PAGE +
                        result.items.length}{" "}
                      of {result.total}{" "}
                      {result.total === 1 ? "article" : "articles"}
                      {request.search ? <> for “{request.search}”</> : null}.
                    </>
                  ) : request.search ? (
                    <>No article titles matched “{request.search}”.</>
                  ) : (
                    "No articles have been shared yet."
                  )}
                </p>
                {!result.total ? (
                  <div className={styles.empty}>
                    <PenLine size={27} aria-hidden="true" />
                    <h3>
                      {request.search
                        ? "Try another way in."
                        : "Every notebook starts with a first page."}
                    </h3>
                    <p>
                      {request.search
                        ? "Try fewer words or a broader title search, or browse all articles."
                        : "Developer articles will appear here as they are shared. You can start a note of your own in the article workspace."}
                    </p>
                    <Link
                      href={request.search ? basePath : "/developer/articles"}
                      className={styles.secondary}
                    >
                      {request.search
                        ? "Browse all articles"
                        : "Open article workspace"}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    {!request.search && (
                      <p className={styles.hint}>
                        Writing requires an account. Reading does not.
                      </p>
                    )}
                  </div>
                ) : (
                  <ol
                    className={styles.grid}
                    start={(result.page - 1) * ARTICLES_PER_PAGE + 1}
                  >
                    {result.items.map((article, index) => (
                      <li key={article.id}>
                        <article
                          className={styles.card}
                          aria-labelledby={`public-article-${article.id}`}
                        >
                          <div className={styles.cardTop}>
                            <span className={styles.number} aria-hidden="true">
                              {String(
                                (result.page - 1) * ARTICLES_PER_PAGE +
                                  index +
                                  1,
                              ).padStart(2, "0")}
                            </span>
                            <p>
                              By {article.authorName || "Author unavailable"}
                              <span aria-hidden="true"> · </span>
                              <time dateTime={article.createdAt}>
                                {articleDate(article.createdAt)}
                              </time>
                            </p>
                          </div>
                          <h3 id={`public-article-${article.id}`}>
                            <Link
                              prefetch={false}
                              href={`/articles/${article.id}`}
                            >
                              {article.title}
                              <span
                                className={styles.cardArrow}
                                aria-hidden="true"
                              >
                                <ArrowRight size={19} />
                              </span>
                            </Link>
                          </h3>
                          {article.excerpt && (
                            <p className={styles.excerpt}>{article.excerpt}</p>
                          )}
                          <span className={styles.readLabel} aria-hidden="true">
                            Read article
                            <ArrowRight size={15} />
                          </span>
                        </article>
                      </li>
                    ))}
                  </ol>
                )}
                <ArticlePagination result={result} basePath={basePath} />
                {!!result.total && (
                  <p className={styles.hint}>Publication dates shown in UTC.</p>
                )}
              </>
            )
          )}
        </section>
        <aside className={styles.writeNote}>
          <div>
            <p className={styles.eyebrow}>PASS THE CONNECTION ON</p>
            <h2>Something finally clicked?</h2>
            <p>
              Write it down in your own words. Your next explanation could help
              someone else find their way.
            </p>
          </div>
          <Link href="/developer/articles" className={styles.secondary}>
            Open article workspace
            <PenLine size={17} aria-hidden="true" />
          </Link>
          <p className={styles.hint}>Sign-in required to write and publish.</p>
        </aside>
      </main>
    </PublicReadingShell>
  );
}
