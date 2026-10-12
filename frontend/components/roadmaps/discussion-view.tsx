"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  LockKeyhole,
  Check,
  ArrowRight,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { LearningCliLink } from "./roadmap-view";
import { LessonMarkdown } from "./lesson-markdown";
import {
  lessonRoute,
  moduleRoute,
  type CurriculumModule,
  type CurriculumLesson,
  type LearningRoadmap,
} from "./roadmap-data";
import {
  discussionDate,
  discussionPermissions,
  threadFingerprint,
  questionValidation,
  type DiscussionSnapshot,
  type DiscussionTarget,
  type DiscussionThread,
} from "./discussion-data";
import type { DiscussionAction, DiscussionOutcome } from "./discussion-client";
import styles from "./discussion.module.css";

type Editor = {
  kind: "reply" | "edit-question" | "edit-answer";
  thread: DiscussionThread;
  answerId?: string;
  body: string;
};
export function DiscussionView({
  roadmap,
  entry,
  lesson,
  data,
  pending = false,
  refreshing = false,
  canWrite = true,
  error,
  uncertain = false,
  recovered = false,
  outcome,
  onAction,
  onRefresh,
}: {
  roadmap: LearningRoadmap;
  entry: CurriculumModule;
  lesson: CurriculumLesson;
  data: DiscussionSnapshot;
  pending?: boolean;
  refreshing?: boolean;
  canWrite?: boolean;
  error?: string;
  uncertain?: boolean;
  recovered?: boolean;
  outcome?: DiscussionOutcome;
  onAction: (action: DiscussionAction) => void;
  onRefresh: () => Promise<DiscussionSnapshot | undefined> | void;
}) {
  const [target, setTarget] = useState<DiscussionTarget>("discussion");
  const [drafts, setDrafts] = useState({ discussion: "", ai: "" });
  const [consent, setConsent] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [confirmation, setConfirmation] = useState<DiscussionAction | null>(
    null,
  );
  const [invalid, setInvalid] = useState<string | undefined>();
  const [editorInvalid, setEditorInvalid] = useState<string | undefined>();
  const message = useRef<HTMLDivElement>(null),
    question = useRef<HTMLTextAreaElement>(null),
    editorInput = useRef<HTMLTextAreaElement>(null);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const editorTrigger = useRef<HTMLButtonElement | null>(null),
    confirmationTrigger = useRef<HTMLButtonElement | null>(null);
  const editorKey = editor
    ? `${editor.kind}:${editor.thread.id}:${editor.answerId ?? ""}`
    : "";
  const disabled = pending || refreshing || !canWrite;
  useEffect(() => {
    if (error) {
      setConsent(false);
      message.current?.focus();
    }
  }, [error]);
  useEffect(() => {
    if (!outcome) return;
    if (outcome.action.kind === "ask") {
      const channel = outcome.action.target;
      setDrafts((old) => ({ ...old, [channel]: "" }));
      setConsent(false);
    }
    if (
      outcome.action.kind !== "ask" &&
      !["verify", "unverify"].includes(outcome.action.kind)
    ) {
      const action = outcome.action;
      setEditor((old) =>
        old && old.thread.id === action.questionId ? null : old,
      );
    }
    setConfirmation(null);
    setInvalid(undefined);
    setEditorInvalid(undefined);
    message.current?.focus();
  }, [outcome]);
  useEffect(() => {
    if (editorKey) editorInput.current?.focus();
  }, [editorKey]);
  useEffect(() => {
    if (confirmation) confirmationHeading.current?.focus();
  }, [confirmation]);
  const all = data.threads.filter((q) => q.target === target);
  const filtered = all.filter((q) =>
    `${q.body} ${q.askerName ?? ""} ${q.answers.map((a) => a.body).join(" ")}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 8) - 1),
  );
  const threads = filtered.slice(currentPage * 8, (currentPage + 1) * 8);
  function openEditor(value: Editor, trigger: HTMLButtonElement) {
    editorTrigger.current = trigger;
    setEditor(value);
    setEditorInvalid(undefined);
  }
  function openConfirmation(
    value: DiscussionAction,
    trigger: HTMLButtonElement,
  ) {
    confirmationTrigger.current = trigger;
    setConfirmation(value);
  }
  function perform(action: DiscussionAction) {
    if (disabled) return;
    if ("body" in action) {
      const problem = questionValidation(action.body);
      if (problem) {
        (action.kind === "ask" ? setInvalid : setEditorInvalid)(problem);
        (action.kind === "ask" ? question : editorInput).current?.focus();
        return;
      }
    }
    setInvalid(undefined);
    setEditorInvalid(undefined);
    onAction(action);
  }
  async function refreshThreads() {
    const fresh = await onRefresh();
    if (fresh)
      setEditor((old) => {
        if (!old) return old;
        const thread = fresh.threads.find((q) => q.id === old.thread.id);
        // An explicit review of saved state rebases a retained draft. Background
        // refreshes never overwrite its original fingerprint or its text.
        return thread ? { ...old, thread } : old;
      });
  }
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/developer/roadmaps">Roadmaps</Link>
        <span>/</span>
        <Link
          href={`/developer/roadmaps/${encodeURIComponent(entry.location.roadmap)}`}
        >
          {roadmap.title}
        </Link>
        <span>/</span>
        <Link href={moduleRoute(entry.location)}>{entry.module.title}</Link>
        <span>/</span>
        <Link href={lessonRoute(lesson.location)}>{data.content.title}</Link>
      </nav>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>A question is a good next step</p>
          <h1>
            Think it through.
            <br />
            <span>Together, or with AI.</span>
          </h1>
          <p>
            Discussion for <strong>{data.content.title}</strong>. Compare ideas
            with other developers, or ask privately about the lesson.
          </p>
          <Link className={styles.back} href={lessonRoute(lesson.location)}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to lesson
          </Link>
        </div>
        <svg className={styles.motif} viewBox="0 0 220 150" aria-hidden="true">
          <path
            className={styles.draw}
            d="M20 50h70q20 0 20 20v20q0 20 20 20h70M20 110h60q20 0 20-20V70q0-20 20-20h80"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="15" y="32" width="46" height="34" rx="12" />
          <rect x="157" y="91" width="46" height="34" rx="12" />
          <circle cx="38" cy="110" r="6" />
          <circle cx="181" cy="50" r="6" />
          <path
            d="M29 49h18m120 59h18"
            stroke="var(--gui-surface)"
            strokeWidth="2"
          />
        </svg>
      </header>
      <div className={styles.channels} aria-label="Question visibility">
        <button
          type="button"
          aria-pressed={target === "discussion"}
          disabled={pending}
          onClick={() => {
            setTarget("discussion");
            setPage(0);
            setSearch("");
            setConfirmation(null);
            setInvalid(undefined);
          }}
        >
          <MessageCircle size={18} aria-hidden="true" />
          Public discussion{" "}
          <span>
            {data.threads.filter((q) => q.target === "discussion").length}
          </span>
        </button>
        <button
          type="button"
          aria-pressed={target === "ai"}
          disabled={pending}
          onClick={() => {
            setTarget("ai");
            setPage(0);
            setSearch("");
            setConfirmation(null);
            setInvalid(undefined);
          }}
        >
          <LockKeyhole size={18} aria-hidden="true" />
          Private Ask AI{" "}
          <span>{data.threads.filter((q) => q.target === "ai").length}</span>
        </button>
      </div>
      <div className={styles.layout}>
        <div className={styles.main}>
          {pending && (
            <GuiFeedback kind="loading" title="Checking access and saving">
              <p>
                {target === "ai"
                  ? "AI replies can take a little longer. Leaving this page cannot cancel a request already sent to the server."
                  : "Please wait for the server’s confirmation."}
              </p>
            </GuiFeedback>
          )}
          {error ? (
            <GuiFeedback
              ref={message}
              kind="error"
              title={
                uncertain
                  ? "This action isn’t confirmed"
                  : "The action couldn’t finish"
              }
            >
              <p>{error}</p>
              <button
                type="button"
                className={styles.secondary}
                disabled={pending || refreshing}
                onClick={() => void refreshThreads()}
              >
                {refreshing ? "Checking…" : "Check saved threads"}
              </button>
            </GuiFeedback>
          ) : (
            outcome && (
              <GuiFeedback ref={message} kind="success" title={outcome.message}>
                <p>
                  The server confirmed this action. Reload the list if it hasn’t
                  appeared yet.
                </p>
              </GuiFeedback>
            )
          )}
          {recovered && (
            <GuiFeedback kind="info" title="Fresh threads checked">
              <p>
                Look for your previous question or reply before posting again.
                An unfinished AI request may still be running. A new request can
                duplicate it and incur another charge.
              </p>
            </GuiFeedback>
          )}
          <form
            className={styles.composer}
            onSubmit={(event) => {
              event.preventDefault();
              if (target === "ai" && !consent) return;
              perform({ kind: "ask", target, body: drafts[target] });
            }}
          >
            <div className={styles.composerHeading}>
              <h2>
                {target === "ai"
                  ? "Ask about the lesson"
                  : "Start a conversation"}
              </h2>
              <span className={styles.badge}>
                {target === "ai" ? "Private" : "Public"}
              </span>
            </div>
            <p id="question-privacy">
              {target === "ai"
                ? "Your question and replies are visible only to you and admins. They are sent to the configured AI provider, not posted in public discussion."
                : "Your question is shared with anyone who can read this lesson. Any developer can reply."}
            </p>
            <label htmlFor="discussion-question">Your question</label>
            <textarea
              ref={question}
              id="discussion-question"
              rows={4}
              maxLength={4000}
              required
              disabled={pending}
              aria-invalid={!!invalid}
              aria-describedby={`question-privacy${invalid ? " question-error" : ""}`}
              value={drafts[target]}
              onChange={(e) => {
                setDrafts({ ...drafts, [target]: e.target.value });
                setInvalid(undefined);
              }}
              placeholder="Which part would you like to understand better?"
            />
            {invalid && (
              <p role="alert" id="question-error">
                {invalid}
              </p>
            )}
            {target === "ai" && (
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={pending}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                I understand this sends one AI request; daily limits and
                provider charges may apply.
              </label>
            )}
            <div className={styles.formFooter}>
              <span>{drafts[target].length.toLocaleString()} / 4,000</span>
              <button
                className={styles.primary}
                disabled={disabled || (target === "ai" && !consent)}
                type="submit"
              >
                {pending
                  ? "Saving…"
                  : target === "ai"
                    ? "Send AI request"
                    : "Post question"}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </form>
          <section aria-labelledby="thread-heading">
            <div className={styles.listHeading}>
              <h2 id="thread-heading">
                {target === "ai"
                  ? data.viewer.role === "admin"
                    ? "Private threads · admin view"
                    : "Your private threads"
                  : "Lesson discussion"}
              </h2>
              <button
                type="button"
                className={styles.secondary}
                disabled={pending || refreshing}
                onClick={() => void refreshThreads()}
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
            <label className={styles.search}>
              Search {target === "ai" ? "private threads" : "discussion"}
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            {!threads.length && (
              <div className={styles.empty}>
                <MessageCircle size={28} aria-hidden="true" />
                <h3>
                  {search
                    ? "No matching threads"
                    : target === "ai"
                      ? "Your questions stay out of the public board."
                      : "No questions here yet."}
                </h3>
                <p>
                  {search
                    ? "Try another phrase or clear the search."
                    : target === "ai"
                      ? "An AI request appears here after it is saved. No AI call is made just by opening this page."
                      : "Something unclear? Your question could help the next person, too."}
                </p>
              </div>
            )}
            {threads.map((thread) => {
              const permissions = discussionPermissions(data, thread);
              const base = {
                questionId: thread.id,
                fingerprint: threadFingerprint(thread),
              };
              return (
                <article
                  className={styles.thread}
                  key={thread.id}
                  id={`thread-${thread.id}`}
                >
                  <div className={styles.threadMeta}>
                    <span className={styles.avatar} aria-hidden="true">
                      {(thread.askerName || "D")
                        .slice(0, 1)
                        .toLocaleUpperCase()}
                    </span>
                    <div>
                      <strong>
                        {thread.askerId === data.viewer.id
                          ? "You"
                          : thread.askerName || "Developer"}
                      </strong>
                      <time dateTime={thread.createdAt}>
                        {discussionDate(thread.createdAt)}
                      </time>
                    </div>
                    <span className={styles.badge}>
                      {thread.target === "ai" ? "Private AI" : "Public"}
                    </span>
                  </div>
                  <p className={styles.question}>{thread.body}</p>
                  <div className={styles.actions}>
                    {permissions.reply && (
                      <button
                        disabled={disabled}
                        onClick={(event) =>
                          openEditor(
                            { kind: "reply", thread, body: "" },
                            event.currentTarget,
                          )
                        }
                      >
                        Reply
                      </button>
                    )}
                    {permissions.editQuestion && (
                      <button
                        disabled={disabled}
                        onClick={(event) =>
                          openEditor(
                            {
                              kind: "edit-question",
                              thread,
                              body: thread.body,
                            },
                            event.currentTarget,
                          )
                        }
                      >
                        Edit question
                      </button>
                    )}
                    {permissions.deleteQuestion && (
                      <button
                        disabled={disabled}
                        onClick={(event) =>
                          openConfirmation(
                            { ...base, kind: "delete-question" },
                            event.currentTarget,
                          )
                        }
                      >
                        Delete question
                      </button>
                    )}
                  </div>
                  {!thread.answers.length && (
                    <p className={styles.quiet}>
                      {thread.target === "ai"
                        ? "No AI reply is saved. The request may have failed or may still be running. Refresh before sending another request."
                        : "No replies yet. Be the first to add an idea."}
                    </p>
                  )}
                  {thread.answers.map((answer) => {
                    const ap = discussionPermissions(data, thread, answer);
                    return (
                      <section
                        className={styles.answer}
                        key={answer.id}
                        aria-label={
                          answer.isAiAnswer ? "AI reply" : "Developer reply"
                        }
                      >
                        <div className={styles.answerMeta}>
                          <strong>
                            {answer.isAiAnswer
                              ? "AI Assistant"
                              : answer.responderId === data.viewer.id
                                ? "You"
                                : answer.responderName || "Developer"}
                          </strong>
                          {answer.isVerified && (
                            <span className={styles.verified}>
                              <Check size={14} aria-hidden="true" />
                              Verified
                            </span>
                          )}
                          <time dateTime={answer.createdAt}>
                            {discussionDate(answer.createdAt)}
                          </time>
                        </div>
                        <LessonMarkdown
                          content={answer.body}
                          idPrefix={`answer-${answer.id}`}
                        />
                        <div className={styles.actions}>
                          {ap.editAnswer && (
                            <button
                              disabled={disabled}
                              onClick={(event) =>
                                openEditor(
                                  {
                                    kind: "edit-answer",
                                    thread,
                                    answerId: answer.id,
                                    body: answer.body,
                                  },
                                  event.currentTarget,
                                )
                              }
                            >
                              Edit reply
                            </button>
                          )}
                          {ap.deleteAnswer && (
                            <button
                              disabled={disabled}
                              onClick={(event) =>
                                openConfirmation(
                                  {
                                    ...base,
                                    answerId: answer.id,
                                    kind: "delete-answer",
                                  },
                                  event.currentTarget,
                                )
                              }
                            >
                              Delete reply
                            </button>
                          )}
                          {ap.verify && (
                            <button
                              disabled={disabled}
                              onClick={() =>
                                perform({
                                  ...base,
                                  answerId: answer.id,
                                  kind: answer.isVerified
                                    ? "unverify"
                                    : "verify",
                                })
                              }
                            >
                              {answer.isVerified
                                ? "Remove verification"
                                : "Verify answer"}
                            </button>
                          )}
                        </div>
                      </section>
                    );
                  })}
                  {editor?.thread.id === thread.id && (
                    <form
                      className={styles.editor}
                      onSubmit={(e) => {
                        e.preventDefault();
                        perform({
                          ...base,
                          fingerprint: threadFingerprint(editor.thread),
                          kind: editor.kind,
                          answerId: editor.answerId,
                          body: editor.body,
                        });
                      }}
                    >
                      <label htmlFor={`reply-${thread.id}`}>
                        {editor.kind === "reply"
                          ? "Your public reply"
                          : "Edit your message"}
                      </label>
                      <textarea
                        ref={editorInput}
                        id={`reply-${thread.id}`}
                        required
                        rows={4}
                        maxLength={4000}
                        disabled={pending}
                        value={editor.body}
                        aria-invalid={!!editorInvalid}
                        aria-describedby={
                          editorInvalid ? `reply-error-${thread.id}` : undefined
                        }
                        onChange={(e) => {
                          setEditor({ ...editor, body: e.target.value });
                          setEditorInvalid(undefined);
                        }}
                      />
                      {editorInvalid && (
                        <p role="alert" id={`reply-error-${thread.id}`}>
                          {editorInvalid}
                        </p>
                      )}
                      <div className={styles.actions}>
                        <button
                          type="submit"
                          className={styles.primary}
                          disabled={disabled}
                        >
                          {pending
                            ? "Saving…"
                            : editor.kind === "reply"
                              ? "Post reply"
                              : "Save changes"}
                        </button>
                        <button
                          type="button"
                          className={styles.secondary}
                          disabled={pending}
                          onClick={() => {
                            setEditor(null);
                            setEditorInvalid(undefined);
                            editorTrigger.current?.focus();
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  {confirmation &&
                    confirmation.kind.startsWith("delete") &&
                    "questionId" in confirmation &&
                    confirmation.questionId === thread.id && (
                      <div
                        className={styles.confirmation}
                        role="group"
                        aria-label="Confirm deletion"
                      >
                        <h3 ref={confirmationHeading} tabIndex={-1}>
                          Delete{" "}
                          {confirmation.kind === "delete-question"
                            ? "this question and all its replies"
                            : "this reply"}
                          ?
                        </h3>
                        <p>
                          This permanently removes the saved text. It cannot
                          undo an AI request or its provider charges.
                        </p>
                        <div className={styles.actions}>
                          <button
                            className={styles.primary}
                            disabled={disabled}
                            onClick={() => perform(confirmation)}
                          >
                            Yes, delete
                          </button>
                          <button
                            disabled={pending}
                            className={styles.secondary}
                            onClick={() => {
                              setConfirmation(null);
                              confirmationTrigger.current?.focus();
                            }}
                          >
                            Keep it
                          </button>
                        </div>
                      </div>
                    )}
                </article>
              );
            })}
            {filtered.length > 8 && (
              <nav className={styles.pagination} aria-label="Discussion pages">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage + 1} of {Math.ceil(filtered.length / 8)}
                </span>
                <button
                  disabled={(currentPage + 1) * 8 >= filtered.length}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </section>
        </div>
        <aside className={styles.aside} aria-label="Discussion guide">
          <div>
            <p className={styles.eyebrow}>Good questions connect ideas</p>
            <h2>
              A little context
              <br />
              goes a long way.
            </h2>
            <ol>
              <li>Name the part of the lesson you mean.</li>
              <li>Share what you tried or how you understood it.</li>
              <li>Ask one clear question at a time.</li>
            </ol>
          </div>
          <div>
            <h3>What does verified mean?</h3>
            <p>
              The lesson author or an admin marked the answer verified. Their
              own public replies are verified on arrival. AI answers cannot be
              verified.
            </p>
          </div>
          <div>
            <h3>Keep secrets out of questions.</h3>
            <p>
              Don’t include passwords, tokens or personal details—even in Ask
              AI. Private questions are still accessible to admins and sent to
              your configured provider.
            </p>
            <Link href="/developer/keys">Manage AI provider keys</Link>
          </div>
          <LearningCliLink
            location={lesson.location}
            conceptId={data.content.id}
            discussion
          >
            Open this discussion in terminal
          </LearningCliLink>
        </aside>
      </div>
    </div>
  );
}
