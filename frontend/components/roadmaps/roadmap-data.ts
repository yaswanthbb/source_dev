import type {
  RoadmapDetailData,
  RoadmapProgressData,
  RoadmapModuleItem,
  ModuleConceptItem,
} from "@/lib/hooks/use-roadmap-progress";
import { slugify, uniqueNames } from "@/lib/terminal/resolve-location";
import type { Location } from "@/lib/terminal/location";

export type Origin = "ai" | "handwritten" | "partial";
export type Placement = ModuleConceptItem & {
  prerequisites?: Array<{ prerequisiteConceptId: string; title: string }>;
  concept: ModuleConceptItem["concept"] & {
    reviewStatus?: string;
    originLabel?: Origin | null;
    questionCount?: number;
  };
};
export type LearningModule = Omit<RoadmapModuleItem, "moduleConcepts"> & {
  moduleConcepts?: Placement[];
  originLabel?: Origin | null;
};
export type LearningRoadmap = Omit<RoadmapDetailData, "modules"> & {
  modules?: LearningModule[];
  originLabel?: Origin | null;
  reviewStatus?: string;
  moduleCount?: number;
};
export const ORIGINS = {
  ai: "AI generated",
  handwritten: "Handwritten",
  partial: "Mixed origin",
};
export const PAGE_SIZE = 8;

export function catalogEntries(roadmaps: LearningRoadmap[]) {
  // Exactly the same normalization/collision handling as the virtual filesystem.
  const names = uniqueNames(roadmaps.map((r) => slugify(r.slug || r.title)));
  return roadmaps.map((roadmap, index) => ({ roadmap, name: names[index] }));
}
export function findRoadmap(roadmaps: LearningRoadmap[], reference: string) {
  return catalogEntries(roadmaps).find(
    ({ roadmap, name }) => roadmap.id === reference || name === reference,
  );
}
export function filterRoadmaps(
  roadmaps: LearningRoadmap[],
  search: string,
  origin: string,
  sort: string,
) {
  const needle = search.trim().toLocaleLowerCase();
  return roadmaps
    .filter(
      (r) =>
        (!needle ||
          `${r.title} ${r.description ?? ""}`
            .toLocaleLowerCase()
            .includes(needle)) &&
        (origin === "all" || r.originLabel === origin),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
    );
}
export function curriculum(roadmap: LearningRoadmap, name: string) {
  const modules = [...(roadmap.modules ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const moduleNames = uniqueNames(modules.map((m) => slugify(m.title)));
  return modules.map((module, index) => {
    const links = [...(module.moduleConcepts ?? [])]
      .filter((p) => p.concept)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const conceptNames = uniqueNames(
      links.map((p) => slugify(p.concept.slug || p.concept.title)),
    );
    return {
      module,
      location: {
        kind: "module",
        roadmap: name,
        module: moduleNames[index],
      } as Extract<Location, { kind: "module" }>,
      concepts: links.map((placement, i) => ({
        placement,
        location: {
          kind: "concept",
          roadmap: name,
          module: moduleNames[index],
          concept: conceptNames[i],
        } as Extract<Location, { kind: "concept" }>,
      })),
    };
  });
}
export function conceptStatus(
  placement: Placement,
  progress?: RoadmapProgressData,
) {
  if (!progress) return "Progress unavailable";
  const row = progress.concepts?.find(
    (p) => p.conceptId === placement.conceptId,
  );
  return row?.status === "completed"
    ? "Completed"
    : row?.status === "in_progress"
      ? "In progress"
      : row
        ? "Not started"
        : "Not tracked";
}
export function nextLesson(
  roadmap: LearningRoadmap,
  name: string,
  progress?: RoadmapProgressData,
) {
  if (!progress) return undefined;
  const lessons = curriculum(roadmap, name).flatMap((m) => m.concepts);
  return nextAvailable(lessons, progress);
}
export type CurriculumModule = ReturnType<typeof curriculum>[number];
export function findModule(
  roadmap: LearningRoadmap,
  name: string,
  reference: string,
) {
  return curriculum(roadmap, name).find(
    (entry) =>
      entry.module.id === reference || entry.location.module === reference,
  );
}
export function moduleProgress(
  entry: CurriculumModule,
  progress: RoadmapProgressData,
): RoadmapProgressData {
  // The API tracks approved placements, with global completion by concept ID.
  // Count placements in THIS module only; drafts and other modules aren't totals.
  const concepts = entry.concepts.flatMap(({ placement }) => {
    const row = progress.concepts?.find(
      (p) => p.conceptId === placement.conceptId,
    );
    return row ? [row] : [];
  });
  const completed = concepts.filter((p) => p.status === "completed").length;
  return {
    roadmapId: progress.roadmapId,
    concepts,
    totalConcepts: concepts.length,
    completedConceptsCount: completed,
    completionPercentage: concepts.length
      ? Math.round((completed / concepts.length) * 100)
      : 0,
  };
}
export function nextModuleLesson(
  entry: CurriculumModule,
  progress?: RoadmapProgressData,
) {
  return progress && nextAvailable(entry.concepts, progress);
}
function nextAvailable(
  lessons: CurriculumModule["concepts"],
  progress: RoadmapProgressData,
) {
  // Per-placement prerequisites come from visible detail, not the progress endpoint's
  // duplicate concept rows (a concept can have different prerequisites in two modules).
  const available = lessons.filter(({ placement }) => {
    const tracked = progress.concepts?.find(
      (p) => p.conceptId === placement.conceptId,
    );
    return (
      tracked &&
      tracked.status !== "completed" &&
      (placement.prerequisites ?? []).every((prereq) =>
        progress.concepts?.some(
          (p) =>
            p.conceptId === prereq.prerequisiteConceptId &&
            p.status === "completed",
        ),
      )
    );
  });
  return (
    available.find(
      ({ placement }) => conceptStatus(placement, progress) === "In progress",
    ) ?? available[0]
  );
}
export function overviewLocation(current: Location, name: string): Location {
  // Rendering a nearest-page fallback must not discard a deeper CLI position.
  return current.kind !== "root" && current.roadmap === name
    ? current
    : { kind: "roadmap", roadmap: name };
}
export function moduleOverviewLocation(
  current: Location,
  target: CurriculumModule["location"],
): Location {
  return (current.kind === "module" || current.kind === "concept") &&
    current.roadmap === target.roadmap &&
    current.module === target.module
    ? current
    : target;
}
export function moduleRoute(
  location: Pick<CurriculumModule["location"], "roadmap" | "module">,
) {
  return `/developer/roadmaps/${encodeURIComponent(location.roadmap)}/modules/${encodeURIComponent(location.module)}`;
}

export type CurriculumLesson = CurriculumModule["concepts"][number];
export function findLesson(entry: CurriculumModule, reference: string) {
  return entry.concepts.find(
    ({ placement, location }) =>
      placement.conceptId === reference ||
      placement.id === reference ||
      location.concept === reference,
  );
}
export function lessonRoute(location: CurriculumLesson["location"]) {
  return `${moduleRoute(location)}/lessons/${encodeURIComponent(location.concept)}`;
}
