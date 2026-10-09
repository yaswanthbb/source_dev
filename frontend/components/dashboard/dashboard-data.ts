import type { User } from "@/lib/auth";
import type { RoadmapProgressData } from "@/lib/hooks/use-roadmap-progress";

export type { User, RoadmapProgressData };
export interface EarnedBadge {
  id: string; name: string; description: string; criteriaKey: string; earnedAt: string;
}
export interface Gamification {
  totalXp: number; currentStreak: number; longestStreak: number; earnedBadges?: EarnedBadge[];
}
export interface ConceptProgress {
  id: string; conceptId: string;
  status: "not_started" | "in_progress" | "completed";
  completedAt: string | null; createdAt: string; updatedAt: string;
  concept?: { id: string; title: string; slug: string };
}
export interface Roadmap {
  id: string; title: string; slug: string; description: string | null;
}
export interface Badge {
  id: string; name: string; description: string; criteriaKey: string;
}
export interface ActivityDay { date: string; active: boolean; xp: number; }
export interface ReviewCount {
  count: number; dueCount: number; sessionCount?: number; heldBackCount?: number;
  unavailableCount?: number; leechCount?: number;
}
/** A failed request must not be presented as a successful empty response. */
export interface Resource<T> {
  data?: T; pending: boolean; error: boolean; refreshing?: boolean; retry: () => void;
}

const stamp = (value: string | null | undefined) => {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};
export function currentFocus(progress: ConceptProgress[]) {
  return [...progress].filter((p) => p.status === "in_progress" && p.concept?.title)
    .sort((a, b) => stamp(b.updatedAt || b.createdAt) - stamp(a.updatedAt || a.createdAt))[0];
}
export function recentEvents(progress: ConceptProgress[], badges: EarnedBadge[]) {
  const events = [
    ...progress.filter((p) => p.status === "completed" && p.completedAt && p.concept?.title)
      .map((p) => ({ id: `concept-${p.id}`, title: p.concept!.title,
        kind: "Completed concept", at: p.completedAt! })),
    ...badges.filter((b) => b.earnedAt).map((b) => ({ id: `badge-${b.id}`,
      title: b.name, kind: "Earned badge", at: b.earnedAt })),
  ];
  return events.filter((e) => stamp(e.at) > 0)
    .sort((a, b) => stamp(b.at) - stamp(a.at)).slice(0, 4);
}
export function badgeRows(catalog: Badge[], earned: EarnedBadge[]) {
  const rows = catalog.map((badge) => {
    const match = earned.find((item) => item.id === badge.id ||
      (badge.criteriaKey && item.criteriaKey === badge.criteriaKey));
    return { ...badge, earnedAt: match?.earnedAt ?? null };
  });
  // Keep historical awards even if the catalog has since changed.
  for (const badge of earned) {
    if (!rows.some((row) => row.id === badge.id ||
      (badge.criteriaKey && row.criteriaKey === badge.criteriaKey))) rows.push(badge);
  }
  return rows.sort((a, b) => Number(Boolean(b.earnedAt)) - Number(Boolean(a.earnedAt)) ||
    stamp(b.earnedAt) - stamp(a.earnedAt) || a.name.localeCompare(b.name));
}
export function activityWeeks(days: ActivityDay[]) {
  // Backend dates already use the account timezone. Do not re-bucket them locally.
  const valid = [...days].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!valid.length) return [];
  const cells: (ActivityDay | null)[] = [
    ...Array.from({ length: new Date(`${valid[0].date}T00:00:00Z`).getUTCDay() }, () => null), ...valid,
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}
export function activityLevel(xp: number) {
  return xp <= 0 ? 0 : xp < 25 ? 1 : xp < 60 ? 2 : xp < 110 ? 3 : 4;
}
export function roadmapSummary(progress: RoadmapProgressData) {
  const total = Math.max(0, progress.totalConcepts ?? 0);
  const done = Math.min(total, Math.max(0, progress.completedConceptsCount ?? progress.completedConcepts ?? 0));
  return { total, done, percentage: total ? Math.round(done / total * 100) : 0 };
}
export function reviewSummary(review: ReviewCount) {
  const due = Math.max(0, review.dueCount ?? review.count ?? 0);
  return { due, session: Math.max(0, review.sessionCount ?? due),
    held: Math.max(0, review.heldBackCount ?? 0), unavailable: Math.max(0, review.unavailableCount ?? 0) };
}
