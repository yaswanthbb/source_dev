"use client";

/* eslint-disable @next/next/no-img-element -- Render generated SVG as an inert image, never as document markup or an optimized remote image. */

import { useEffect, useId, useState } from "react";
import { useTheme } from "@/providers/theme-provider";
import styles from "./lesson.module.css";

let renderQueue: Promise<unknown> = Promise.resolve();
export function validDiagramSource(source: string) {
  return (
    source.trim().length > 0 &&
    source.length <= 20000 &&
    !/%%\s*\{/.test(source) &&
    !/^\s*---\s*\n/.test(source)
  );
}
export function LessonDiagram({
  source,
  caption = "Lesson diagram",
}: {
  source: string;
  caption?: string;
}) {
  const { isDark } = useTheme();
  const id = useId().replace(/[^A-Za-z0-9_-]/g, "");
  return (
    <Diagram
      key={`${isDark}:${source}`}
      source={source}
      caption={caption}
      dark={isDark}
      id={id}
    />
  );
}
function Diagram({
  source,
  caption,
  dark,
  id,
}: {
  source: string;
  caption: string;
  dark: boolean;
  id: string;
}) {
  const [image, setImage] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const task = renderQueue
      .catch(() => {})
      .then(async () => {
        if (cancelled) return;
        if (!validDiagramSource(source))
          throw new Error("Unsupported diagram source");
        const { default: mermaid } = await import("mermaid");
        if (cancelled) return;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          htmlLabels: false,
          maxTextSize: 20000,
          maxEdges: 150,
          suppressErrorRendering: true,
          theme: "base",
          fontFamily: "Inter, sans-serif",
          secure: [
            "secure",
            "securityLevel",
            "startOnLoad",
            "maxTextSize",
            "maxEdges",
            "suppressErrorRendering",
            "htmlLabels",
            "theme",
            "themeCSS",
            "themeVariables",
            "dompurifyConfig",
          ],
          themeVariables: {
            primaryColor: dark ? "#37251e" : "#fff0e5",
            primaryTextColor: dark ? "#f6eee8" : "#30271f",
            primaryBorderColor: "#d76932",
            lineColor: "#d76932",
            secondaryColor: dark ? "#24211f" : "#faf7f2",
            tertiaryColor: dark ? "#24211f" : "#fffaf5",
          },
        });
        const result = await mermaid.render(
          `lesson-diagram-${id}-${attempt}`,
          source,
        );
        if (result.svg.length > 1000000) throw new Error("Diagram too large");
        // Image context: no scripts, click handlers or external SVG resources.
        // Never insert author-derived SVG into the document or bind Mermaid callbacks.
        if (!cancelled)
          setImage(`data:image/svg+xml,${encodeURIComponent(result.svg)}`);
      });
    renderQueue = task;
    void task.catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [source, dark, id, attempt]);
  return (
    <figure className={styles.diagram}>
      {image ? (
        <img
          src={image}
          alt={caption}
          onError={() => {
            setImage("");
            setError(true);
          }}
        />
      ) : (
        <span role="status">
          {error
            ? "Diagram couldn’t render. Its source is available below."
            : "Drawing the diagram…"}
        </span>
      )}
      <figcaption className={styles.caption}>{caption}</figcaption>
      {error && validDiagramSource(source) && (
        <button
          type="button"
          onClick={() => {
            setError(false);
            setAttempt(attempt + 1);
          }}
        >
          Try diagram again
        </button>
      )}
      <details>
        <summary>View diagram source</summary>
        <pre>{source}</pre>
      </details>
    </figure>
  );
}
