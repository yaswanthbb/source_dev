export type DiscussionTarget = "discussion" | "ai";
export interface DiscussionViewer {
  id: string;
  role: "developer" | "admin";
}
export interface DiscussionAnswer {
  id: string;
  questionId: string;
  responderId: string | null;
  responderName: string | null;
  body: string;
  isAiAnswer: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface DiscussionThread {
  id: string;
  conceptId: string;
  askerId: string;
  askerName: string | null;
  target: DiscussionTarget;
  body: string;
  createdAt: string;
  updatedAt: string;
  answers: DiscussionAnswer[];
}
export interface DiscussionSnapshot {
  viewer: DiscussionViewer;
  content: { id: string; title: string; authorId: string | null };
  threads: DiscussionThread[];
}
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Discussion data is incomplete. Reload before continuing.");
  return value as Record<string, unknown>;
};
export function discussionId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(value))
    throw new Error("Discussion data is incomplete. Reload before continuing.");
  return value;
}
function text(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Discussion data is incomplete. Reload before continuing.");
  return value;
}
function date(value: unknown): string {
  const result = text(value);
  if (!Number.isFinite(Date.parse(result)))
    throw new Error(
      "Discussion dates are incomplete. Reload before continuing.",
    );
  return result;
}
const name = (value: unknown) => (value === null ? null : text(value));
const flag = (value: unknown) => {
  if (typeof value !== "boolean")
    throw new Error("Discussion data is incomplete. Reload before continuing.");
  return value;
};
export function parseDiscussion(
  contentValue: unknown,
  viewerValue: unknown,
  value: unknown,
  conceptId: string,
): DiscussionSnapshot {
  const c = record(contentValue),
    v = record(viewerValue);
  if (c.id !== conceptId || (v.role !== "admin" && v.role !== "developer"))
    throw new Error("Lesson or account changed. Reload before continuing.");
  const viewer: DiscussionViewer = { id: discussionId(v.id), role: v.role };
  const content = {
    id: conceptId,
    title: text(c.title),
    authorId: c.authorId == null ? null : discussionId(c.authorId),
  };
  if (!Array.isArray(value))
    throw new Error("Discussion data is incomplete. Reload before continuing.");
  const seen = new Set<string>(),
    answersSeen = new Set<string>();
  const threads = value.map((raw): DiscussionThread => {
    const q = record(raw),
      id = discussionId(q.id);
    // Never guess that an old API's missing target means public discussion.
    if (q.target !== "discussion" && q.target !== "ai")
      throw new Error(
        "The discussion privacy contract is unavailable. Update the backend and reload.",
      );
    if (q.conceptId !== conceptId || seen.has(id) || !Array.isArray(q.answers))
      throw new Error(
        "Discussion data is incomplete. Reload before continuing.",
      );
    seen.add(id);
    const askerId = discussionId(q.askerId);
    if (q.target === "ai" && viewer.role !== "admin" && askerId !== viewer.id)
      throw new Error(
        "A private thread was returned for another account. Discussion has been hidden; reload or contact an admin.",
      );
    const answers = q.answers
      .map((rawAnswer): DiscussionAnswer => {
        const a = record(rawAnswer),
          aid = discussionId(a.id);
        if (a.questionId !== id || answersSeen.has(aid))
          throw new Error(
            "Discussion data is incomplete. Reload before continuing.",
          );
        answersSeen.add(aid);
        const isAiAnswer = flag(a.isAiAnswer);
        if (isAiAnswer && q.target !== "ai")
          throw new Error(
            "The AI reply privacy contract is inconsistent. Reload the discussion.",
          );
        if (isAiAnswer && viewer.role !== "admin" && askerId !== viewer.id)
          throw new Error(
            "A private AI reply was returned for another account. Discussion has been hidden.",
          );
        return {
          id: aid,
          questionId: id,
          responderId:
            a.responderId === null ? null : discussionId(a.responderId),
          responderName: name(a.responderName),
          body: text(a.body),
          isAiAnswer,
          isVerified: flag(a.isVerified),
          createdAt: date(a.createdAt),
          updatedAt: date(a.updatedAt),
        };
      })
      .sort(
        (a, b) =>
          Number(b.isVerified) - Number(a.isVerified) ||
          Date.parse(a.createdAt) - Date.parse(b.createdAt),
      );
    return {
      id,
      conceptId,
      askerId,
      askerName: name(q.askerName),
      target: q.target,
      body: text(q.body),
      createdAt: date(q.createdAt),
      updatedAt: date(q.updatedAt),
      answers,
    };
  });
  return { content, viewer, threads };
}
export function discussionPermissions(
  snapshot: DiscussionSnapshot,
  thread: DiscussionThread,
  answer?: DiscussionAnswer,
) {
  const admin = snapshot.viewer.role === "admin",
    mine = thread.askerId === snapshot.viewer.id;
  const visible = thread.target === "discussion" || mine || admin;
  return {
    reply: visible && thread.target === "discussion",
    editQuestion: visible && (admin || (mine && !thread.answers.length)),
    deleteQuestion: visible && (mine || admin),
    editAnswer:
      visible &&
      !!answer &&
      (admin || answer.responderId === snapshot.viewer.id),
    deleteAnswer:
      visible &&
      !!answer &&
      (admin || answer.responderId === snapshot.viewer.id),
    verify:
      visible &&
      !!answer &&
      !answer.isAiAnswer &&
      (admin || snapshot.content.authorId === snapshot.viewer.id),
  };
}
export function threadFingerprint(thread: DiscussionThread) {
  return JSON.stringify([
    thread.id,
    thread.target,
    thread.body,
    thread.updatedAt,
    thread.answers.map((a) => [a.id, a.body, a.isVerified, a.updatedAt]),
  ]);
}
export function discussionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
export function questionValidation(body: string) {
  return !body.trim()
    ? "Enter your question or reply."
    : body.trim().length > 4000
      ? "Keep your message within 4,000 characters."
      : undefined;
}
