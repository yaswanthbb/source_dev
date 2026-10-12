"use client";

/* eslint-disable @next/next/no-img-element -- External images load only after consent, without proxying arbitrary URLs through Next's optimizer. */

import { useState, type ReactNode } from "react";
import ReactMarkdown, {
  defaultUrlTransform,
  type ExtraProps,
} from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Play } from "lucide-react";
import {
  DIAGRAM_URL,
  lessonMarkdownPlugin,
  safeMediaUrl,
  videoId,
  type LessonMedia,
} from "./lesson-data";
import { LessonDiagram } from "./lesson-diagram";
import styles from "./lesson.module.css";

function containsImage(node?: ExtraProps["node"]): boolean {
  return (
    !!node &&
    (node.tagName === "img" ||
      node.children.some((n) => n.type === "element" && containsImage(n)))
  );
}

function RemoteImage({ src, alt }: { src?: string; alt?: string }) {
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const url = safeMediaUrl(src);
  if (!url)
    return (
      <span className={styles.mediaNotice}>
        Image unavailable: {alt || "unsupported image address"}.
      </span>
    );
  return (
    <span className={styles.remoteImage}>
      {pending && <span role="status">Loading image…</span>}
      {loaded ? (
        <img
          src={url}
          alt={alt || "Lesson illustration"}
          loading="lazy"
          onLoad={() => setPending(false)}
          onError={() => {
            setLoaded(false);
            setFailed(true);
            setPending(false);
          }}
        />
      ) : (
        <span>
          <span>
            {failed ? "Image couldn’t load. " : "External image. "}Loading
            connects to {new URL(url).hostname}.
          </span>
          <button
            type="button"
            onClick={() => {
              setLoaded(true);
              setFailed(false);
              setPending(true);
            }}
          >
            {failed ? "Retry image" : "Load image"}
          </button>
        </span>
      )}
    </span>
  );
}
function CodeBlock({ text, children }: { text: string; children: ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <div className={styles.codeBlock}>
      <button
        type="button"
        aria-label="Copy code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setMessage("Copied");
          } catch {
            setMessage("Copy unavailable. Select the code to copy it.");
          }
        }}
      >
        <Copy size={15} aria-hidden="true" /> Copy
      </button>
      <pre>{children}</pre>
      <span role="status" className={styles.copyStatus}>
        {message}
      </span>
    </div>
  );
}
export function LessonMarkdown({
  content,
  media = [],
}: {
  content: string;
  media?: LessonMedia[];
}) {
  return (
    <div className={styles.prose}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, lessonMarkdownPlugin]}
        skipHtml
        urlTransform={(url, key) =>
          key === "src" && url.startsWith(DIAGRAM_URL)
            ? url
            : defaultUrlTransform(url)
        }
        components={{
          p: ({ node, children }) =>
            containsImage(node) ? (
              <div className={styles.mediaParagraph}>{children}</div>
            ) : (
              <p>{children}</p>
            ),
          a: ({ href, children, node }) => {
            // Image consent buttons must not be nested inside clickable links.
            if (containsImage(node)) return <span>{children}</span>;
            const external = safeMediaUrl(href);
            const safe =
              external ||
              (href &&
              (/^\/(?!\/)/.test(href) ||
                href.startsWith("#") ||
                /^mailto:[^\s]+$/.test(href))
                ? href
                : undefined);
            return safe ? (
              <a
                href={safe}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
              >
                {children}
                {external && (
                  <span className={styles.srOnly}> (opens in a new tab)</span>
                )}
              </a>
            ) : (
              <span>{children}</span>
            );
          },
          img: ({ src, alt }) => {
            const url = typeof src === "string" ? src : undefined;
            if (url?.startsWith(DIAGRAM_URL)) {
              const id = url.slice(DIAGRAM_URL.length);
              // The read API orders media oldest-first. A regenerated diagram can reuse
              // its placeholder ID; use the newest matching presentation, not an old row.
              const item = [...media]
                .reverse()
                .find(
                  (m) =>
                    m.kind === "diagram" &&
                    (m.payload.diagramId === id || m.id === id),
                );
              return item && typeof item.payload.mermaid === "string" ? (
                <LessonDiagram
                  source={item.payload.mermaid}
                  caption={
                    typeof item.payload.caption === "string"
                      ? item.payload.caption
                      : alt
                  }
                />
              ) : (
                <span className={styles.mediaNotice}>
                  This diagram is unavailable.
                </span>
              );
            }
            return <RemoteImage key={url} src={url} alt={alt} />;
          },
          pre: ({ node, children }) => {
            const code = node?.children.find(
              (n) => n.type === "element" && n.tagName === "code",
            );
            const text =
              code?.type === "element"
                ? code.children
                    .map((n) => (n.type === "text" ? n.value : ""))
                    .join("")
                : "";
            const classes =
              code?.type === "element" ? code.properties.className : [];
            return Array.isArray(classes) &&
              classes.includes("language-mermaid") ? (
              <LessonDiagram source={text} />
            ) : (
              <CodeBlock text={text}>{children}</CodeBlock>
            );
          },
          h1: ({ children, id }) => <h2 id={id}>{children}</h2>,
          h2: ({ children, id }) => <h2 id={id}>{children}</h2>,
          table: ({ children }) => (
            <div
              className={styles.tableScroll}
              tabIndex={0}
              aria-label="Scrollable lesson table"
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
function Video({ media }: { media: LessonMedia }) {
  const [play, setPlay] = useState(false),
    [loading, setLoading] = useState(true);
  const id = videoId(media);
  const title =
    typeof media.payload.title === "string"
      ? media.payload.title
      : "Related video";
  if (!id)
    return (
      <p className={styles.mediaNotice}>
        This video has an unsupported address.
      </p>
    );
  return (
    <section className={styles.video} aria-label={title}>
      <h3>{title}</h3>
      {typeof media.payload.channel === "string" && (
        <p>{media.payload.channel}</p>
      )}
      {play ? (
        <>
          {loading && <p role="status">Loading the video player…</p>}
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={title}
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoading(false)}
          />
          <button
            type="button"
            onClick={() => {
              setPlay(false);
              setLoading(true);
            }}
          >
            Close player
          </button>
        </>
      ) : (
        <>
          <p>Playing connects your browser to YouTube.</p>
          <button type="button" onClick={() => setPlay(true)}>
            <Play size={17} aria-hidden="true" /> Load video player
          </button>
        </>
      )}
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Watch on YouTube (new tab)
      </a>
      <small>Source license: {media.license || "not specified"}</small>
    </section>
  );
}
export function LessonVideos({ media = [] }: { media?: LessonMedia[] }) {
  const videos = media.filter((m) => m.kind === "video");
  return videos.length ? (
    <section className={styles.videos} aria-labelledby="related-videos">
      <p className={styles.eyebrow}>Another perspective</p>
      <h2 id="related-videos">Related videos</h2>
      {videos.map((m) => (
        <Video key={m.id} media={m} />
      ))}
    </section>
  ) : null;
}
