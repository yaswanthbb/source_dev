/* ==========================================================================
   source:dev — virtual filesystem resolution
   --------------------------------------------------------------------------
   `location.ts` knows the *shape* of a path and nothing about the data behind
   it — deliberately, so its rules can be proven without a network. This file
   is the other half: it turns a `Location` into the API ids that path names,
   and says what a directory contains.

   Two things this is deliberately not:

   - **Not React.** The cache below is a `Map` of in-flight promises, which is
     the whole of the request dedup this needs. Reaching for React Query here
     would put framework awareness inside the command layer — the same class
     of leak as a hex colour, and one the theme guard would not catch.
   - **Not presentation.** This file says what the entries are and what state
     they are in. How an entry is drawn — the status marker, the column widths
     — belongs to `ls` and the theme's glyphs.
   ========================================================================== */

import { api } from "./request";
import { formatPath, segmentsOf, type Location } from "./location";
import type {
  RoadmapDetailData,
  RoadmapProgressData,
} from "@/lib/hooks/use-roadmap-progress";

export type ConceptStatus = "completed" | "in_progress" | "not_started";

/** One entry in a directory listing. */
export interface VfsEntry {
  /** The segment `ls` prints and `cd` accepts. Always satisfies the SEGMENT
   *  pattern in `location.ts`, so a name taken from a listing is always a
   *  legal part of a path — that equivalence is what lets tab-completion and
   *  hand-typed paths share one code path. */
  name: string;
  /** The API id behind the entry. */
  id: string;
  /** The human title, for headings and `find` output. */
  title: string;
  /** Concepts only — a directory has no completion state of its own. */
  status?: ConceptStatus;
}

/** Derive a path segment from a human title.
 *
 *  Needed because **modules have no slug in the API** — only a title — so
 *  their directory name has to be computed. Roadmaps and concepts do carry a
 *  slug and it is preferred when present, so the common case is the API's own
 *  name rather than one invented here. */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "untitled";
}

/** Give every item in a listing a unique name.
 *
 *  Two modules in one roadmap can slugify to the same string, and a directory
 *  with two identically named children has an unreachable child. Callers sort
 *  by `orderIndex` first, so the suffix a collision gets is stable from one
 *  request to the next rather than depending on arrival order. */
function uniqueNames(preferred: string[]): string[] {
  const seen = new Map<string, number>();
  return preferred.map((base) => {
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
}

// ─── Cache ──────────────────────────────────────────────────────────────────

/** Keyed by request, holding the *promise* rather than the result, so two
 *  commands asking for the same listing at once make one request. */
const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const run = load().catch((error: unknown) => {
    // A failed request must not cache as a permanently empty directory.
    cache.delete(key);
    throw error;
  });
  cache.set(key, run);
  return run;
}

/** Drop everything. Called after any command that changes what a listing
 *  would say — completing a concept moves it from `[~]` to `[x]`. */
export function clearVfsCache(): void {
  cache.clear();
}

// ─── Errors ─────────────────────────────────────────────────────────────────

/** A failure with the shape a shell reports. The path carried here is the
 *  prefix that actually failed, not the whole argument, so `cd a/b/c` blames
 *  `/roadmaps/a/b` when `b` is the missing part — same as a real shell. */
export class VfsError extends Error {
  constructor(
    readonly path: string,
    readonly reason: "missing" | "notdir",
  ) {
    super(reason === "notdir" ? "Not a directory" : "No such file or directory");
    this.name = "VfsError";
  }
}

/** `cd: /roadmaps/x: No such file or directory` — the diagnostic a user who
 *  knows a shell already knows how to read. */
export function vfsErrorText(command: string, error: unknown): string {
  if (error instanceof VfsError) {
    return `${command}: ${error.path}: ${error.message}`;
  }
  const message =
    error instanceof Error && error.message ? error.message : "unknown error";
  return `${command}: ${message}`;
}

// ─── Listings ───────────────────────────────────────────────────────────────

interface RoadmapSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

function roadmapEntries(): Promise<VfsEntry[]> {
  return cached("roadmaps", async () => {
    const all = (await api.get<RoadmapSummary[]>("/roadmaps")).data;
    const names = uniqueNames(all.map((r) => slugify(r.slug || r.title)));
    return all.map((roadmap, index) => ({
      name: names[index],
      id: roadmap.id,
      title: roadmap.title,
    }));
  });
}

function detailOf(roadmapId: string): Promise<RoadmapDetailData> {
  return cached(`detail:${roadmapId}`, async () => {
    const path = `/roadmaps/${encodeURIComponent(roadmapId)}`;
    return (await api.get<RoadmapDetailData>(path)).data;
  });
}

/** Concept id → status, for the markers `ls` prints. */
function statusesOf(roadmapId: string): Promise<Map<string, ConceptStatus>> {
  return cached(`progress:${roadmapId}`, async () => {
    const path = `/roadmaps/${encodeURIComponent(roadmapId)}/progress`;
    const data = (await api.get<RoadmapProgressData>(path)).data;
    const byId = new Map<string, ConceptStatus>();
    for (const concept of data.concepts ?? []) {
      byId.set(concept.conceptId, concept.status);
    }
    return byId;
  });
}

async function moduleEntries(roadmapId: string): Promise<VfsEntry[]> {
  const modules = [...((await detailOf(roadmapId)).modules ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const names = uniqueNames(modules.map((module) => slugify(module.title)));
  return modules.map((module, index) => ({
    name: names[index],
    id: module.id,
    title: module.title,
  }));
}

async function conceptEntries(
  roadmapId: string,
  moduleId: string,
): Promise<VfsEntry[]> {
  const [detail, statuses] = await Promise.all([
    detailOf(roadmapId),
    // A roadmap with no progress record yet is not an error — it is a roadmap
    // nobody has started, and every concept in it is simply not started.
    statusesOf(roadmapId).catch(() => new Map<string, ConceptStatus>()),
  ]);
  const found = (detail.modules ?? []).find((module) => module.id === moduleId);
  const links = [...(found?.moduleConcepts ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const names = uniqueNames(
    links.map((link) => slugify(link.concept.slug || link.concept.title)),
  );
  return links.map((link, index) => ({
    name: names[index],
    id: link.concept.id,
    title: link.concept.title,
    status: statuses.get(link.concept.id) ?? "not_started",
  }));
}

// ─── Resolution ─────────────────────────────────────────────────────────────

export interface ResolvedLocation {
  roadmapId?: string;
  moduleId?: string;
  conceptId?: string;
  /** The entry the last segment named — absent at the root. */
  entry?: VfsEntry;
}

/** Walk a path to the ids behind it, one level at a time.
 *
 *  Every command that takes a path argument goes through here, which is what
 *  makes an absolute path and a sequence of `cd`s genuinely the same operation
 *  rather than two implementations that agree for now. */
export async function resolveLocation(
  loc: Location,
): Promise<ResolvedLocation> {
  const segments = segmentsOf(loc);
  const resolved: ResolvedLocation = {};
  if (!segments.length) return resolved;

  let walked = "/roadmaps";

  walked = `${walked}/${segments[0]}`;
  const roadmap = (await roadmapEntries()).find((e) => e.name === segments[0]);
  if (!roadmap) throw new VfsError(walked, "missing");
  resolved.roadmapId = roadmap.id;
  resolved.entry = roadmap;
  if (segments.length === 1) return resolved;

  walked = `${walked}/${segments[1]}`;
  const module = (await moduleEntries(roadmap.id)).find(
    (e) => e.name === segments[1],
  );
  if (!module) throw new VfsError(walked, "missing");
  resolved.moduleId = module.id;
  resolved.entry = module;
  if (segments.length === 2) return resolved;

  walked = `${walked}/${segments[2]}`;
  const concept = (await conceptEntries(roadmap.id, module.id)).find(
    (e) => e.name === segments[2],
  );
  if (!concept) throw new VfsError(walked, "missing");
  resolved.conceptId = concept.id;
  resolved.entry = concept;
  return resolved;
}

/** What `ls` lists. Throws `Not a directory` on a concept, as a shell does on
 *  a file. */
export async function listChildren(loc: Location): Promise<VfsEntry[]> {
  if (loc.kind === "root") return roadmapEntries();
  if (loc.kind === "concept") throw new VfsError(formatPath(loc), "notdir");

  const resolved = await resolveLocation(loc);
  if (!resolved.roadmapId) throw new VfsError(formatPath(loc), "missing");
  if (loc.kind === "roadmap") return moduleEntries(resolved.roadmapId);

  if (!resolved.moduleId) throw new VfsError(formatPath(loc), "missing");
  return conceptEntries(resolved.roadmapId, resolved.moduleId);
}

// ─── Reading ────────────────────────────────────────────────────────────────

interface ConceptContent {
  id: string;
  title: string;
  content: string;
}

/** The body behind a concept, for `cat` and `less`. */
export function readConcept(conceptId: string): Promise<ConceptContent> {
  return cached(`concept:${conceptId}`, async () => {
    const path = `/concepts/${encodeURIComponent(conceptId)}`;
    return (await api.get<ConceptContent>(path)).data;
  });
}
