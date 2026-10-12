"use client";

import { useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import { SourceMark } from "@/components/brand/source-mark";
import { useUiMode } from "@/providers/ui-mode-provider";
import { formatDate } from "@/lib/timezone";
import {
  activityLevel,
  activityWeeks,
  badgeRows,
  currentFocus,
  recentEvents,
  reviewSummary,
  roadmapSummary,
  type ActivityDay,
  type Badge,
  type ConceptProgress,
  type Gamification,
  type Resource,
  type ReviewCount,
  type Roadmap,
  type RoadmapProgressData,
  type User,
} from "./dashboard-data";
import styles from "./dashboard.module.css";

export function CliLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  const { setMode } = useUiMode();
  return (
    <Link
      href={href}
      onClick={() => setMode("cli", { navigate: false })}
      className={primary ? styles.primaryLink : styles.textLink}
    >
      {children}
      <ArrowUpRight size={16} aria-hidden="true" />
      <span className={styles.cli}>CLI</span>
    </Link>
  );
}

function SectionState<T>({
  source,
  label,
  children,
}: {
  source: Resource<T>;
  label: string;
  children: ReactNode;
}) {
  if (source.pending && source.data === undefined)
    return (
      <div className={styles.loading} role="status" aria-atomic="true">
        <span>Loading {label.toLowerCase()}…</span>
        <div className={styles.skeleton} aria-hidden="true" />
        <div className={styles.shortSkeleton} aria-hidden="true" />
      </div>
    );
  const failed = source.error && source.data === undefined;
  return (
    <>
      {source.error && (
        <GuiFeedback
          kind="error"
          title={
            failed ? `${label} couldn’t load` : `${label} couldn’t refresh`
          }
        >
          <p>
            {failed
              ? "Please try again. Your saved data hasn’t changed."
              : "Showing the last loaded data. Try again for an update."}
          </p>
          <button
            className={styles.retry}
            disabled={source.refreshing}
            onClick={source.retry}
            type="button"
          >
            <RotateCcw size={14} aria-hidden="true" />
            {source.refreshing ? "Retrying…" : "Try again"}
          </button>
        </GuiFeedback>
      )}
      {!failed && children}
    </>
  );
}

function Metric({
  icon,
  label,
  source,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  source: Resource<unknown>;
  value: number | undefined;
  detail: string;
}) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricIcon}>{icon}</span>
      <span className={styles.metricLabel}>{label}</span>
      <strong>
        {source.data === undefined
          ? source.error
            ? "Unavailable"
            : "—"
          : (value?.toLocaleString() ?? "—")}
      </strong>
      <span className={styles.metricDetail}>
        {source.pending
          ? "Loading…"
          : source.error
            ? "Couldn’t update"
            : detail}
      </span>
    </div>
  );
}

function LearningPath() {
  return (
    <div className={styles.learningPath} aria-hidden="true">
      <svg viewBox="0 0 240 180" fill="none">
        <path
          d="M25 135C25 20 200 12 212 96C218 144 160 172 124 125"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 5"
        />
        <circle
          cx="25"
          cy="135"
          r="7"
          fill="var(--gui-accent-soft)"
          stroke="currentColor"
        />
        <circle
          cx="160"
          cy="32"
          r="7"
          fill="var(--gui-surface)"
          stroke="currentColor"
        />
        <circle cx="124" cy="125" r="7" fill="currentColor" />
      </svg>
      <div className={styles.pathMark}>
        <SourceMark size={58} />
      </div>
      <span className={styles.pathLabel}>learn → connect → recall</span>
    </div>
  );
}

function ActivityPanel({
  source,
  timezone,
}: {
  source: Resource<ActivityDay[]>;
  timezone?: string;
}) {
  const days = source.data ?? [];
  const weeks = activityWeeks(days);
  const active = days.filter((day) => day.active).length;
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth;
  }, [source.data]);
  return (
    <section
      className={`${styles.panel} ${styles.activityPanel}`}
      aria-labelledby="activity-heading"
    >
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>A little, often</p>
          <h2 id="activity-heading">Your learning rhythm</h2>
        </div>
        <span className={styles.tag}>Past year</span>
      </div>
      <SectionState source={source} label="Activity">
        {days.length ? (
          <>
            <p className={styles.muted}>
              <strong>{active}</strong> active {active === 1 ? "day" : "days"}{" "}
              in the last {days.length} days. XP earned across concepts, quizzes
              and reviews.
            </p>
            <div
              ref={scrollRef}
              className={styles.activityScroll}
              tabIndex={0}
              role="region"
              aria-label="Year of XP activity, scroll horizontally to see earlier dates"
            >
              <div
                className={styles.heatmap}
                role="img"
                aria-label={`${active} active days. Orange intensity shows daily XP. Exact values are in the Daily XP data table below.`}
              >
                {weeks.map((week, index) => (
                  <div className={styles.week} key={index}>
                    {week.map((day, row) => (
                      <span
                        key={day?.date ?? `empty-${row}`}
                        data-level={day ? activityLevel(day.xp) : undefined}
                        title={day ? `${day.date}: ${day.xp} XP` : undefined}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.activityFooter}>
              <span>Dates in {timezone || "your account timezone"}</span>
              <div className={styles.legend} aria-hidden="true">
                Less
                {[0, 1, 2, 3, 4].map((level) => (
                  <span data-level={level} key={level} />
                ))}
                More
              </div>
            </div>
            <details className={styles.activityData}>
              <summary>Daily XP data</summary>
              <div className={styles.tableScroll}>
                <table>
                  <caption>Daily XP, newest first</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">XP earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...days].reverse().map((day) => (
                      <tr key={day.date}>
                        <th scope="row">{day.date}</th>
                        <td>{day.xp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : (
          <div className={styles.empty}>
            <Zap size={24} aria-hidden="true" />
            <h3>No activity to show yet.</h3>
            <p>
              Complete a concept or practice session to start your learning
              rhythm.
            </p>
          </div>
        )}
      </SectionState>
    </section>
  );
}

export function RoadmapCard({
  roadmap,
  progress,
}: {
  roadmap: Roadmap;
  progress: Resource<RoadmapProgressData>;
}) {
  const summary = progress.data ? roadmapSummary(progress.data) : null;
  return (
    <article className={styles.roadmapCard}>
      <div className={styles.roadmapIcon}>
        <Layers size={22} aria-hidden="true" />
      </div>
      <h3>{roadmap.title}</h3>
      <p className={styles.roadmapDescription}>
        {roadmap.description ||
          "A structured roadmap of modules and concept lessons."}
      </p>
      <SectionState source={progress} label="Roadmap progress">
        {summary && (
          <div className={styles.roadmapProgress}>
            <div>
              <span>
                {summary.done} of {summary.total} concepts
              </span>
              <strong>{summary.percentage}%</strong>
            </div>
            <progress
              value={summary.done}
              max={summary.total || 1}
              aria-label={`${roadmap.title} completion`}
            />
          </div>
        )}
      </SectionState>
      <Link
        className={styles.textLink}
        href={`/developer/roadmaps/${encodeURIComponent(roadmap.id)}`}
      >
        Explore roadmap
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

interface Props {
  user: Resource<User>;
  gamification: Resource<Gamification>;
  progress: Resource<ConceptProgress[]>;
  activity: Resource<ActivityDay[]>;
  roadmaps: Resource<Roadmap[]>;
  badges: Resource<Badge[]>;
  review: Resource<ReviewCount>;
  renderRoadmap: (roadmap: Roadmap) => ReactNode;
}
export function DashboardView({
  user,
  gamification,
  progress,
  activity,
  roadmaps,
  badges,
  review,
  renderRoadmap,
}: Props) {
  const name = user.data?.name?.trim().split(/\s+/)[0];
  const focus = currentFocus(progress.data ?? []);
  const completed = progress.data?.filter(
    (p) => p.status === "completed",
  ).length;
  const reviewData = review.data ? reviewSummary(review.data) : null;
  const events = recentEvents(
    progress.data ?? [],
    gamification.data?.earnedBadges ?? [],
  );
  const awards = badgeRows(
    badges.data ?? [],
    gamification.data?.earnedBadges ?? [],
  );
  return (
    <div className={styles.dashboard}>
      <header className={styles.welcome}>
        <div>
          <p className={styles.eyebrow}>Your learning, connected</p>
          <h1>
            {name ? `Welcome back, ${name}.` : "Your next idea starts here."}
          </h1>
          <p>Pick up a concept. Revisit what you know. Keep the loop going.</p>
        </div>
        <Link href="/developer/content" className={styles.secondaryLink}>
          <PenLink />
          My content
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>
      {user.error && (
        <SectionState source={user} label="Account">
          {null}
        </SectionState>
      )}
      <div className={styles.primaryGrid}>
        <section
          className={`${styles.panel} ${styles.continueCard}`}
          aria-labelledby="continue-heading"
        >
          <LearningPath />
          <div className={styles.continueContent}>
            <p className={styles.eyebrow}>Learn · connect</p>
            <h2 id="continue-heading">
              {focus
                ? "Pick up where you left off."
                : "Make room for a new idea."}
            </h2>
            <SectionState source={progress} label="Learning progress">
              {focus ? (
                <>
                  <span className={styles.tag}>In progress</span>
                  <h3>{focus.concept!.title}</h3>
                  <p>
                    Your most recently started concept is ready when you are.
                  </p>
                  <CliLink
                    primary
                    href={`/developer/terminal?concept=${encodeURIComponent(focus.conceptId)}`}
                  >
                    Continue learning
                  </CliLink>
                </>
              ) : (
                <>
                  <p>
                    Start with a roadmap. Work through focused lessons, then
                    test your understanding.
                  </p>
                  <Link
                    className={styles.primaryLink}
                    href="/developer/roadmaps"
                  >
                    Browse roadmaps
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </>
              )}
            </SectionState>
          </div>
        </section>
        <section
          className={`${styles.panel} ${styles.reviewCard}`}
          aria-labelledby="review-heading"
        >
          <div className={styles.reviewHeading}>
            <RotateCcw size={22} aria-hidden="true" />
            <span className={styles.eyebrow}>Recall</span>
          </div>
          <h2 id="review-heading">Keep it fresh.</h2>
          <SectionState source={review} label="Review queue">
            {reviewData && (
              <>
                <div className={styles.reviewNumber}>
                  {reviewData.due}
                  <span>
                    {reviewData.due === 1 ? "review due" : "reviews due"}
                  </span>
                </div>
                <p>
                  {reviewData.session > 0
                    ? `${reviewData.session} ${reviewData.session === 1 ? "item is" : "items are"} ready in your next session.`
                    : reviewData.due > 0
                      ? "No due items are available to practice right now."
                      : "You’re all caught up. New reviews appear when they’re due."}
                </p>
                {reviewData.held > 0 && (
                  <p className={styles.reviewNote}>
                    {reviewData.held} held for a later session.
                  </p>
                )}
                {reviewData.unavailable > 0 && (
                  <p className={styles.reviewNote}>
                    {reviewData.unavailable} unavailable due to content access
                    or removal.
                  </p>
                )}
                {reviewData.session > 0 && (
                  <Link className={styles.primaryLink} href="/developer/review">
                    Start a review
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </>
            )}
          </SectionState>
        </section>
      </div>
      <p className={styles.handoffNote}>
        Links marked CLI open the current terminal tools. Roadmaps, lessons,
        knowledge checks and reviews are available in your visual workspace.
      </p>
      <div className={styles.metrics} aria-label="Learning statistics">
        <Metric
          icon={<Zap size={18} aria-hidden="true" />}
          label="Total XP"
          source={gamification}
          value={gamification.data?.totalXp}
          detail="Earned through practice"
        />
        <Metric
          icon={<Flame size={18} aria-hidden="true" />}
          label="Current streak"
          source={gamification}
          value={gamification.data?.currentStreak}
          detail={`days · best ${gamification.data?.longestStreak ?? 0}`}
        />
        <Metric
          icon={<Check size={18} aria-hidden="true" />}
          label="Concepts completed"
          source={progress}
          value={completed}
          detail="Your saved learning progress"
        />
        <Metric
          icon={<Trophy size={18} aria-hidden="true" />}
          label="Badges earned"
          source={gamification}
          value={gamification.data?.earnedBadges?.length ?? 0}
          detail="Milestones along the way"
        />
      </div>
      {gamification.error && (
        <SectionState source={gamification} label="Learning statistics">
          {null}
        </SectionState>
      )}
      <ActivityPanel source={activity} timezone={user.data?.timezone} />
      <section
        className={styles.roadmapsSection}
        aria-labelledby="roadmaps-heading"
      >
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Follow a thread</p>
            <h2 id="roadmaps-heading">Explore a roadmap</h2>
          </div>
          <Link className={styles.textLink} href="/developer/roadmaps">
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <SectionState source={roadmaps} label="Roadmaps">
          {roadmaps.data?.length ? (
            <div className={styles.roadmapGrid}>
              {roadmaps.data.slice(0, 4).map(renderRoadmap)}
            </div>
          ) : (
            <div className={`${styles.panel} ${styles.empty}`}>
              <BookOpen size={26} aria-hidden="true" />
              <h3>No roadmaps available yet.</h3>
              <p>
                You can create your own roadmap and keep it private or submit it
                for review.
              </p>
              <Link href="/developer/content" className={styles.textLink}>
                Create content
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </SectionState>
      </section>
      <div className={styles.bottomGrid}>
        <section className={styles.panel} aria-labelledby="milestones-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Small wins, real progress</p>
              <h2 id="milestones-heading">Your milestones</h2>
            </div>
            <Award size={21} aria-hidden="true" />
          </div>
          <SectionState source={gamification} label="Earned badges">
            <SectionState source={badges} label="Badge catalog">
              {awards.length ? (
                <ul className={styles.badgeList}>
                  {awards.slice(0, 4).map((badge) => (
                    <li key={badge.id}>
                      <span
                        className={
                          badge.earnedAt ? styles.earnedIcon : styles.lockedIcon
                        }
                      >
                        <Award size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <h3>{badge.name}</h3>
                        <p>{badge.description}</p>
                        <span className={styles.badgeState}>
                          {badge.earnedAt ? "Earned" : "Not earned yet"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>
                  No milestones to show yet. Keep learning and your awards will
                  appear here.
                </p>
              )}
              {awards.length > 4 && (
                <details className={styles.allBadges}>
                  <summary>See all {awards.length} milestones</summary>
                  <ul className={styles.badgeList}>
                    {awards.slice(4).map((badge) => (
                      <li key={badge.id}>
                        <Award size={20} aria-hidden="true" />
                        <div>
                          <h3>{badge.name}</h3>
                          <p>{badge.description}</p>
                          <span className={styles.badgeState}>
                            {badge.earnedAt ? "Earned" : "Not earned yet"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </SectionState>
          </SectionState>
        </section>
        <section className={styles.panel} aria-labelledby="recent-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>The steps you’ve taken</p>
              <h2 id="recent-heading">Recently learned</h2>
            </div>
            <Sparkles size={21} aria-hidden="true" />
          </div>
          <SectionState source={progress} label="Recent concepts">
            <SectionState source={gamification} label="Recent awards">
              {events.length ? (
                <ol className={styles.eventList}>
                  {events.map((event) => (
                    <li key={event.id}>
                      <span className={styles.eventDot} aria-hidden="true" />
                      <div>
                        <p className={styles.eventKind}>{event.kind}</p>
                        <h3>{event.title}</h3>
                        <time dateTime={event.at}>
                          {formatDate(new Date(event.at), user.data?.timezone)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className={styles.empty}>
                  <p>
                    Your completed concepts and earned badges will appear here.
                    Start with one lesson.
                  </p>
                </div>
              )}
            </SectionState>
          </SectionState>
        </section>
      </div>
      <footer className={styles.footer}>
        Learning is a loop. Not a feed.<span>source:dev</span>
      </footer>
    </div>
  );
}

function PenLink() {
  return <Layers size={16} aria-hidden="true" />;
}
