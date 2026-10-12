"use client";

import { useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  useRoadmapDetail,
  useRoadmapProgress,
} from "@/lib/hooks/use-roadmap-progress";
import type { User } from "@/lib/auth";
import {
  isValidSegment,
  ROOT,
  sameLocation,
  toCliRoute,
} from "@/lib/terminal/location";
import { useUiMode } from "@/providers/ui-mode-provider";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { ModeAwareLoader } from "@/components/loaders/mode-aware-loader";
import { resource } from "@/components/dashboard/gui-dashboard";
import {
  DataState,
  BrowserCard,
  RoadmapBrowser,
  RoadmapOverview,
} from "./roadmap-view";
import {
  findRoadmap,
  findModule,
  findLesson,
  moduleOverviewLocation,
  overviewLocation,
  type LearningRoadmap,
} from "./roadmap-data";
import { ModuleOverview } from "./module-view";
import { GuiLesson } from "./gui-lesson";
import { GuiQuiz } from "./gui-quiz";
import styles from "./roadmaps.module.css";

function useCatalog() {
  return useQuery<LearningRoadmap[]>({
    queryKey: ["roadmaps"],
    queryFn: async ({ signal }) =>
      (
        await apiClient.get<LearningRoadmap[]>("/roadmaps", {
          signal,
          timeout: 12000,
        })
      ).data,
    retry: 1,
  });
}
function ConnectedCard({ roadmap }: { roadmap: LearningRoadmap }) {
  const progress = useRoadmapProgress(roadmap.id);
  return <BrowserCard roadmap={roadmap} progress={resource(progress)} />;
}
function CatalogPage() {
  const catalog = useCatalog();
  const { ready, location, setLocation } = useUiMode();
  useEffect(() => {
    if (ready && !sameLocation(location, ROOT)) setLocation(ROOT);
  }, [ready, location, setLocation]);
  return (
    <RoadmapBrowser
      source={resource(catalog)}
      renderCard={(roadmap) => (
        <ConnectedCard key={roadmap.id} roadmap={roadmap} />
      )}
    />
  );
}
function OverviewPage({
  reference,
  moduleReference,
  conceptReference,
  quiz = false,
}: {
  reference: string;
  moduleReference?: string;
  conceptReference?: string;
  quiz?: boolean;
}) {
  const Reader = quiz ? GuiQuiz : GuiLesson;
  const catalog = useCatalog();
  const found = findRoadmap(catalog.data ?? [], reference);
  // The detail API accepts an ID, whereas the mode-switch location uses a VFS name.
  // Resolve both through the same visible catalog; never invent a slug API endpoint.
  const detail = useRoadmapDetail(found?.roadmap.id);
  const progress = useRoadmapProgress(detail.data?.id);
  const entry =
    found && detail.data && moduleReference
      ? findModule(detail.data as LearningRoadmap, found.name, moduleReference)
      : undefined;
  const lesson =
    entry && conceptReference ? findLesson(entry, conceptReference) : undefined;
  const { ready, location, setLocation } = useUiMode();
  const unavailable =
    !!detail.error &&
    [401, 403, 404].includes(
      (detail.error as { response?: { status: number } }).response?.status ?? 0,
    );
  useEffect(() => {
    if (!ready || !detail.data || !found || unavailable || conceptReference)
      return;
    if (moduleReference && !entry) return;
    const next = entry
      ? moduleOverviewLocation(location, entry.location)
      : overviewLocation(location, found.name);
    if (!sameLocation(next, location)) setLocation(next);
  }, [
    ready,
    detail.data,
    found,
    entry,
    moduleReference,
    location,
    setLocation,
    unavailable,
    conceptReference,
  ]);
  return (
    <>
      <DataState source={resource(catalog)} label="Roadmap catalog">
        {found ? (
          <DataState
            source={resource(detail)}
            label="Roadmap"
            unavailable={unavailable}
          >
            {detail.data &&
              (moduleReference ? (
                entry ? (
                  conceptReference ? (
                    lesson ? (
                      <Reader
                        key={`${entry.module.id}:${lesson.placement.id}:${lesson.placement.conceptId}`}
                        roadmap={detail.data as LearningRoadmap}
                        name={found.name}
                        entry={entry}
                        lesson={lesson}
                        contextReady={
                          !catalog.isFetching &&
                          !catalog.isError &&
                          !detail.isFetching &&
                          !detail.isError
                        }
                      />
                    ) : (
                      <GuiFeedback kind="error" title="Lesson unavailable">
                        <p>
                          This lesson no longer belongs to this module, or isn’t
                          shared with you.
                        </p>
                        <Link
                          href={`/developer/roadmaps/${encodeURIComponent(found.name)}/modules/${encodeURIComponent(entry.location.module)}`}
                        >
                          Back to the module
                        </Link>
                      </GuiFeedback>
                    )
                  ) : (
                    <ModuleOverview
                      roadmap={detail.data as LearningRoadmap}
                      name={found.name}
                      entry={entry}
                      progress={resource(progress)}
                    />
                  )
                ) : (
                  <GuiFeedback kind="error" title="Module unavailable">
                    <p>
                      This module may have been removed or may no longer belong
                      to this roadmap.
                    </p>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => void detail.refetch()}
                      disabled={detail.isFetching}
                    >
                      {detail.isFetching ? "Checking…" : "Check again"}
                    </button>
                    <Link
                      className={styles.textLink}
                      href={`/developer/roadmaps/${encodeURIComponent(found.name)}`}
                    >
                      Back to this roadmap
                    </Link>
                  </GuiFeedback>
                )
              ) : (
                <RoadmapOverview
                  roadmap={detail.data as LearningRoadmap}
                  name={found.name}
                  progress={resource(progress)}
                />
              ))}
          </DataState>
        ) : (
          <GuiFeedback kind="error" title="Roadmap unavailable">
            <p>
              This roadmap may have been removed or may no longer be shared with
              you.
            </p>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => void catalog.refetch()}
              disabled={catalog.isFetching}
            >
              {catalog.isFetching ? "Checking…" : "Check again"}
            </button>
          </GuiFeedback>
        )}
      </DataState>
      <Link className={styles.textLink} href="/developer/roadmaps">
        Back to all roadmaps
      </Link>
    </>
  );
}
function GuiLearningPage({
  reference,
  moduleReference,
  conceptReference,
  quiz,
}: {
  reference?: string;
  moduleReference?: string;
  conceptReference?: string;
  quiz?: boolean;
}) {
  const user = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: async ({ signal }) =>
      (await apiClient.get<User>("/users/me", { signal, timeout: 12000 })).data,
    retry: 1,
  });
  return (
    <GuiWorkspaceShell user={user.data} section="Roadmaps">
      {reference ? (
        isValidSegment(reference) &&
        (!moduleReference || isValidSegment(moduleReference)) &&
        (!conceptReference ||
          (!!moduleReference && isValidSegment(conceptReference))) ? (
          <OverviewPage
            reference={reference}
            moduleReference={moduleReference}
            conceptReference={conceptReference}
            quiz={quiz}
          />
        ) : (
          <GuiFeedback kind="error" title="Invalid roadmap link">
            <p>Choose a roadmap from the browser to get back on track.</p>
            <Link href="/developer/roadmaps">Browse roadmaps</Link>
          </GuiFeedback>
        )
      ) : (
        <CatalogPage />
      )}
    </GuiWorkspaceShell>
  );
}
// Direct CLI-mode visits can contain API IDs. Resolve both references under the
// visible parent before handing off; a URL ID is not a canonical terminal name.
export function ModuleCliHandoff({
  reference,
  moduleReference,
  guiWasShown,
  conceptReference,
  quiz,
}: {
  reference: string;
  moduleReference: string;
  guiWasShown?: RefObject<boolean>;
  conceptReference?: string;
  quiz?: boolean;
}) {
  const catalog = useCatalog();
  const found = findRoadmap(catalog.data ?? [], reference);
  const detail = useRoadmapDetail(found?.roadmap.id);
  const entry =
    found && detail.data
      ? findModule(detail.data as LearningRoadmap, found.name, moduleReference)
      : undefined;
  const router = useRouter();
  const lesson =
    entry && conceptReference ? findLesson(entry, conceptReference) : undefined;
  const { location } = useUiMode();
  const failure =
    catalog.isError ||
    detail.isError ||
    (!catalog.isPending && !found) ||
    (!!detail.data && !entry) ||
    (!!entry && !!conceptReference && !lesson);
  useEffect(() => {
    if (
      entry &&
      !failure &&
      !catalog.isFetching &&
      !detail.isFetching &&
      !guiWasShown?.current
    )
      router.replace(
        toCliRoute(
          lesson
            ? lesson.location
            : moduleOverviewLocation(location, entry.location),
          "developer",
        ) +
          (lesson
            ? `&concept=${encodeURIComponent(lesson.placement.conceptId)}${quiz ? "&view=quiz" : ""}`
            : ""),
      );
  }, [
    entry,
    lesson,
    failure,
    catalog.isFetching,
    detail.isFetching,
    location,
    router,
    guiWasShown,
    quiz,
  ]);
  const label = conceptReference ? "Lesson" : "Module";
  if (!failure)
    return <ModeAwareLoader guiTitle={`Opening ${label.toLowerCase()}`} />;
  const retry = catalog.isError || !found ? catalog : detail;
  return (
    <main className="min-h-screen bg-background text-foreground p-6 font-mono">
      <div role="alert">
        <h1>{label} couldn’t open</h1>
        <p>
          The link may be unavailable, or the request failed. Your saved place
          hasn’t changed.
        </p>
      </div>
      <button
        type="button"
        className="border border-current rounded px-4 min-h-11 mr-4"
        disabled={retry.isFetching}
        onClick={() => void retry.refetch()}
      >
        {retry.isFetching ? "Retrying…" : "Try again"}
      </button>
      <Link
        className="inline-flex items-center min-h-11 underline"
        href="/developer/terminal?view=roadmaps"
      >
        Browse roadmaps in terminal
      </Link>
    </main>
  );
}
export function RoadmapPage({
  reference,
  moduleReference,
  conceptReference,
  quiz,
}: {
  reference?: string;
  moduleReference?: string;
  conceptReference?: string;
  quiz?: boolean;
}) {
  const { ready, isCli } = useUiMode();
  const router = useRouter();
  const guiWasShown = useRef(false);
  useEffect(() => {
    if (ready && !isCli) guiWasShown.current = true;
    // A direct CLI-mode visit needs a handoff. Once GUI has been shown, its
    // explicit links own navigation: redirecting here would race a lesson link.
    if (ready && isCli && !guiWasShown.current && !moduleReference)
      router.replace(
        reference && isValidSegment(reference)
          ? `/developer/terminal?roadmap=${encodeURIComponent(reference)}`
          : "/developer/terminal?view=roadmaps",
      );
  }, [ready, isCli, reference, moduleReference, router]);
  if (ready && isCli && reference && moduleReference) {
    if (
      isValidSegment(reference) &&
      isValidSegment(moduleReference) &&
      (!conceptReference || isValidSegment(conceptReference))
    )
      return (
        <ModuleCliHandoff
          reference={reference}
          moduleReference={moduleReference}
          guiWasShown={guiWasShown}
          conceptReference={conceptReference}
          quiz={quiz}
        />
      );
    return (
      <div
        className="min-h-screen bg-background text-foreground p-6 font-mono"
        role="alert"
      >
        Invalid module link.{" "}
        <Link href="/developer/terminal?view=roadmaps">
          Browse roadmaps in terminal
        </Link>
      </div>
    );
  }
  if (!ready || isCli) return <ModeAwareLoader guiTitle="Opening roadmaps" />;
  return (
    <GuiLearningPage
      reference={reference}
      moduleReference={moduleReference}
      conceptReference={conceptReference}
      quiz={quiz}
    />
  );
}
