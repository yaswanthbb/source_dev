import { UserRole } from '../../../common/enums/user-role.enum';
import { ConceptReviewStatus } from '../../../common/enums/concept-review-status.enum';
import { RoadmapReviewStatus } from '../../../common/enums/roadmap-review-status.enum';
import { RoadmapUnpublishStatus } from '../../../common/enums/roadmap-unpublish-status.enum';
import { User } from '../../users/entities/user.entity';

type Actor = Pick<User, 'id' | 'role'> | undefined;

interface ConceptLike {
  reviewStatus: ConceptReviewStatus;
  authorId: string | null;
}

interface PlacementLike {
  roadmapReviewStatus: RoadmapReviewStatus | null | undefined;
}

/**
 * Shared publication-visibility predicate for §2/§3.
 *
 * - Admins see everything; authors see their own content at any stage.
 * - Everyone else sees a concept only when it is APPROVED *and* at least one
 *   of its placements sits inside a PUBLISHED roadmap. Drafts, submitted
 *   roadmaps, and unpublished work never leak — not in reads, not in QA.
 */
export function canSeeConcept(
  concept: ConceptLike,
  placements: PlacementLike[],
  user: Actor,
): boolean {
  if (user && user.role === UserRole.ADMIN) return true;
  if (
    user &&
    concept.authorId !== null &&
    concept.authorId === user.id
  )
    return true;
  return (
    concept.reviewStatus === ConceptReviewStatus.APPROVED &&
    placements.some(
      (p) => p.roadmapReviewStatus === RoadmapReviewStatus.PUBLISHED,
    )
  );
}

/** A roadmap is listable/readable by non-owners iff it is published. */
export function canSeeRoadmap(
  roadmap: {
    reviewStatus: RoadmapReviewStatus;
    createdById: string | null;
    unpublishStatus?: RoadmapUnpublishStatus | null;
    unpublishEffectiveAt?: Date | string | null;
    deleteEffectiveAt?: Date | string | null;
  },
  user: Actor,
): boolean {
  const now = Date.now();
  // Scheduled admin deletion past due: gone for everyone except admins
  // (who purge the row via maintenance endpoint).
  if (
    roadmap.deleteEffectiveAt &&
    new Date(roadmap.deleteEffectiveAt).getTime() <= now
  ) {
    return !!user && user.role === UserRole.ADMIN;
  }
  // Approved unpublish past its 30-day countdown: treat as private draft.
  const unpublishDue =
    roadmap.unpublishStatus === RoadmapUnpublishStatus.APPROVED &&
    roadmap.unpublishEffectiveAt &&
    new Date(roadmap.unpublishEffectiveAt).getTime() <= now;
  const effectiveStatus = unpublishDue
    ? RoadmapReviewStatus.DRAFT
    : roadmap.reviewStatus;
  if (user && user.role === UserRole.ADMIN) return true;
  if (
    user &&
    roadmap.createdById !== null &&
    roadmap.createdById === user.id
  )
    return true;
  return effectiveStatus === RoadmapReviewStatus.PUBLISHED;
}

/**
 * True when an approved unpublish countdown has elapsed on a still-published
 * roadmap. Callers flip such roadmaps to DRAFT on write paths (no cron).
 */
export function isUnpublishDue(roadmap: {
  reviewStatus: RoadmapReviewStatus;
  unpublishStatus?: RoadmapUnpublishStatus | null;
  unpublishEffectiveAt?: Date | string | null;
}): boolean {
  return (
    roadmap.reviewStatus === RoadmapReviewStatus.PUBLISHED &&
    roadmap.unpublishStatus === RoadmapUnpublishStatus.APPROVED &&
    !!roadmap.unpublishEffectiveAt &&
    new Date(roadmap.unpublishEffectiveAt).getTime() <= Date.now()
  );
}
