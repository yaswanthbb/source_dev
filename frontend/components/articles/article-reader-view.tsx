"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CornerDownRight } from "lucide-react";
import { PublicReadingShell } from "./public-reading-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { LessonMarkdown } from "@/components/roadmaps/lesson-markdown";
import { lessonOutline } from "@/components/roadmaps/lesson-data";
import { articleDate } from "./articles-data";
import type { ArticleReaderResult } from "./article-reader-data";
import styles from "./article-reader.module.css";
export function ArticleReaderView({
  result,
  onClassic,
  retryHref = "/articles",
}: {
  result: ArticleReaderResult;
  onClassic: () => void;
  retryHref?: string;
}) {
  const article = result.kind === "ready" ? result.article : undefined;
  const outline = article
    ? lessonOutline(article.content).map((item) => ({
        ...item,
        id: item.id.replace("lesson-section-", "article-section-"),
      }))
    : [];
  return (
    <PublicReadingShell onClassic={onClassic} reader>
      <main id="public-articles-content" className={styles.main} tabIndex={-1}>
        <Link href="/articles" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" /> All articles
        </Link>
        {article ? (
          <>
            <header className={styles.heading} id="article-top">
              <div className={styles.eyebrow}>
                <span /> The developer notebook
              </div>
              <h1>{article.title}</h1>
              <div className={styles.byline}>
                <span className={styles.avatar} aria-hidden="true">
                  {Array.from(article.authorName || "?")[0].toUpperCase()}
                </span>
                <div>
                  <p>{article.authorName || "Author unavailable"}</p>
                  <span>
                    Published{" "}
                    <time dateTime={article.createdAt}>
                      {articleDate(article.createdAt)}
                    </time>
                    {Date.parse(article.updatedAt) >
                      Date.parse(article.createdAt) && (
                      <>
                        {" "}
                        · Updated{" "}
                        <time dateTime={article.updatedAt}>
                          {articleDate(article.updatedAt)}
                        </time>
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className={styles.rule} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </header>
            <div className={styles.readingLayout}>
              {outline.length > 0 && (
                <aside className={styles.contents}>
                  <details open>
                    <summary>
                      On this page{" "}
                      <span>{outline.length.toString().padStart(2, "0")}</span>
                    </summary>
                    <nav aria-label="Article sections">
                      <ol>
                        {outline.map((item) => (
                          <li
                            key={item.id}
                            className={
                              item.depth > 2 ? styles.nested : undefined
                            }
                          >
                            <a href={`#${item.id}`}>
                              <CornerDownRight size={13} aria-hidden="true" />
                              {item.title}
                            </a>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  </details>
                </aside>
              )}
              <article className={styles.body} aria-label={article.title}>
                {article.content.trim() ? (
                  <LessonMarkdown
                    content={article.content}
                    idPrefix="article-section"
                    label="Article"
                  />
                ) : (
                  <GuiFeedback kind="info" title="No article text">
                    This article does not contain any reading text yet.
                  </GuiFeedback>
                )}
                <div className={styles.endMark} aria-hidden="true">
                  ◆
                </div>
                {article.hasCurriculum && (
                  <section
                    className={styles.related}
                    aria-labelledby="article-related"
                  >
                    <BookOpen size={22} aria-hidden="true" />
                    <div>
                      <p className={styles.eyebrow}>Keep the connection</p>
                      <h2 id="article-related">
                        Explore the linked curriculum
                      </h2>
                      <p>
                        Linked roadmaps and lessons require an account. Sign in
                        to explore the curriculum available to you.
                      </p>
                      <Link href="/login">
                        Sign in <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </section>
                )}
                <div className={styles.readingEnd}>
                  <Link href="/articles">
                    <ArrowLeft size={16} aria-hidden="true" /> More articles
                  </Link>
                  <a href="#article-top">Back to top ↑</a>
                </div>
              </article>
            </div>
          </>
        ) : (
          <section className={styles.state}>
            <p className={styles.eyebrow}>The developer notebook</p>
            <h1>
              {result.kind === "loading"
                ? "Opening your next read."
                : result.kind === "missing"
                  ? "This page is missing."
                  : "We couldn’t open this article."}
            </h1>
            <GuiFeedback
              kind={
                result.kind === "loading"
                  ? "loading"
                  : result.kind === "missing"
                    ? "info"
                    : "error"
              }
              title={
                result.kind === "loading"
                  ? "Loading article"
                  : result.kind === "missing"
                    ? "Article not found"
                    : "Article unavailable"
              }
            >
              {result.kind === "loading"
                ? "Fetching the public article. No account is needed to read."
                : result.kind === "missing"
                  ? "It may have been removed, or the address is incorrect. Find another idea in the notebook."
                  : "The public article could not be loaded. Try again for a fresh read."}
            </GuiFeedback>
            <div className={styles.stateActions}>
              {result.kind === "error" && (
                <a href={retryHref}>
                  Try again <ArrowRight size={16} aria-hidden="true" />
                </a>
              )}
              <Link href="/articles">Browse all articles</Link>
            </div>
          </section>
        )}
      </main>
    </PublicReadingShell>
  );
}
