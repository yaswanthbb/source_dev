import type { User } from "@/lib/auth";
export interface Overview {
  totalDevelopers: number;
  totalAdmins: number;
  totalRoadmaps: number;
  totalModules: number;
  totalConcepts: number;
  totalConceptCompletions: number;
  activeDevelopers: number;
  totalXpAwarded: number;
}
export interface RoadmapStat {
  roadmapId: string;
  title: string;
  totalConcepts: number;
  totalEnrolledDevelopers: number;
  averageCompletionPercentage: number;
  totalCompletedConcepts: number;
}
export interface ConceptStat {
  conceptId: string;
  title: string;
  difficulty: string;
  completionCount: number;
  startedButNotCompletedCount: number;
}
export interface DeveloperStat {
  developerId: string;
  name: string;
  roadmapsCreated: number;
  conceptsAuthored: number;
  questionsAnswered: number;
  mcqQuestionsCreated: number;
}
export interface QueueItem {
  id: string;
  title: string;
  createdAt: string;
  reviewStatus: "pending" | "approved";
  hasDraft: boolean;
  authorName: string | null;
  placements: { roadmapTitle: string; moduleTitle: string }[];
}
export interface AdminSections {
  overview: Overview;
  roadmaps: RoadmapStat[];
  concepts: ConceptStat[];
  developers: DeveloperStat[];
  queue: QueueItem[];
}
export interface Checked<T> {
  value: T;
  checkedAt: string;
}
export interface AdminResource<T> {
  data?: T;
  pending: boolean;
  error?: string;
  checkedAt?: string;
}
export type AdminUser = Pick<User, "id" | "role" | "name" | "email">;
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Incomplete admin data");
  return v as Record<string, unknown>;
};
const text = (v: unknown) => {
  if (typeof v !== "string" || v.length > 20000)
    throw new Error("Incomplete admin text");
  return v;
};
const id = (v: unknown) => {
  const s = text(v);
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s))
    throw new Error("Invalid admin identifier");
  return s;
};
const count = (v: unknown) => {
  if (!Number.isSafeInteger(v) || (v as number) < 0)
    throw new Error("Invalid admin count");
  return v as number;
};
const date = (v: unknown) => {
  const s = text(v);
  if (!Number.isFinite(Date.parse(s))) throw new Error("Invalid admin date");
  return new Date(s).toISOString();
};
function list<T>(
  raw: unknown,
  parse: (row: Record<string, unknown>) => T,
  key: (row: T) => string,
): T[] {
  if (!Array.isArray(raw)) throw new Error("Incomplete admin list");
  const rows = raw.map((v) => parse(object(v)));
  if (new Set(rows.map(key)).size !== rows.length)
    throw new Error("Duplicate admin row");
  return rows;
}
export function parseAdminSection<K extends keyof AdminSections>(
  kind: K,
  raw: unknown,
): AdminSections[K] {
  let value: AdminSections[keyof AdminSections];
  switch (kind) {
    case "overview": {
      const r = object(raw);
      value = {
        totalDevelopers: count(r.totalDevelopers),
        totalAdmins: count(r.totalAdmins),
        totalRoadmaps: count(r.totalRoadmaps),
        totalModules: count(r.totalModules),
        totalConcepts: count(r.totalConcepts),
        totalConceptCompletions: count(r.totalConceptCompletions),
        activeDevelopers: count(r.activeDevelopers),
        totalXpAwarded: count(r.totalXpAwarded),
      };
      break;
    }
    case "roadmaps":
      value = list(
        raw,
        (r) => {
          const percentage = r.averageCompletionPercentage;
          if (
            typeof percentage !== "number" ||
            !Number.isFinite(percentage) ||
            percentage < 0 ||
            percentage > 100
          )
            throw new Error("Invalid completion percentage");
          return {
            roadmapId: id(r.roadmapId),
            title: text(r.title),
            totalConcepts: count(r.totalConcepts),
            totalEnrolledDevelopers: count(r.totalEnrolledDevelopers),
            averageCompletionPercentage: percentage,
            totalCompletedConcepts: count(r.totalCompletedConcepts),
          };
        },
        (r) => r.roadmapId,
      );
      break;
    case "concepts":
      value = list(
        raw,
        (r) => ({
          conceptId: id(r.conceptId),
          title: text(r.title),
          difficulty: text(r.difficulty),
          completionCount: count(r.completionCount),
          startedButNotCompletedCount: count(r.startedButNotCompletedCount),
        }),
        (r) => r.conceptId,
      );
      break;
    case "developers":
      value = list(
        raw,
        (r) => ({
          developerId: id(r.developerId),
          name: text(r.name),
          roadmapsCreated: count(r.roadmapsCreated),
          conceptsAuthored: count(r.conceptsAuthored),
          questionsAnswered: count(r.questionsAnswered),
          mcqQuestionsCreated: count(r.mcqQuestionsCreated),
        }),
        (r) => r.developerId,
      );
      break;
    case "queue":
      value = list<QueueItem>(
        raw,
        (r) => {
          if (r.reviewStatus !== "pending" && r.reviewStatus !== "approved")
            throw new Error("Unexpected review state");
          if (r.draftContent != null && typeof r.draftContent !== "string")
            throw new Error("Invalid draft state");
          const hasDraft = r.draftContent != null;
          if (r.reviewStatus === "approved" && !hasDraft)
            throw new Error("Not a pending draft");
          if (!Array.isArray(r.placements))
            throw new Error("Incomplete placement data");
          return {
            id: id(r.id),
            title: text(r.title),
            createdAt: date(r.createdAt),
            reviewStatus: r.reviewStatus,
            hasDraft,
            authorName: r.author == null ? null : text(object(r.author).name),
            placements: r.placements.map((v) => {
              const p = object(v);
              return {
                roadmapTitle:
                  p.roadmapTitle == null
                    ? "Roadmap not reported"
                    : text(p.roadmapTitle),
                moduleTitle:
                  p.moduleTitle == null
                    ? "Module not reported"
                    : text(p.moduleTitle),
              };
            }),
          };
        },
        (r) => r.id,
      );
      break;
    default:
      throw new Error("Unknown admin section");
  }
  return value as AdminSections[K];
}
export const oldestQueue = (rows: QueueItem[]) =>
  [...rows].sort(
    (a, b) =>
      Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
export const rankedRoadmaps = (rows: RoadmapStat[]) =>
  [...rows].sort(
    (a, b) =>
      b.totalEnrolledDevelopers - a.totalEnrolledDevelopers ||
      a.title.localeCompare(b.title),
  );
export const rankedDevelopers = (rows: DeveloperStat[]) =>
  [...rows].sort(
    (a, b) =>
      b.conceptsAuthored - a.conceptsAuthored || a.name.localeCompare(b.name),
  );
export const rankedConcepts = (rows: ConceptStat[]) =>
  [...rows].sort(
    (a, b) =>
      b.completionCount - a.completionCount || a.title.localeCompare(b.title),
  );
export const adminDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value)) + " UTC";
