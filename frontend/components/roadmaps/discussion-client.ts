import apiClient from "@/lib/api-client";
import {
  findModule,
  findLesson,
  type LearningRoadmap,
  type CurriculumModule,
  type CurriculumLesson,
} from "./roadmap-data";
import {
  parseDiscussion,
  discussionPermissions,
  discussionId,
  threadFingerprint,
  questionValidation,
  type DiscussionSnapshot,
  type DiscussionTarget,
} from "./discussion-data";

export class DiscussionFailure extends Error {
  constructor(
    message: string,
    public uncertain = false,
    public unavailable = false,
  ) {
    super(message);
  }
}
export function discussionError(error: unknown): string {
  if (error instanceof DiscussionFailure) return error.message;
  return "Discussion couldn’t load. Check your connection and reload. Your text is kept on this page.";
}
export function discussionUnavailable(error: unknown) {
  return error instanceof DiscussionFailure
    ? error.unavailable
    : [401, 403, 404].includes(
        (error as { response?: { status?: number } })?.response?.status ?? 0,
      );
}
export async function loadDiscussion(conceptId: string, signal?: AbortSignal) {
  discussionId(conceptId);
  const options = { signal, timeout: 12000 };
  const [content, viewer] = await Promise.all([
    apiClient.get(`/concepts/${encodeURIComponent(conceptId)}`, options),
    apiClient.get("/users/me", options),
  ]);
  const questions = await apiClient.get(
    `/concepts/${encodeURIComponent(conceptId)}/qa-questions`,
    options,
  );
  try {
    return parseDiscussion(
      content.data,
      viewer.data,
      questions.data,
      conceptId,
    );
  } catch (error) {
    throw new DiscussionFailure(
      error instanceof Error ? error.message : "Discussion data is incomplete.",
      false,
      true,
    );
  }
}
export type DiscussionAction =
  | { kind: "ask"; target: DiscussionTarget; body: string }
  | {
      kind: "reply" | "edit-question" | "edit-answer";
      questionId: string;
      answerId?: string;
      fingerprint: string;
      body: string;
    }
  | {
      kind: "delete-question" | "delete-answer" | "verify" | "unverify";
      questionId: string;
      answerId?: string;
      fingerprint: string;
    };

export async function submitDiscussionAction(
  roadmap: LearningRoadmap,
  name: string,
  entry: CurriculumModule,
  lesson: CurriculumLesson,
  snapshot: DiscussionSnapshot,
  action: DiscussionAction,
) {
  if ("body" in action) {
    const invalid = questionValidation(action.body);
    if (invalid) throw new DiscussionFailure(invalid);
  }
  if (
    action.kind === "ask" &&
    action.target !== "ai" &&
    action.target !== "discussion"
  )
    throw new DiscussionFailure("Choose where to post your question.");
  let current: DiscussionSnapshot;
  try {
    const [parent, fresh] = await Promise.all([
      apiClient.get<LearningRoadmap>(
        `/roadmaps/${encodeURIComponent(roadmap.id)}`,
        { timeout: 12000 },
      ),
      loadDiscussion(lesson.placement.conceptId),
    ]);
    const currentModule = findModule(parent.data, name, entry.module.id);
    const placement =
      currentModule && findLesson(currentModule, lesson.placement.id);
    if (
      parent.data.id !== roadmap.id ||
      !placement ||
      placement.placement.conceptId !== lesson.placement.conceptId
    )
      throw new DiscussionFailure(
        "This lesson placement is no longer available. Return to the module.",
        false,
        true,
      );
    current = fresh;
  } catch (error) {
    if (error instanceof DiscussionFailure) throw error;
    throw new DiscussionFailure(
      "Current lesson access or discussion couldn’t be checked. Reload before saving.",
      false,
      discussionUnavailable(error),
    );
  }
  if (
    current.viewer.id !== snapshot.viewer.id ||
    current.viewer.role !== snapshot.viewer.role
  )
    throw new DiscussionFailure(
      "Your account or permissions changed. Reload before saving.",
      false,
      true,
    );
  let path: string, method: "post" | "patch" | "delete", payload: unknown;
  if (action.kind === "ask") {
    path = `/concepts/${encodeURIComponent(current.content.id)}/qa-questions`;
    method = "post";
    payload = { body: action.body.trim(), target: action.target };
  } else {
    const thread = current.threads.find((q) => q.id === action.questionId);
    if (!thread || threadFingerprint(thread) !== action.fingerprint)
      throw new DiscussionFailure(
        "This thread changed or disappeared. Reload it before saving.",
      );
    const answer = thread.answers.find((a) => a.id === action.answerId);
    const permissions = discussionPermissions(current, thread, answer);
    const permitted =
      action.kind === "reply"
        ? permissions.reply
        : action.kind === "edit-question"
          ? permissions.editQuestion
          : action.kind === "delete-question"
            ? permissions.deleteQuestion
            : action.kind === "edit-answer"
              ? permissions.editAnswer
              : action.kind === "delete-answer"
                ? permissions.deleteAnswer
                : permissions.verify;
    if (!permitted)
      throw new DiscussionFailure(
        "You cannot perform this action on the current thread.",
      );
    const questionPath = `/qa-questions/${encodeURIComponent(discussionId(thread.id))}`;
    path =
      action.kind === "reply"
        ? `${questionPath}/answers`
        : action.kind === "edit-question" || action.kind === "delete-question"
          ? questionPath
          : `/answers/${encodeURIComponent(discussionId(answer?.id))}${action.kind === "verify" || action.kind === "unverify" ? `/${action.kind}` : ""}`;
    method = action.kind.startsWith("delete")
      ? "delete"
      : action.kind === "reply"
        ? "post"
        : "patch";
    payload = "body" in action ? { body: action.body.trim() } : undefined;
  }
  const ai = action.kind === "ask" && action.target === "ai";
  let raw: unknown;
  try {
    const options = { timeout: ai ? 180000 : 12000 };
    // A single write only. Reads/recovery never retry a paid or uncertain action.
    raw = (
      method === "delete"
        ? await apiClient.delete(path, options)
        : method === "post"
          ? await apiClient.post(path, payload, options)
          : await apiClient.patch(path, payload, options)
    ).data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    const uncertain = ai || !status || status >= 500;
    const message =
      status === 429
        ? "The applicable AI allowance is exhausted. Check saved threads; your private question may have been saved."
        : status === 403
          ? "Access, edit permissions or AI configuration changed. Check saved threads and your provider keys."
          : status === 404
            ? "This thread or answer is no longer available. Reload the discussion."
            : status === 400
              ? "The server couldn’t accept this message. Check the text and reload."
              : "The save couldn’t be confirmed. It may already have completed; check saved threads before taking another action.";
    throw new DiscussionFailure(
      message,
      uncertain,
      status === 401 || (!ai && (status === 403 || status === 404)),
    );
  }
  if (method !== "delete") {
    try {
      const value = raw as Record<string, unknown>;
      discussionId(value?.id);
      if (action.kind === "ask") {
        if (
          value.conceptId !== current.content.id ||
          value.askerId !== current.viewer.id ||
          value.target !== action.target ||
          value.body !== action.body.trim()
        )
          throw new Error();
        if (
          ai &&
          (!Array.isArray(value.answers) ||
            !value.answers.some(
              (a: {
                id?: string;
                responderId?: string | null;
                questionId?: string;
                isAiAnswer?: boolean;
                body?: string;
              }) =>
                a.questionId === value.id &&
                !!discussionId(a.id) &&
                a.responderId === null &&
                a.isAiAnswer === true &&
                typeof a.body === "string" &&
                a.body.trim(),
            ))
        )
          throw new Error();
      } else if (action.kind === "edit-question") {
        if (
          value.id !== action.questionId ||
          value.body !== action.body.trim() ||
          value.target !==
            current.threads.find((q) => q.id === action.questionId)?.target
        )
          throw new Error();
      } else if (action.kind === "reply") {
        if (
          value.questionId !== action.questionId ||
          value.responderId !== current.viewer.id ||
          value.body !== action.body.trim()
        )
          throw new Error();
      } else if (
        value.id !== action.answerId ||
        (action.kind === "edit-answer"
          ? value.body !== action.body.trim()
          : value.isVerified !== (action.kind === "verify"))
      )
        throw new Error();
    } catch {
      throw new DiscussionFailure(
        "The server response was incomplete. The action may have saved; check saved threads before trying anything again.",
        true,
      );
    }
  }
  return {
    action,
    message: ai
      ? "AI reply saved"
      : action.kind === "ask"
        ? "Question posted"
        : action.kind === "reply"
          ? "Reply posted"
          : action.kind.startsWith("delete")
            ? "Deletion confirmed"
            : action.kind === "verify"
              ? "Answer verified"
              : action.kind === "unverify"
                ? "Verification removed"
                : "Changes saved",
  };
}
export type DiscussionOutcome = Awaited<
  ReturnType<typeof submitDiscussionAction>
>;
