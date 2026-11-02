import type { RoadmapProgressData } from "@/lib/hooks/use-roadmap-progress";
import type { CurriculumLesson } from "./roadmap-data";

export interface LessonMedia {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  license: string;
}
export interface LessonContent {
  id: string;
  title: string;
  content: string | null;
  reviewStatus: string;
  difficulty?: string;
  originLabel?: "ai" | "handwritten" | "partial" | null;
  media?: LessonMedia[];
}
export interface QuizStatus {
  conceptId: string;
  totalQuestions: number;
  allQuestionsResolved: boolean;
}
export function completionBlock(
  lesson: CurriculumLesson,
  content?: LessonContent,
  progress?: RoadmapProgressData,
  quiz?: QuizStatus,
) {
  if (!content || !progress || !quiz)
    return "Waiting for current progress and quiz status.";
  if (
    content.id !== lesson.placement.conceptId ||
    quiz.conceptId !== content.id
  )
    return "The lesson changed. Refresh before continuing.";
  if (
    !Number.isInteger(quiz.totalQuestions) ||
    quiz.totalQuestions < 0 ||
    typeof quiz.allQuestionsResolved !== "boolean"
  )
    return "Quiz status is incomplete. Refresh before continuing.";
  if (content.reviewStatus !== "approved")
    return "Only approved lessons can be marked complete.";
  if (!content.content?.trim())
    return "This lesson has no published content yet.";
  const row = progress.concepts?.find((p) => p.conceptId === content.id);
  if (!row) return "This lesson is not tracked in roadmap progress.";
  const missing = (lesson.placement.prerequisites ?? []).filter(
    (p) =>
      !progress.concepts?.some(
        (r) =>
          r.conceptId === p.prerequisiteConceptId && r.status === "completed",
      ),
  );
  if (missing.length)
    return `Complete the prerequisites first: ${missing.map((p) => p.title).join(", ")}.`;
  if (quiz.totalQuestions > 0 && !quiz.allQuestionsResolved)
    return "Resolve this lesson’s knowledge check before marking it complete.";
  return undefined;
}
export function safeMediaUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return;
  try {
    const url = new URL(value);
    if (url.username || url.password) return;
    return url.href;
  } catch {
    return;
  }
}
export function videoId(media: LessonMedia) {
  const id = media.payload.videoId;
  return media.kind === "video" &&
    typeof id === "string" &&
    /^[A-Za-z0-9_-]{11}$/.test(id)
    ? id
    : undefined;
}
// Position-based IDs avoid collisions between repeated or non-Latin headings.
// The renderer uses Markdown AST positions, so these links never depend on slug guesses.
export function lessonOutline(markdown: string) {
  const result: Array<{ id: string; title: string; depth: number }> = [];
  const lines = markdown.split("\n");
  let offset = 0,
    fence = "",
    fenceSize = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) {
        fence = marker[1][0];
        fenceSize = marker[1].length;
      } else if (marker[1][0] === fence && marker[1].length >= fenceSize)
        fence = "";
    } else if (!fence) {
      const heading = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      const setext =
        line.trim() && /^ {0,3}(=+|-+)\s*$/.exec(lines[i + 1] ?? "");
      if (heading || setext) {
        const title = (heading?.[2] ?? line.trim())
          .replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1")
          .replace(/[*_`]/g, "");
        result.push({
          id: `lesson-section-${offset}`,
          title,
          depth: heading ? heading[1].length : setext![1][0] === "=" ? 1 : 2,
        });
      }
    }
    offset += line.length + 1;
  }
  return result;
}

type MarkdownNode = {
  type: string;
  value?: string;
  depth?: number;
  position?: { start: { offset?: number } };
  children?: MarkdownNode[];
  data?: { hProperties?: Record<string, unknown> };
  url?: string;
  alt?: string;
};
export const DIAGRAM_URL = "source-dev-diagram:";
export function lessonMarkdownPlugin(idPrefix = "lesson-section") {
  return (tree: MarkdownNode) => {
    function visit(node: MarkdownNode) {
      if (node.type === "heading") {
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            id: `${idPrefix}-${node.position?.start.offset ?? 0}`,
          },
        };
      }
      if (!node.children) return;
      node.children = node.children.flatMap((child) => {
        if (child.type !== "text" || !child.value?.includes("{{diagram:"))
          return [child];
        const parts: MarkdownNode[] = [];
        let start = 0;
        for (const match of child.value.matchAll(
          /\{\{diagram:([A-Za-z0-9_-]+)\}\}/g,
        )) {
          if (match.index > start)
            parts.push({
              type: "text",
              value: child.value.slice(start, match.index),
            });
          parts.push({
            type: "image",
            url: `${DIAGRAM_URL}${match[1]}`,
            alt: "Lesson diagram",
          });
          start = match.index + match[0].length;
        }
        parts.push({ type: "text", value: child.value.slice(start) });
        return parts;
      });
      node.children.forEach(visit);
    }
    visit(tree);
  };
}
