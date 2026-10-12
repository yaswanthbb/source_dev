"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Layers3,
  Sparkles,
  ListChecks,
  Search,
  Check,
  GitBranch,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  contentDate,
  type ContentLibrary,
} from "@/components/content/content-data";
import type { EditorData } from "@/components/content/editor-data";
import {
  GENERATION_TYPES,
  generationTargetLabel,
  generationStartIssue,
  generationRequiredSlots,
  generationSettingsFingerprint,
  editorFingerprint,
  type GenerationRequest,
  type GenerationSettings,
  type GenerationFeed,
  type GenerationJob,
  type GenerationIntent,
  type GenerationKind,
  type GenerationModels,
} from "./generation-data";
import base from "@/components/content/new-lesson.module.css";
import styles from "./generation.module.css";

export interface GenerationViewProps {
  request: GenerationRequest;
  library?: ContentLibrary;
  libraryLoading?: boolean;
  libraryError?: string;
  settings?: GenerationSettings;
  settingsLoading?: boolean;
  settingsError?: string;
  feed?: GenerationFeed;
  jobsLoading?: boolean;
  jobsError?: string;
  jobsRefreshing?: boolean;
  selectedRoadmapId: string;
  target?: EditorData;
  targetLoading?: boolean;
  targetError?: string;
  catalog?: GenerationModels;
  modelsLoading?: boolean;
  modelsError?: string;
  refreshing?: boolean;
  pending?: boolean;
  canStart?: boolean;
  canReview?: boolean;
  error?: string;
  uncertain?: boolean;
  knownJobId?: string;
  result?: { kind: "start" | "review"; job: GenerationJob };
  checkVersion?: number;
  recovered?: boolean;
  watched?: GenerationJob;
  watchedLoading?: boolean;
  watchedError?: string;
  autoRefresh?: boolean;
  onAutoRefresh?: (enabled: boolean) => void;
  onRoadmap: (id: string) => void;
  onCheck: () => void;
  onLoadModels: () => void;
  onStart: (intent: GenerationIntent) => void;
  onReview: (job: GenerationJob) => void;
  onLookup: (id: string) => void;
  onClassic?: () => void;
}
export function GenerationView({
  request,
  library,
  libraryLoading = false,
  libraryError,
  settings,
  settingsLoading = false,
  settingsError,
  feed,
  jobsLoading = false,
  jobsError,
  jobsRefreshing = false,
  selectedRoadmapId,
  target,
  targetLoading = false,
  targetError,
  catalog,
  modelsLoading = false,
  modelsError,
  refreshing = false,
  pending = false,
  canStart = false,
  canReview = false,
  error,
  uncertain = false,
  knownJobId,
  result,
  checkVersion = 0,
  recovered = false,
  watched,
  watchedLoading = false,
  watchedError,
  autoRefresh = true,
  onAutoRefresh,
  onRoadmap,
  onCheck,
  onLoadModels,
  onStart,
  onReview,
  onLookup,
  onClassic,
}: GenerationViewProps) {
  const [kind, setKind] = useState<GenerationKind>(
      request.moduleId ? "module_concepts" : "roadmap_modules",
    ),
    [moduleId, setModuleId] = useState(request.moduleId ?? ""),
    [model, setModel] = useState(""),
    [jobId, setJobId] = useState(request.jobId ?? ""),
    [validation, setValidation] = useState<{
      message: string;
      field: string;
    }>(),
    [attempt, setAttempt] = useState(0),
    [confirmation, setConfirmation] = useState<
      (GenerationIntent & { snapshot: string }) | null
    >(null),
    [consent, setConsent] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    summary = useRef<HTMLDivElement>(null),
    feedback = useRef<HTMLDivElement>(null),
    checked = useRef<HTMLDivElement>(null);
  const intent: GenerationIntent = {
    kind,
    roadmapId: selectedRoadmapId,
    targetId: kind === "roadmap_modules" ? selectedRoadmapId : moduleId,
    model,
  };
  const settingsKey = settings ? generationSettingsFingerprint(settings) : "",
    targetKey = target ? editorFingerprint(target) : "",
    activeKey =
      feed?.active
        .filter((j) => j.targetId === intent.targetId)
        .map((j) => j.id)
        .sort()
        .join(",") ?? "";
  const snapshot = `${settingsKey}/${targetKey}/${activeKey}/${settings?.quota.remaining ?? "unknown"}/${JSON.stringify(intent)}`,
    previous = useRef(snapshot);
  const catalogCurrent =
    !!settings && !!catalog && catalog.settingsFingerprint === settingsKey;
  const issue =
    target && settings && feed
      ? generationStartIssue(target, settings, feed, intent, catalog)
      : undefined;
  const selectedKey = settings?.keys.find((k) => k.isDefault),
    providerName = settings?.providers.find(
      (p) => p.provider === settings.quota.provider,
    )?.displayName;
  const roadmaps =
    library?.roadmaps.filter((r) => r.status !== "removed") ?? [];
  const requestedUnavailable =
    request.invalid ||
    (!!request.roadmapId &&
      !!library &&
      !roadmaps.some((r) => r.id === request.roadmapId)) ||
    (!!request.moduleId &&
      !!target &&
      request.roadmapId === target.roadmap.id &&
      !target.modules.some((m) => m.id === request.moduleId));
  useEffect(() => {
    if (previous.current !== snapshot) {
      previous.current = snapshot;
      setConfirmation(null);
      setConsent(false);
    }
  }, [snapshot]);
  useEffect(() => {
    if (confirmation && !dialog.current?.open) {
      dialog.current?.showModal();
      cancel.current?.focus();
    }
    if (!confirmation && dialog.current?.open) {
      dialog.current.close();
      trigger.current?.focus();
    }
  }, [confirmation]);
  useEffect(() => {
    if (attempt) summary.current?.focus();
  }, [attempt]);
  useEffect(() => {
    if (error || result) feedback.current?.focus();
  }, [error, result]);
  useEffect(() => {
    if (checkVersion > 0) checked.current?.focus();
  }, [checkVersion]);
  const locked = pending || refreshing || modelsLoading;
  const confirmationCurrent = confirmation?.snapshot === snapshot;
  return (
    <div className={`${base.page} ${styles.page}`}>
      <nav className={base.breadcrumb} aria-label="Generation breadcrumb">
        <Link href="/developer/content">
          <ArrowLeft size={16} aria-hidden="true" />
          My content
        </Link>
        <span aria-hidden="true">/</span>
        <span>AI generation & jobs</span>
      </nav>
      <header className={base.hero}>
        <div>
          <p className={base.eyebrow}>A starting point. Still your craft.</p>
          <h1>
            Make room for
            <br />
            <span>the next connection.</span>
          </h1>
          <p>
            Build a course outline, draft a module’s lessons, or add assessment
            questions. Choose the scope, review the provider, then follow the
            saved job.
          </p>
          <div className={base.actions}>
            <a className={base.primary} href="#generation-form">
              Choose what to generate
              <Sparkles size={16} aria-hidden="true" />
            </a>
            <a className={base.secondary} href="#generation-jobs">
              View jobs & results
            </a>
            {onClassic && (
              <button
                className={base.secondary}
                type="button"
                onClick={onClassic}
              >
                Classic authoring
              </button>
            )}
          </div>
        </div>
        <svg viewBox="0 0 220 170" className={base.motif} aria-hidden="true">
          <path
            className={base.draw}
            pathLength={130}
            d="M42 40h65v45h68M107 85v45H42"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="24" y="22" width="36" height="36" rx="8" />
          <rect x="157" y="67" width="36" height="36" rx="8" />
          <rect x="24" y="112" width="36" height="36" rx="8" />
          <circle cx="107" cy="85" r="8" fill="var(--gui-accent)" />
        </svg>
      </header>
      <div className={base.checkbar}>
        <span>
          Checks read saved data. Opening this page does not start generation or
          mark results reviewed.
        </span>
        <button
          className={base.secondary}
          type="button"
          disabled={locked || libraryLoading}
          onClick={onCheck}
        >
          {refreshing ? "Checking…" : "Recheck workspace"}
        </button>
      </div>
      {libraryLoading && (
        <GuiFeedback kind="loading" title="Preparing generation">
          <p>Checking your account and owned roadmaps.</p>
        </GuiFeedback>
      )}
      {libraryError && (
        <GuiFeedback kind="error" title="Owned roadmaps couldn't refresh">
          <p>{libraryError}</p>
          <p>Your selections are kept; generation is paused.</p>
        </GuiFeedback>
      )}
      {requestedUnavailable && (
        <GuiFeedback kind="info" title="The linked target couldn't be selected">
          <p>
            Choose an available owned roadmap and module below. The link never
            starts generation automatically.
          </p>
        </GuiFeedback>
      )}
      {pending && (
        <GuiFeedback
          kind="loading"
          title="Checking and submitting your request"
        >
          <p>
            Keep this page open to see the checked result. Closing it cannot
            cancel a request already sent.
          </p>
        </GuiFeedback>
      )}
      {error ? (
        <GuiFeedback
          ref={feedback}
          kind="error"
          title={
            uncertain
              ? "Request isn't confirmed"
              : "The request couldn't finish"
          }
        >
          <p>{error}</p>
          {knownJobId && (
            <p>
              Returned job ID: <code>{knownJobId}</code>
            </p>
          )}
          <button
            className={base.secondary}
            type="button"
            disabled={locked}
            onClick={onCheck}
          >
            Check jobs and saved state
          </button>
        </GuiFeedback>
      ) : (
        result && (
          <GuiFeedback
            ref={feedback}
            kind={
              result.job.status === "failed" && result.kind === "start"
                ? "info"
                : "success"
            }
            title={
              result.kind === "review"
                ? "Result marked reviewed"
                : "Job accepted and saved record checked"
            }
          >
            <p>
              {result.kind === "review"
                ? "The result is now acknowledged. Generated content is kept; this does not delete or cancel a job."
                : `Status when accepted: ${result.job.status}. Current activity and results appear below. Generation does not approve lessons or publish a roadmap.`}
            </p>
            <p>
              Job ID: <code>{result.job.id}</code>
            </p>
          </GuiFeedback>
        )
      )}
      {checkVersion > 0 && !error && (
        <GuiFeedback
          ref={checked}
          kind="info"
          title={
            recovered
              ? "Fresh checks finished; review before another request"
              : "Workspace checked"
          }
        >
          <p>
            {recovered
              ? "An earlier request may still finish or incur charges. A fresh read cannot cancel it or prove which request created a matching job. Review activity, results and any returned ID before choosing to generate again."
              : "Your selections are kept. Review the current target, default key and allowance before another action."}
          </p>
        </GuiFeedback>
      )}
      <div className={styles.workbench}>
        <section
          className={`${base.composer} ${styles.builder}`}
          aria-labelledby="generation-heading"
        >
          <div className={base.sectionHeading}>
            <div>
              <p className={base.eyebrow}>Set the scope</p>
              <h2 id="generation-heading">What needs a starting point?</h2>
            </div>
            <Layers3 size={24} aria-hidden="true" />
          </div>
          <form
            id="generation-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!canStart || !target || !settings || !feed) return;
              if (issue) {
                setValidation({
                  message: issue,
                  field: issue.startsWith("Load a current model")
                    ? "generation-model"
                    : issue.startsWith("At least")
                      ? "generation-provider-heading"
                      : kind === "roadmap_modules"
                        ? "generation-roadmap"
                        : "generation-module",
                });
                setAttempt((v) => v + 1);
                return;
              }
              setValidation(undefined);
              setConsent(false);
              setConfirmation({ ...intent, snapshot });
            }}
          >
            {validation && (
              <GuiFeedback
                ref={summary}
                kind="error"
                title="Review the generation scope"
              >
                <p>
                  <a href={`#${validation.field}`}>{validation.message}</a>
                </p>
              </GuiFeedback>
            )}
            <label htmlFor="generation-roadmap">Owned roadmap</label>
            <select
              id="generation-roadmap"
              value={selectedRoadmapId}
              disabled={locked || libraryLoading}
              onChange={(event) => {
                setModuleId("");
                setValidation(undefined);
                onRoadmap(event.target.value);
              }}
            >
              <option value="">Choose a roadmap</option>
              {roadmaps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            {library && !roadmaps.length && (
              <p className={base.hint}>
                Create a roadmap in{" "}
                <Link href="/developer/content">My content</Link> before
                generating modules or lessons.
              </p>
            )}
            <fieldset className={styles.actionsField} disabled={pending}>
              <legend>Generate</legend>
              {Object.entries(GENERATION_TYPES).map(([value, option]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="generation-kind"
                    value={value}
                    checked={kind === value}
                    onChange={() => {
                      setKind(value as GenerationKind);
                      setValidation(undefined);
                    }}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            {kind !== "roadmap_modules" && (
              <>
                <label htmlFor="generation-module">
                  Module in this roadmap
                </label>
                <select
                  id="generation-module"
                  value={moduleId}
                  disabled={pending || !target || targetLoading}
                  onChange={(event) => {
                    setModuleId(event.target.value);
                    setValidation(undefined);
                  }}
                >
                  <option value="">Choose a module</option>
                  {target?.modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} · {m.lessons.length} lessons
                    </option>
                  ))}
                </select>
              </>
            )}
            {targetLoading && (
              <GuiFeedback kind="loading" title="Checking the roadmap">
                <p>Confirming owned modules and lessons before generation.</p>
              </GuiFeedback>
            )}
            {targetError && (
              <GuiFeedback
                kind="error"
                title="The generation target couldn't be checked"
              >
                <p>{targetError}</p>
              </GuiFeedback>
            )}
            {target && (
              <div className={styles.targetNote}>
                <GitBranch size={18} aria-hidden="true" />
                <p>
                  {target.modules.length} modules in “{target.roadmap.title}” ·{" "}
                  {target.roadmap.status}.{" "}
                  {kind !== "roadmap_modules" &&
                    target.modules.find((m) => m.id === moduleId) &&
                    `Selected module has ${target.modules.find((m) => m.id === moduleId)!.lessons.length} attached lessons.`}
                </p>
              </div>
            )}
            <label htmlFor="generation-model">Model choice</label>
            <select
              id="generation-model"
              value={model}
              disabled={pending || !settings}
              onChange={(event) => {
                setModel(event.target.value);
                setValidation(undefined);
              }}
            >
              <option value="">
                Automatic · key, task or provider default
              </option>
              {model &&
                (!catalogCurrent || !catalog?.models.includes(model)) && (
                  <option value={model}>
                    Previously selected · reload models to verify
                  </option>
                )}
              {catalogCurrent &&
                catalog.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>
            <p className={base.hint}>
              Load available models in the provider panel to choose an override.
              A configured fallback may be used if a model is retired.
            </p>
            {issue && <p className={base.fieldError}>{issue}</p>}
            <div className={base.saveRow}>
              <p>
                <Sparkles size={16} aria-hidden="true" />
                Review scope, quota, provider charges and automatic retries
                before starting.
              </p>
              <button
                ref={trigger}
                className={base.primary}
                type="submit"
                disabled={!canStart || locked}
              >
                Review generation
              </button>
            </div>
          </form>
        </section>
        <aside
          className={base.notes}
          aria-labelledby="generation-provider-heading"
        >
          <p className={base.eyebrow}>Your current setup</p>
          <h2 id="generation-provider-heading" tabIndex={-1}>
            Provider & allowance
          </h2>
          {settingsLoading && (
            <p className={base.hint}>
              Checking your default key and applicable quota…
            </p>
          )}
          {kind === "module_mcqs" && (
            <p className={base.hint}>
              Questions use saved lesson bodies. Pending drafts stay separate;
              review the saved text before adding assessments.
            </p>
          )}
          {settingsError && (
            <GuiFeedback kind="error" title="Generation settings unavailable">
              <p>{settingsError}</p>
              <p>
                Jobs and results remain available when their own checks succeed.
              </p>
            </GuiFeedback>
          )}
          {settings && (
            <>
              <span className={base.badge}>
                {providerName ?? settings.quota.provider}
              </span>
              <h3>
                {selectedKey
                  ? selectedKey.label || "Your default key"
                  : "Shared NVIDIA service"}
              </h3>
              <p>
                {selectedKey
                  ? `Stored key ····${selectedKey.keyHint}. Key secrets never appear here.`
                  : "No default key is selected. Generations use the shared service."}
              </p>
              <div className={styles.allowance}>
                <strong>
                  {settings.quota.unlimited
                    ? "Unlimited quota"
                    : `${settings.quota.remaining} / ${settings.quota.limit}`}
                </strong>
                <span>
                  {settings.quota.unlimited
                    ? "Admin quota bypass · provider charges may still apply"
                    : `Remaining today · ${settings.quota.tier === "own-key" ? "this default key’s bucket" : "shared-service bucket"}`}
                </span>
              </div>
              <p className={base.hint}>
                Daily usage follows your account timezone. Quota is an
                allowance, not a price or a reservation of future capacity.
              </p>
              <div className={base.noteDivider} />
              <button
                className={base.secondary}
                type="button"
                disabled={locked || modelsLoading || !!settingsError}
                onClick={onLoadModels}
              >
                {modelsLoading ? "Loading models…" : "Load available models"}
              </button>
              {catalogCurrent && (
                <p>
                  {catalog.live
                    ? "Live model catalog"
                    : "Curated fallback · availability unverified"}{" "}
                  · {catalog.models.length} models returned.
                </p>
              )}
              {modelsError && (
                <GuiFeedback kind="error" title="Model catalog couldn't load">
                  <p>{modelsError}</p>
                </GuiFeedback>
              )}
              <p className={base.hint}>
                Loading models contacts the selected provider’s metadata
                endpoint. It does not start a generation job.
              </p>
            </>
          )}
          <Link className={base.textLink} href="/developer/keys">
            Manage provider keys · Classic view
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <div className={base.noteDivider} />
          <h3>Review the output</h3>
          <p>
            Generated modules and lessons are saved by the job. New lessons need
            review; questions are attached to eligible lessons. Inspect the
            result before publishing or relying on generated content.
          </p>
          <Link className={base.textLink} href="/developer/content">
            Open My content
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </aside>
      </div>
      <section
        id="generation-jobs"
        className={styles.jobs}
        aria-labelledby="generation-jobs-heading"
      >
        <div className={styles.jobsHeading}>
          <div>
            <p className={base.eyebrow}>Follow the work</p>
            <h2 id="generation-jobs-heading">Jobs & unread results</h2>
            <p>
              Closing the page does not cancel jobs. Marking a result reviewed
              keeps its generated content.
            </p>
          </div>
          {onAutoRefresh && (
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => onAutoRefresh(event.target.checked)}
              />
              Refresh jobs automatically
            </label>
          )}
        </div>
        <p className={base.hint}>
          {autoRefresh
            ? "Read-only job checks every 5 seconds while this page is visible; checks pause on errors."
            : "Automatic checks are paused. Recheck the workspace to load current activity."}
        </p>
        {jobsLoading && (
          <GuiFeedback kind="loading" title="Loading your jobs">
            <p>Checking active jobs and unread finished results.</p>
          </GuiFeedback>
        )}
        {jobsError && (
          <GuiFeedback kind="error" title="Job activity couldn't refresh">
            <p>{jobsError}</p>
            <p>
              Any displayed records are from the last successful check;
              generation and review acknowledgement are paused.
            </p>
          </GuiFeedback>
        )}
        {feed && (
          <>
            <p
              className={styles.feedStatus}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {feed.active.length} active{" "}
              {feed.active.length === 1 ? "job" : "jobs"} ·{" "}
              {feed.results.length} unread
              {feed.results.length === 1 ? " result" : " results"} loaded.
            </p>
            {jobsRefreshing && (
              <p className={base.hint} aria-hidden="true">
                Checking current activity…
              </p>
            )}
            <div className={styles.jobColumns}>
              <section aria-labelledby="active-jobs-heading">
                <h3 id="active-jobs-heading">Active jobs</h3>
                {!feed.active.length ? (
                  <p className={styles.empty}>
                    No active jobs in the checked response.
                  </p>
                ) : (
                  feed.active.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onReview={onReview}
                      canReview={false}
                    />
                  ))
                )}
              </section>
              <section aria-labelledby="unread-jobs-heading">
                <h3 id="unread-jobs-heading">Unread results</h3>
                {!feed.results.length ? (
                  <p className={styles.empty}>
                    No unread results in the checked response.
                  </p>
                ) : (
                  feed.results.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onReview={onReview}
                      canReview={canReview}
                    />
                  ))
                )}
              </section>
            </div>
            <p className={base.hint}>
              The unread endpoint returns up to 20 results. This is not a
              complete job history; inspect a known ID below.
            </p>
          </>
        )}
      </section>
      <section
        className={`${base.composer} ${styles.lookup}`}
        aria-labelledby="generation-lookup-heading"
      >
        <div className={base.sectionHeading}>
          <div>
            <p className={base.eyebrow}>Keep a reference</p>
            <h2 id="generation-lookup-heading">Check a known job</h2>
          </div>
          <Search size={24} aria-hidden="true" />
        </div>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onLookup(jobId);
          }}
        >
          <label htmlFor="generation-job-id">Your job ID</label>
          <div className={styles.lookupRow}>
            <input
              id="generation-job-id"
              type="text"
              value={jobId}
              onChange={(event) => setJobId(event.target.value)}
              placeholder="Full job UUID"
              spellCheck={false}
              autoComplete="off"
              aria-describedby="job-lookup-help"
              disabled={pending}
            />
            <button
              className={base.secondary}
              type="submit"
              disabled={locked || !library}
            >
              Check job
            </button>
          </div>
          <p className={base.hint} id="job-lookup-help">
            A read-only check of a job requested by your account. It does not
            retry generation.
          </p>
        </form>
        {watchedLoading && (
          <GuiFeedback kind="loading" title="Checking the job">
            <p>Loading its saved status and result.</p>
          </GuiFeedback>
        )}
        {watchedError && (
          <GuiFeedback kind="error" title="The job couldn't be checked">
            <p>{watchedError}</p>
          </GuiFeedback>
        )}
        {watched && !watchedError && (
          <div className={styles.checkedJob}>
            <p className={base.hint} role="status">
              Checked job status: {watched.status} · Updated{" "}
              {contentDate(watched.updatedAt)}.
            </p>
            <JobCard job={watched} onReview={onReview} canReview={canReview} />
          </div>
        )}
      </section>
      <p className={base.hint}>
        Single-lesson AI authoring remains available in the developer terminal
        through <code>concept ai</code>.
      </p>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="generation-confirm-title"
        aria-describedby="generation-confirm-description"
        onCancel={(event) => {
          event.preventDefault();
          setConfirmation(null);
          setConsent(false);
        }}
      >
        <span className={styles.dialogIcon}>
          <Sparkles size={24} aria-hidden="true" />
        </span>
        <h2 id="generation-confirm-title">Start this generation job?</h2>
        <div id="generation-confirm-description">
          <p>
            <strong>
              {confirmation
                ? GENERATION_TYPES[confirmation.kind].label
                : "Generation"}
            </strong>{" "}
            for “
            {confirmation && target
              ? generationTargetLabel(target, confirmation)
              : "the checked target"}
            ”.
          </p>
          <p>
            Provider: <strong>{providerName ?? "Checking provider"}</strong>.{" "}
            {selectedKey
              ? `Default key ····${selectedKey.keyHint}. Your provider may charge this key.`
              : "Uses the shared service and its applicable allowance."}{" "}
            Requested model:{" "}
            {confirmation?.model || "Automatic (key, task or provider default)"}
            . Configured fallbacks may be used.
          </p>
          {confirmation && target && settings && (
            <p>
              {settings.quota.unlimited
                ? "Admin quota is unlimited; this is not a guarantee of free provider usage."
                : `At least ${generationRequiredSlots(target, confirmation)} quota slot(s) must remain to start. ${settings.quota.remaining} remaining at the last check.`}{" "}
              Quota is checked again; it is not reserved. A batch can finish
              partially.
            </p>
          )}
          <p>
            This sends the selected roadmap/module and relevant lesson content
            to the provider as needed and writes generated content to your
            course. The service can automatically retry failed items and
            malformed question output, adding provider calls or charges. Closing
            this page does not cancel the job.
          </p>
          {target?.roadmap.status === "published" && (
            <p>
              This roadmap is published. New modules and assessment questions
              can affect its current structure or lessons immediately. Newly
              generated lessons remain subject to review.
            </p>
          )}
        </div>
        <label className={styles.consent}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            disabled={!confirmationCurrent || !canStart || locked}
          />
          <span>
            I agree to generate{" "}
            {confirmation
              ? GENERATION_TYPES[confirmation.kind].label.toLowerCase()
              : "this content"}
            {confirmation && target
              ? ` for “${generationTargetLabel(target, confirmation)}”`
              : ""}
            {` using ${providerName ?? "the checked provider"}${selectedKey ? ` key ····${selectedKey.keyHint}` : " shared service"}`}
            . This uses quota and may incur provider charges, including
            automatic retries.
          </span>
        </label>
        <div className={styles.dialogActions}>
          <button
            ref={cancel}
            className={base.secondary}
            type="button"
            onClick={() => {
              setConfirmation(null);
              setConsent(false);
            }}
          >
            Keep reviewing
          </button>
          <button
            className={base.primary}
            type="button"
            disabled={!consent || !confirmationCurrent || !canStart || locked}
            onClick={() => {
              if (
                !consent ||
                !confirmation ||
                !confirmationCurrent ||
                !canStart ||
                locked
              )
                return;
              const { kind, roadmapId, targetId, model } = confirmation;
              const approved = { kind, roadmapId, targetId, model };
              setConfirmation(null);
              setConsent(false);
              onStart(approved);
            }}
          >
            Start generation job
          </button>
        </div>
      </dialog>
    </div>
  );
}
function JobCard({
  job,
  canReview,
  onReview,
}: {
  job: GenerationJob;
  canReview: boolean;
  onReview: (job: GenerationJob) => void;
}) {
  const summary = job.resultSummary,
    active = job.status === "pending" || job.status === "running";
  return (
    <article className={styles.jobCard}>
      <div className={styles.jobCardHeading}>
        <ListChecks size={18} aria-hidden="true" />
        <h4>{GENERATION_TYPES[job.jobType].label}</h4>
        <span>{job.status}</span>
      </div>
      <p className={styles.targetName}>
        {summary?.targetLabel || `Target ${job.targetId}`}
      </p>
      {active &&
        (job.progressTotal ? (
          <div className={styles.progress}>
            <progress
              aria-label={`${GENERATION_TYPES[job.jobType].label} reported steps`}
              value={job.progressCurrent}
              max={job.progressTotal}
            />
            <p>
              {job.progressCurrent} of {job.progressTotal} reported steps. Steps
              can represent compiler stages, not lessons.
            </p>
          </div>
        ) : (
          <p className={base.hint}>Waiting for a reported work total.</p>
        ))}
      {summary ? (
        <>
          <dl className={styles.counts}>
            <div>
              <dt>Created</dt>
              <dd>{summary.createdCount}</dd>
            </div>
            <div>
              <dt>Failed</dt>
              <dd>{summary.failedCount}</dd>
            </div>
            <div>
              <dt>Skipped</dt>
              <dd>{summary.skippedCount}</dd>
            </div>
          </dl>
          <p className={base.hint}>Reported unit: {summary.itemNoun}.</p>
        </>
      ) : (
        !active && (
          <p className={base.hint}>
            Detailed result counts are unavailable for this record.
          </p>
        )
      )}
      {job.errorMessage && (
        <p className={styles.jobError}>{job.errorMessage}</p>
      )}
      {job.retryOfJobId && (
        <p className={base.hint}>
          Automatic retry of <code>{job.retryOfJobId}</code>. Its final summary
          can include original successes.
        </p>
      )}
      <details>
        <summary>
          Job details
          {summary?.failedItems.length
            ? ` · ${summary.failedItems.length} failed ${summary.failedItems.length === 1 ? "item" : "items"}`
            : ""}
        </summary>
        <p>
          Job ID: <code>{job.id}</code>
        </p>
        <p>
          Target ID: <code>{job.targetId}</code>
        </p>
        <p>
          Requested provider/model snapshot:{" "}
          {job.provider ?? "Unavailable for this legacy job"} ·{" "}
          {job.model ?? "Unavailable"}. This does not identify every model that
          actually served a call.
        </p>
        <p>
          Created {contentDate(job.createdAt)} · Updated{" "}
          {contentDate(job.updatedAt)}.
        </p>
        {summary?.failedItems.length ? (
          <ul className={styles.failedItems}>
            {summary.failedItems.map((item, index) => (
              <li key={`${index}-${item.title}`}>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </details>
      {job.acknowledgedAt ? (
        <p className={styles.reviewed}>
          <Check size={15} aria-hidden="true" />
          Marked reviewed
        </p>
      ) : (
        !active && (
          <button
            className={base.secondary}
            type="button"
            disabled={!canReview}
            onClick={() => onReview(job)}
          >
            Mark this result reviewed
          </button>
        )
      )}
      <Link className={base.textLink} href="/developer/content">
        Review generated content
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </article>
  );
}
