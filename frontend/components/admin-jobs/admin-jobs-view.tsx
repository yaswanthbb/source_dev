"use client";
import { useEffect, useRef, useState } from "react";
import { RefreshCw, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { JobCard } from "@/components/generation/generation-view";
import {
  type GenerationFeed,
  type GenerationJob,
  GENERATION_TYPES,
} from "@/components/generation/generation-data";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import styles from "./admin-jobs.module.css";

export interface AdminJobsProps {
  earlier?: boolean;
  feed?: GenerationFeed;
  pending: boolean;
  error?: string;
  busy: boolean;
  lookup?: GenerationJob;
  lookupError: string;
  notice: string;
  paused: boolean;
  recovered: boolean;
  onRefresh: () => void;
  onLookup: (id: string) => void;
  onReview: (job: GenerationJob) => void;
  onRecover: () => void;
  onAdopt: () => void;
}
export function AdminJobsView(p: AdminJobsProps) {
  const feedback = useRef<HTMLParagraphElement>(null),
    listHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (p.notice) feedback.current?.focus();
  }, [p.notice]);
  const [section, setSection] = useState<"active" | "results">("active"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [id, setId] = useState("");
  const rows = (p.feed?.[section] ?? []).filter((j) =>
    `${j.id} ${j.targetId} ${j.resultSummary?.targetLabel ?? ""} ${GENERATION_TYPES[j.jobType].label} ${j.status} ${j.provider ?? ""} ${j.model ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 6)),
    current = Math.min(page, pages);
  const card = (job: GenerationJob) => (
    <JobCard
      key={job.id}
      job={job}
      showContentLink={false}
      canReview={
        !p.busy &&
        !p.paused &&
        !p.pending &&
        !p.error &&
        job.requestedByUserId === p.feed?.user.id
      }
      onReview={p.onReview}
    />
  );
  return (
    <div className={styles.page} aria-busy={p.busy || p.pending}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ADMIN WORKSPACE / AI JOBS</p>
          <h1>
            Follow the work.
            <br />
            <span>Read the result.</span>
          </h1>
          <p>Your generation activity, with a direct check for a known job.</p>
        </div>
        <svg
          className={styles.art}
          width="190"
          height="150"
          viewBox="0 0 190 150"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14 118H176M38 98V48H75V98M96 98V29H133V98"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M45 82L54 90L69 67M103 63L113 72L128 45"
            stroke="var(--gui-accent)"
            strokeWidth="3"
          />
          <circle
            cx="156"
            cy="27"
            r="9"
            fill="var(--gui-accent-soft)"
            stroke="var(--gui-accent)"
          />
          <path
            d="M144 98H167V64H144V98Z"
            fill="var(--gui-accent-soft)"
            stroke="var(--gui-accent)"
            strokeWidth="2"
          />
        </svg>
      </header>
      <div className={styles.toolbar}>
        <p>
          Lists show <strong>your account’s jobs</strong>. Check manually for
          updates.
        </p>
        <button
          type="button"
          disabled={p.busy || p.pending}
          onClick={p.onRefresh}
        >
          <RefreshCw size={15} aria-hidden="true" /> Refresh jobs
        </button>
      </div>
      {p.busy && (
        <p role="status" className={styles.hint}>
          Checking the requested operation. Further requests are paused while it
          finishes.
        </p>
      )}
      {p.notice && (
        <p ref={feedback} tabIndex={-1} role="status" className={styles.notice}>
          {p.notice}
        </p>
      )}
      {p.earlier && !p.paused && (
        <p className={styles.notice}>
          An earlier acknowledgement may still finish. Refresh and inspect
          changed results before another action.
        </p>
      )}
      {p.paused && (
        <GuiFeedback kind="error" title="Acknowledgements paused">
          <p>
            The earlier request may still finish. Checking saved state never
            repeats it. This pause applies while this page stays open.
          </p>
          <button type="button" disabled={p.busy} onClick={p.onRecover}>
            Check saved state
          </button>
          {p.recovered && (
            <button type="button" disabled={p.busy} onClick={p.onAdopt}>
              Use checked state and resume
            </button>
          )}
        </GuiFeedback>
      )}
      {p.pending ? (
        <GuiFeedback kind="loading" title="Checking your jobs">
          <p>
            Current values will appear after your admin account and job records
            are checked.
          </p>
        </GuiFeedback>
      ) : p.error || !p.feed ? (
        <GuiFeedback kind="error" title="Jobs unavailable">
          <p>{p.error || "Your jobs couldn’t be checked."}</p>
        </GuiFeedback>
      ) : (
        <>
          <div className={styles.tabs} aria-label="Job lists">
            {(["active", "results"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={s === section}
                onClick={() => {
                  setSection(s);
                  setPage(1);
                }}
              >
                {s === "active" ? "Active jobs" : "Unread results"} ·{" "}
                {p.feed![s].length}
              </button>
            ))}
          </div>
          <section aria-labelledby="admin-jobs-list">
            <div className={styles.sectionTop}>
              <h2 id="admin-jobs-list" ref={listHeading} tabIndex={-1}>
                {section === "active"
                  ? "Active jobs"
                  : "Unread finished results"}
              </h2>
              <span>
                Checked{" "}
                {new Date(p.feed.loadedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className={styles.hint}>
              Unread results are the newest 20 returned by the API; this is not
              a complete job history. Marking reviewed removes only that result
              from your unread banner and list. It does not approve generated
              content.
            </p>
            <label className={styles.search}>
              Search this list
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Target, job ID, status or model"
              />
            </label>
            {!rows.length ? (
              <p className={styles.empty}>
                {search
                  ? "No jobs match this search."
                  : section === "active"
                    ? "No active jobs in the checked response."
                    : "No unread results in the checked response."}
              </p>
            ) : (
              <div className={styles.grid}>
                {rows.slice((current - 1) * 6, current * 6).map(card)}
              </div>
            )}
            <nav className={styles.paging} aria-label="Job list pages">
              <button
                type="button"
                disabled={current === 1}
                onClick={() => {
                  setPage(current - 1);
                  listHeading.current?.focus();
                }}
              >
                Previous
              </button>
              <span>
                Page {current} of {pages} · {rows.length} shown in this list
              </span>
              <button
                type="button"
                disabled={current === pages}
                onClick={() => {
                  setPage(current + 1);
                  listHeading.current?.focus();
                }}
              >
                Next
              </button>
            </nav>
          </section>
        </>
      )}
      <section className={styles.lookup} aria-labelledby="admin-job-lookup">
        <h2 id="admin-job-lookup">Check a known job</h2>
        <p className={styles.hint}>
          Admins can inspect a known job ID from any requester. Only your own
          finished results can be marked reviewed. There is no platform-wide job
          listing API.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            p.onLookup(id.trim());
          }}
        >
          <label>
            Full job UUID
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              required
            />
          </label>
          <button
            type="submit"
            disabled={p.busy || p.pending || !p.feed || !!p.error}
          >
            Check job
          </button>
        </form>
        {p.lookupError && <p role="alert">{p.lookupError}</p>}
        {p.lookup && (
          <div className={styles.checked}>
            <p className={styles.hint}>
              Checked requester ID: <code>{p.lookup.requestedByUserId}</code>
            </p>
            {card(p.lookup)}
          </div>
        )}
      </section>
      <Link className={styles.link} href="/developer/generate">
        Open generation in developer workspace{" "}
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
