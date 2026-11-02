"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_CHANGED_EVENT, getToken, getUser } from "@/lib/auth";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { useUiMode } from "@/providers/ui-mode-provider";
import {
  EvaluationFailure,
  loadEvaluation,
  inspectEvaluation,
  type EvaluationInspection,
} from "./evaluation-client";
import { EvaluationView } from "./evaluation-view";
import { ExecutionPanel } from "./execution-panel";
import { ReleasePanel } from "./release-panel";
import {
  inspectApproval,
  submitRelease,
  recoverRelease,
  ReleaseFailure,
  type ReleaseRecovery,
} from "./release-client";
import {
  releaseSourceFingerprint,
  type ReleaseSource,
  type ApprovalEvidence,
  type ReleaseAction,
  type ReleaseOutcome,
} from "./release-data";
import { DecisionPanel } from "./decision-panel";
import {
  inspectDecision,
  submitDecision,
  recoverDecision,
  DecisionFailure,
  type DecisionRecovery,
} from "./decision-client";
import {
  decisionFingerprint,
  type DecisionRecord,
  type DecisionAction,
  type DecisionOutcome,
} from "./decision-data";
import {
  executeEvaluation,
  recoverExecution,
  ExecutionFailure,
  type ExecutionRecovery,
} from "./execution-client";
import {
  executionFingerprint,
  type ExecutionAction,
  type ExecutionOutcome,
} from "./execution-data";
export function GuiEvaluation() {
  const [session] = useState(getToken),
    [bound] = useState(getUser),
    [invalid, setInvalid] = useState(false),
    [busy, setBusy] = useState(false),
    [inspection, setInspection] = useState<EvaluationInspection>(),
    [error, setError] = useState(""),
    [executionError, setExecutionError] = useState(""),
    [outcome, setOutcome] = useState<ExecutionOutcome>(),
    [pause, setPause] = useState<{ action: ExecutionAction; ids: string[] }>(),
    [recovery, setRecovery] = useState<
      ExecutionRecovery | DecisionRecovery | ReleaseRecovery
    >(),
    [earlier, setEarlier] = useState(false),
    [decisionRecord, setDecisionRecord] = useState<DecisionRecord>(),
    [decisionError, setDecisionError] = useState(""),
    [decisionOutcome, setDecisionOutcome] = useState<DecisionOutcome>(),
    [decisionPause, setDecisionPause] = useState<{
      record: DecisionRecord;
      successorId?: string;
    }>(),
    [decisionEarlier, setDecisionEarlier] = useState(false),
    [releaseSource, setReleaseSource] = useState<ReleaseSource>(),
    [releaseEvidence, setReleaseEvidence] = useState<ApprovalEvidence>(),
    [releaseOutcome, setReleaseOutcome] = useState<ReleaseOutcome>(),
    [releaseError, setReleaseError] = useState(""),
    [releasePause, setReleasePause] = useState<ReleaseAction>(),
    [releaseEarlier, setReleaseEarlier] = useState(false);
  const cache = useQueryClient();
  const lock = useRef(false);
  const query = useQuery({
    queryKey: [
      "admin",
      "evaluation",
      bound?.id ?? "unchecked",
      bound?.role ?? "unchecked",
    ],
    queryFn: ({ signal }) =>
      loadEvaluation(bound ?? undefined, signal, session),
    enabled: !!session && !invalid,
    retry: false,
    staleTime: Infinity,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    const changed = () => setInvalid(true),
      stored = (e: StorageEvent) => {
        if (e.key === null || e.key === "sd_user" || e.key === "sd_token")
          changed();
      };
    window.addEventListener(AUTH_CHANGED_EVENT, changed);
    window.addEventListener("storage", stored);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, changed);
      window.removeEventListener("storage", stored);
    };
  }, []);
  const hidden =
    invalid ||
    !session ||
    getToken() !== session ||
    (query.error instanceof EvaluationFailure && query.error.unavailable);
  const library =
    !hidden && query.isFetchedAfterMount && !query.isError && !query.isFetching
      ? query.data
      : undefined;
  function current() {
    if (hidden || getToken() !== session) {
      setInvalid(true);
      return false;
    }
    return true;
  }
  async function run(
    action: () => Promise<void>,
    channel: "lookup" | "execution" | "decision" | "release" = "lookup",
  ) {
    if (lock.current || query.isFetching || !current()) return;
    lock.current = true;
    setBusy(true);
    if (channel === "lookup") {
      setError("");
      setInspection(undefined);
    } else if (channel === "execution") setExecutionError("");
    else if (channel === "decision") setDecisionError("");
    else setReleaseError("");
    try {
      await action();
    } catch (e) {
      if (e instanceof EvaluationFailure && e.unavailable) setInvalid(true);
      (channel === "lookup"
        ? setError
        : channel === "execution"
          ? setExecutionError
          : channel === "decision"
            ? setDecisionError
            : setReleaseError)(
        e instanceof EvaluationFailure
          ? e.message
          : "The record couldn’t be checked. Confirm its ID and retry.",
      );
    } finally {
      if (getToken() !== session) setInvalid(true);
      lock.current = false;
      setBusy(false);
    }
  }
  async function lookup(kind: "run" | "question", id: string) {
    if (!library) return;
    const value = await inspectEvaluation(kind, id, library.user, session);
    if (current()) setInspection(value);
  }
  async function perform(action: ExecutionAction) {
    if (!library || pause || decisionPause || releasePause) return;
    setRecovery(undefined);
    try {
      const result = await executeEvaluation(library, action, session);
      if (current()) {
        setOutcome(result);
        if (action.kind === "comparison") {
          setReleaseSource({ action, outcome: result, library });
          setReleaseEvidence(undefined);
        }
      }
    } catch (e) {
      if (e instanceof ExecutionFailure && e.uncertain) {
        setPause({ action, ids: e.knownRunIds });
        setEarlier(true);
        setOutcome(undefined);
      }
      throw e;
    }
  }
  async function recover() {
    if ((!pause && !decisionPause && !releasePause) || !query.data) return;
    setRecovery(undefined);
    const checked = releasePause
      ? await recoverRelease(query.data, releasePause, session)
      : decisionPause
        ? await recoverDecision(
            decisionPause.record,
            query.data.user,
            decisionPause.successorId,
            session,
          )
        : await recoverExecution(query.data, pause!.ids, session);
    if (current()) setRecovery(checked);
  }
  function resume() {
    if (
      lock.current ||
      (!pause && !decisionPause && !releasePause) ||
      !recovery ||
      !current()
    )
      return;
    cache.setQueryData(
      [
        "admin",
        "evaluation",
        bound?.id ?? "unchecked",
        bound?.role ?? "unchecked",
      ],
      recovery.library,
    );
    setPause(undefined);
    setDecisionPause(undefined);
    setReleasePause(undefined);
    setReleaseEvidence(undefined);
    setDecisionRecord(undefined);
    setRecovery(undefined);
    setExecutionError("");
    setDecisionError("");
    setReleaseError("");
  }
  async function checkDecision(
    kind: DecisionRecord["kind"],
    id: string,
    conceptId: string,
  ) {
    if (!library) return;
    setDecisionRecord(undefined);
    setDecisionOutcome(undefined);
    const record = await inspectDecision(
      kind,
      id,
      conceptId,
      library.user,
      session,
    );
    if (current()) setDecisionRecord(record);
  }
  async function decide(action: DecisionAction) {
    if (!library || pause || decisionPause || releasePause || !decisionRecord)
      return;
    if (
      decisionFingerprint(action.record) !== decisionFingerprint(decisionRecord)
    )
      throw new DecisionFailure(
        "Checked evidence changed. Check the original again before deciding.",
      );
    setRecovery(undefined);
    setDecisionOutcome(undefined);
    try {
      const result = await submitDecision(action, library.user, session);
      if (current()) {
        setDecisionOutcome(result);
        setDecisionRecord(undefined);
      }
    } catch (e) {
      if (e instanceof DecisionFailure && e.uncertain) {
        setDecisionPause({ record: action.record, successorId: e.successorId });
        setDecisionEarlier(true);
        setDecisionRecord(undefined);
      }
      throw e;
    }
  }
  async function checkRelease() {
    if (!library || !releaseSource) return;
    setReleaseEvidence(undefined);
    setReleaseOutcome(undefined);
    const checked = await inspectApproval(releaseSource, session);
    if (current()) setReleaseEvidence(checked);
  }
  async function changeRelease(action: ReleaseAction) {
    if (!library || pause || decisionPause || releasePause) return;
    if (
      action.kind === "approve" &&
      (!releaseEvidence ||
        !releaseSource ||
        executionFingerprint(action.evidence) !==
          executionFingerprint(releaseEvidence) ||
        releaseSourceFingerprint(action.evidence.source) !==
          releaseSourceFingerprint(releaseSource))
    )
      throw new ReleaseFailure(
        "The checked comparison changed. Check the retained evidence again.",
      );
    setRecovery(undefined);
    setReleaseOutcome(undefined);
    try {
      const result = await submitRelease(library, action, session);
      if (current()) {
        setReleaseOutcome(result);
        setReleaseEvidence(undefined);
      }
    } catch (e) {
      if (e instanceof ReleaseFailure && e.uncertain) {
        setReleasePause(action);
        setReleaseEarlier(true);
        setReleaseEvidence(undefined);
      }
      throw e;
    }
  }
  return (
    <GuiWorkspaceShell shell="admin" section="Evaluation" user={library?.user}>
      {hidden ? (
        <GuiFeedback kind="error" title="Admin access needs checking">
          <p>
            Cached evaluation and question data is hidden. Reload or sign in to
            check your current access.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload evaluation
          </button>
          <Link href="/login">Sign in</Link>
        </GuiFeedback>
      ) : (
        <EvaluationView
          releases={
            <ReleasePanel
              library={library}
              busy={busy || query.isFetching}
              source={library ? releaseSource : undefined}
              evidence={library ? releaseEvidence : undefined}
              outcome={library ? releaseOutcome : undefined}
              error={releaseError}
              paused={!!pause || !!decisionPause || !!releasePause}
              recovery={recovery}
              earlier={releaseEarlier}
              onCheck={() => run(checkRelease, "release")}
              onSubmit={(action) => run(() => changeRelease(action), "release")}
              onRecover={() => void run(recover, "release")}
              onResume={resume}
            />
          }
          decisions={
            <DecisionPanel
              library={library}
              busy={busy || query.isFetching}
              record={library ? decisionRecord : undefined}
              error={decisionError}
              outcome={library ? decisionOutcome : undefined}
              paused={!!pause || !!decisionPause || !!releasePause}
              recovery={recovery}
              earlier={decisionEarlier}
              onInspect={(kind, id, conceptId) =>
                run(() => checkDecision(kind, id, conceptId), "decision")
              }
              onSubmit={(action) => run(() => decide(action), "decision")}
              onRecover={() => void run(recover, "decision")}
              onResume={resume}
            />
          }
          execution={
            <ExecutionPanel
              library={library}
              busy={busy || query.isFetching}
              error={executionError}
              outcome={library ? outcome : undefined}
              paused={!!pause || !!decisionPause || !!releasePause}
              knownRunIds={pause?.ids ?? []}
              recovery={recovery}
              earlier={earlier}
              onExecute={(action) => run(() => perform(action), "execution")}
              onRecover={() => void run(recover, "execution")}
              onResume={resume}
            />
          }
          library={library}
          pending={
            query.isPending ||
            query.isFetching ||
            (!query.isFetchedAfterMount && !query.isError)
          }
          error={
            query.isError
              ? "Evaluation references couldn’t load. Refresh to try again."
              : undefined
          }
          busy={busy}
          inspection={library ? inspection : undefined}
          lookupError={library ? error : undefined}
          onRefresh={() =>
            void run(async () => {
              await query.refetch();
            })
          }
          onInspect={(kind, id) => void run(() => lookup(kind, id))}
        />
      )}
    </GuiWorkspaceShell>
  );
}
export function EvaluationPage() {
  const { ready, isCli, setMode } = useUiMode();
  if (!ready) return <ModeAwareLoader guiTitle="Opening evaluation" />;
  if (isCli)
    return (
      <div className="p-6 font-mono">
        <p>
          Evaluation workflows are available in the GUI workspace. The admin
          terminal has no evaluation commands.
        </p>
        <button
          type="button"
          className="border rounded px-4 min-h-11 mt-4"
          onClick={() => setMode("gui", { navigate: false })}
        >
          Open GUI evaluation
        </button>
        <Link className="block mt-4" href="/admin/terminal">
          Return to admin terminal
        </Link>
      </div>
    );
  return <GuiEvaluation />;
}
