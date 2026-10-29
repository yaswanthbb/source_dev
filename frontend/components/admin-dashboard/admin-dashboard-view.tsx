"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCheck,
  ClipboardCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useUiMode } from "@/providers/ui-mode-provider";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  noticeLabel,
  noticeTitle,
  notificationDate,
  type Inbox,
} from "@/components/notifications/notifications-data";
import {
  adminDate,
  oldestQueue,
  rankedRoadmaps,
  rankedDevelopers,
  rankedConcepts,
  type AdminUser,
  type AdminResource,
  type Overview,
  type QueueItem,
  type RoadmapStat,
  type ConceptStat,
  type DeveloperStat,
} from "./admin-dashboard-data";
import styles from "./admin-dashboard.module.css";
export interface AdminDashboardViewProps {
  user: AdminUser;
  overview: AdminResource<Overview>;
  queue: AdminResource<QueueItem[]>;
  roadmaps: AdminResource<RoadmapStat[]>;
  concepts: AdminResource<ConceptStat[]>;
  developers: AdminResource<DeveloperStat[]>;
  feed: AdminResource<Inbox>;
  refreshing?: boolean;
  notice?: string;
  onRefresh: (
    kind:
      | "all"
      | "overview"
      | "queue"
      | "roadmaps"
      | "concepts"
      | "developers"
      | "feed",
  ) => void;
}
const num = (v: number | undefined) =>
  v === undefined ? "—" : v.toLocaleString("en");
export function AdminDashboardView(p: AdminDashboardViewProps) {
  const { setMode } = useUiMode();
  const [queueFilter, setQueueFilter] = useState("all"),
    [queuePage, setQueuePage] = useState(0),
    [roadmapSort, setRoadmapSort] = useState("learners");
  const status = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (p.notice) status.current?.focus();
  }, [p.notice]);
  const overview =
      p.overview.error || p.overview.pending ? undefined : p.overview.data,
    queue = p.queue.error || p.queue.pending ? undefined : p.queue.data,
    oldest = queue ? oldestQueue(queue)[0] : undefined;
  const filtered = queue
      ? oldestQueue(queue).filter(
          (q) =>
            queueFilter === "all" ||
            (queueFilter === "drafts" ? q.hasDraft : !q.hasDraft),
        )
      : [],
    pages = Math.max(1, Math.ceil(filtered.length / 4)),
    page = Math.min(queuePage, pages - 1),
    shown = filtered.slice(page * 4, page * 4 + 4);
  const rows = p.roadmaps.data
    ? (roadmapSort === "title"
        ? [...p.roadmaps.data].sort((a, b) => a.title.localeCompare(b.title))
        : rankedRoadmaps(p.roadmaps.data)
      ).slice(0, 6)
    : [];
  const cli = (href: string, children: ReactNode, className?: string) => (
    <Link
      className={className ?? styles.textLink}
      href={href}
      onClick={() => setMode("cli", { navigate: false })}
    >
      {children}
      <ArrowUpRight size={14} aria-hidden="true" />
    </Link>
  );
  const retry = (kind: Parameters<typeof p.onRefresh>[0]) => (
    <button
      type="button"
      disabled={p.refreshing}
      onClick={() => p.onRefresh(kind)}
      aria-label={`Refresh ${kind}`}
    >
      <RefreshCw size={14} aria-hidden="true" />
      Refresh
    </button>
  );
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ADMIN OVERVIEW</p>
          <h1>
            A clear view.
            <br />
            <span>A steady hand.</span>
          </h1>
          <p>Keep an eye on learning. Give good work a way forward.</p>
        </div>
        <OverviewIllustration />
      </header>
      <div className={styles.toolbar}>
        <span>
          <ShieldCheck size={15} aria-hidden="true" />
          Signed in as {p.user.name || "Administrator"}
        </span>
        <button
          type="button"
          className={styles.refresh}
          disabled={p.refreshing}
          onClick={() => p.onRefresh("all")}
        >
          <RefreshCw size={15} aria-hidden="true" />
          {p.refreshing ? "Checking dashboard…" : "Refresh dashboard"}
        </button>
      </div>
      {p.notice && (
        <GuiFeedback
          ref={status}
          kind={p.notice.startsWith("Some") ? "info" : "success"}
          title={p.notice}
        />
      )}
      <div className={styles.sectionTop}>
        <h2>Platform at a glance</h2>
        {retry("overview")}
      </div>
      <ResourceState resource={p.overview} label="platform totals" />
      <div className={styles.metrics} aria-label="Platform totals">
        <Metric
          icon={<Users size={19} />}
          title="Developers"
          value={num(overview?.totalDevelopers)}
          detail={
            overview
              ? `${num(overview.activeDevelopers)} with progress updates in 7 days · ${num(overview.totalAdmins)} admins`
              : "Account totals unavailable until checked"
          }
        />
        <Metric
          icon={<BookOpen size={19} />}
          title="Roadmaps"
          value={num(overview?.totalRoadmaps)}
          detail={
            overview
              ? `${num(overview.totalModules)} modules · ${num(overview.totalConcepts)} lessons`
              : "Content totals unavailable until checked"
          }
        />
        <Metric
          icon={<CheckCheck size={19} />}
          title="Lesson completions"
          value={num(overview?.totalConceptCompletions)}
          detail="Completed developer progress records"
        />
        <Metric
          icon={<Sparkles size={19} />}
          title="XP awarded"
          value={num(overview?.totalXpAwarded)}
          detail="Total recorded XP across the platform"
        />
      </div>
      <CheckedAt value={p.overview.checkedAt} />
      <div className={styles.mainGrid}>
        <section
          className={`${styles.card} ${styles.review}`}
          aria-labelledby="admin-review-title"
        >
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.eyebrow}>CONTENT, WITH CARE</p>
              <h2 id="admin-review-title">Ready for a closer look</h2>
            </div>
            <span className={styles.cardIcon}>
              <ClipboardCheck size={21} aria-hidden="true" />
            </span>
          </div>
          <ResourceState resource={p.queue} label="review queue" />
          <div className={styles.queueIntro}>
            <strong>{num(queue?.length)}</strong>
            <div>
              <span>lessons to review</span>
              <p>
                New submissions and staged revisions in submitted or published
                roadmaps.
              </p>
            </div>
          </div>
          {queue && queue.length === 0 ? (
            <p className={styles.empty}>
              No lessons are waiting in this checked queue. Refresh to check for
              new work.
            </p>
          ) : (
            oldest && (
              <div className={styles.oldest}>
                <span className={styles.eyebrow}>
                  OLDEST LESSON IN THIS QUEUE
                </span>
                <h3>{oldest.title}</h3>
                <p>
                  Created {adminDate(oldest.createdAt)} ·{" "}
                  {oldest.authorName || "Author unavailable"}
                </p>
                <span className={styles.tag}>
                  {oldest.hasDraft ? "Staged revision" : "Pending review"}
                </span>
                {cli(
                  `/admin/terminal?view=review&ref=${oldest.id}`,
                  <>
                    Review this lesson in CLI
                    <ArrowRight size={14} aria-hidden="true" />
                  </>,
                  styles.primary,
                )}
              </div>
            )
          )}
          <div className={styles.cardFooter}>
            <Link className={styles.textLink} href="/admin/content-review">
              Full review queue
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            {retry("queue")}
          </div>
          <CheckedAt value={p.queue.checkedAt} />
        </section>
        <section className={styles.card} aria-labelledby="admin-queue-title">
          <div className={styles.cardHeading}>
            <h2 id="admin-queue-title">Review queue</h2>
            <label className={styles.selectLabel}>
              Show
              <select
                value={queueFilter}
                disabled={!queue}
                onChange={(e) => {
                  setQueueFilter(e.target.value);
                  setQueuePage(0);
                }}
              >
                <option value="all">All reviews</option>
                <option value="new">New lessons</option>
                <option value="drafts">Staged revisions</option>
              </select>
            </label>
          </div>
          <p className={styles.caption}>
            Ordered by lesson creation date. Submission dates aren’t reported.
          </p>
          {p.queue.pending ? (
            <p role="status" className={styles.empty}>
              Checking queued lessons…
            </p>
          ) : p.queue.error ? (
            <p className={styles.empty}>
              Queue data is unavailable. Use Refresh in the review panel to
              check again.
            </p>
          ) : shown.length === 0 ? (
            <p className={styles.empty}>
              {queue?.length
                ? "No lessons match this review filter."
                : "Nothing awaiting review in this checked queue."}
            </p>
          ) : (
            <ol className={styles.queueList}>
              {shown.map((q) => (
                <li key={q.id}>
                  <div>
                    <h3>{q.title}</h3>
                    <p>
                      {q.authorName || "Author unavailable"} ·{" "}
                      <span className={styles.tag}>
                        {q.hasDraft ? "Staged revision" : "New lesson"}
                      </span>
                    </p>
                    <p>
                      {q.placements[0]
                        ? `${q.placements[0].roadmapTitle} / ${q.placements[0].moduleTitle}`
                        : "Placement not reported"}
                      {q.placements.length > 1
                        ? ` + ${q.placements.length - 1} more`
                        : ""}
                    </p>
                  </div>
                  {cli(
                    `/admin/terminal?view=review&ref=${q.id}`,
                    "Review in CLI",
                  )}
                </li>
              ))}
            </ol>
          )}
          {queue && filtered.length > 0 && (
            <nav
              className={styles.pagination}
              aria-label="Review preview pages"
            >
              <span>
                {page * 4 + 1}–{Math.min(page * 4 + 4, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div>
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setQueuePage(page - 1)}
                  aria-label="Previous review preview page"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={page === pages - 1}
                  onClick={() => setQueuePage(page + 1)}
                  aria-label="Next review preview page"
                >
                  →
                </button>
              </div>
            </nav>
          )}
        </section>
      </div>
      <section className={styles.card} aria-labelledby="admin-roadmaps-title">
        <div className={styles.cardHeading}>
          <div>
            <h2 id="admin-roadmaps-title">Learning across roadmaps</h2>
            <p className={styles.caption}>
              Learners are developers with recorded progress. Completion is
              averaged across those learners.
            </p>
          </div>
          <div className={styles.controls}>
            <label className={styles.selectLabel}>
              Sort
              <select
                aria-label="Sort roadmap analytics"
                value={roadmapSort}
                onChange={(e) => setRoadmapSort(e.target.value)}
              >
                <option value="learners">Most learners</option>
                <option value="title">Title</option>
              </select>
            </label>
            {retry("roadmaps")}
          </div>
        </div>
        <ResourceState resource={p.roadmaps} label="roadmap analytics" />
        {!p.roadmaps.pending &&
          !p.roadmaps.error &&
          (rows.length === 0 ? (
            <p className={styles.empty}>
              No roadmap analytics were returned. Published and unpublished
              roadmaps can both appear here.
            </p>
          ) : (
            <>
              <div
                className={styles.tableScroll}
                tabIndex={0}
                role="region"
                aria-label="Roadmap learning analytics"
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Roadmap</th>
                      <th scope="col">Learners</th>
                      <th scope="col">Lessons</th>
                      <th scope="col">Average completion</th>
                      <th scope="col">Completed records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.roadmapId}>
                        <th scope="row">{row.title}</th>
                        <td>{num(row.totalEnrolledDevelopers)}</td>
                        <td>{num(row.totalConcepts)}</td>
                        <td>
                          {row.totalConcepts === 0 ? (
                            <span className={styles.caption}>
                              No lessons linked
                            </span>
                          ) : (
                            <div className={styles.progress}>
                              <progress
                                max={100}
                                value={row.averageCompletionPercentage}
                                aria-label={`Average completion for ${row.title}`}
                              />
                              <span>
                                {row.averageCompletionPercentage.toLocaleString(
                                  "en",
                                  { maximumFractionDigits: 2 },
                                )}
                                %
                              </span>
                            </div>
                          )}
                        </td>
                        <td>{num(row.totalCompletedConcepts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.caption}>
                Showing {rows.length} of {p.roadmaps.data?.length} checked
                roadmaps. Totals include all review and publication states.
              </p>
            </>
          ))}
        <CheckedAt value={p.roadmaps.checkedAt} />
      </section>
      <div className={styles.lowerGrid}>
        <section
          className={styles.card}
          aria-labelledby="admin-developers-title"
        >
          <div className={styles.cardHeading}>
            <div>
              <h2 id="admin-developers-title">People building the library</h2>
              <p className={styles.caption}>
                Up to six developers, ordered by lessons authored.
              </p>
            </div>
            {retry("developers")}
          </div>
          <ResourceState
            resource={p.developers}
            label="developer contributions"
          />
          {!p.developers.pending &&
            !p.developers.error &&
            (p.developers.data?.length ? (
              <ul className={styles.people}>
                {rankedDevelopers(p.developers.data)
                  .slice(0, 6)
                  .map((d, i) => (
                    <li key={d.developerId}>
                      <span className={styles.avatar} aria-hidden="true">
                        {d.name.trim().charAt(0).toUpperCase() || i + 1}
                      </span>
                      <div>
                        <h3>{d.name || "Unnamed developer"}</h3>
                        <dl>
                          <div>
                            <dt>Lessons</dt>
                            <dd>{num(d.conceptsAuthored)}</dd>
                          </div>
                          <div>
                            <dt>Roadmaps</dt>
                            <dd>{num(d.roadmapsCreated)}</dd>
                          </div>
                          <div>
                            <dt>Answers</dt>
                            <dd>{num(d.questionsAnswered)}</dd>
                          </div>
                          <div>
                            <dt>MCQs</dt>
                            <dd>{num(d.mcqQuestionsCreated)}</dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className={styles.empty}>
                No developer contribution records were returned.
              </p>
            ))}
          <div className={styles.cardFooter}>
            <Link className={styles.textLink} href="/admin/users">
              Users directory
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <CheckedAt value={p.developers.checkedAt} />
        </section>
        <section className={styles.card} aria-labelledby="admin-concepts-title">
          <div className={styles.cardHeading}>
            <div>
              <h2 id="admin-concepts-title">Lessons with recorded progress</h2>
              <p className={styles.caption}>
                Up to six lessons, ordered by completed progress records.
              </p>
            </div>
            {retry("concepts")}
          </div>
          <ResourceState resource={p.concepts} label="lesson analytics" />
          {!p.concepts.pending &&
            !p.concepts.error &&
            (p.concepts.data?.length ? (
              <ol className={styles.concepts}>
                {rankedConcepts(p.concepts.data)
                  .slice(0, 6)
                  .map((c) => (
                    <li key={c.conceptId}>
                      <div>
                        <h3>{c.title}</h3>
                        <p>
                          {c.difficulty} · {num(c.startedButNotCompletedCount)}{" "}
                          in progress
                        </p>
                      </div>
                      <strong>
                        {num(c.completionCount)}
                        <span>completed</span>
                      </strong>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className={styles.empty}>
                No touched-lesson analytics were returned.
              </p>
            ))}
          <CheckedAt value={p.concepts.checkedAt} />
        </section>
      </div>
      <section className={styles.card} aria-labelledby="admin-activity-title">
        <div className={styles.cardHeading}>
          <div>
            <h2 id="admin-activity-title">Your latest notifications</h2>
            <p className={styles.caption}>
              Your recipient inbox, not a platform audit log. Use the bell to
              filter or change read status.
            </p>
          </div>
          {retry("feed")}
        </div>
        <ResourceState resource={p.feed} label="notification activity" />
        {!p.feed.pending &&
          !p.feed.error &&
          (p.feed.data?.items.length ? (
            <ul className={styles.events}>
              {p.feed.data.items.slice(0, 5).map((n) => (
                <li key={n.id}>
                  <span
                    className={n.isRead ? styles.readDot : styles.unreadDot}
                    aria-hidden="true"
                  />
                  <div>
                    <span>
                      {noticeLabel(n)} · {n.isRead ? "Read" : "Unread"}
                    </span>
                    <h3>{noticeTitle(n)}</h3>
                  </div>
                  <time dateTime={n.createdAt}>
                    {notificationDate(n.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              No notifications were returned for your account.
            </p>
          ))}
        <CheckedAt value={p.feed.checkedAt} />
      </section>
      <footer className={styles.footer}>
        <p>
          This overview makes no content or account changes. Review and
          management stay in their dedicated tools.
        </p>
        {cli("/admin/terminal?view=overview", "Open admin CLI")}
      </footer>
    </div>
  );
}
function Metric({
  icon,
  title,
  value,
  detail,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricIcon} aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}
function ResourceState({
  resource,
  label,
}: {
  resource: AdminResource<unknown>;
  label: string;
}) {
  return resource.pending ? (
    <p className={styles.state} role="status">
      Checking {label}…
    </p>
  ) : resource.error ? (
    <GuiFeedback
      kind="error"
      title={`${label.charAt(0).toUpperCase() + label.slice(1)} unavailable`}
    >
      <p>{resource.error}</p>
    </GuiFeedback>
  ) : null;
}
function CheckedAt({ value }: { value?: string }) {
  return value ? (
    <p className={styles.checked}>Last checked {adminDate(value)}</p>
  ) : null;
}
function OverviewIllustration() {
  return (
    <svg
      className={styles.illustration}
      width="180"
      height="145"
      viewBox="0 0 180 145"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="95" cy="73" r="61" fill="var(--gui-accent-soft)" />
      <g className={styles.chartPaper}>
        <rect
          x="32"
          y="26"
          width="111"
          height="92"
          rx="12"
          fill="var(--gui-surface)"
          stroke="var(--gui-border)"
          strokeWidth="1.5"
        />
        <path
          d="M50 98h72"
          stroke="var(--gui-border)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="53"
          y="71"
          width="13"
          height="21"
          rx="3"
          fill="var(--gui-accent-soft)"
        />
        <rect
          x="78"
          y="57"
          width="13"
          height="35"
          rx="3"
          fill="var(--gui-accent-bright)"
        />
        <rect
          x="103"
          y="43"
          width="13"
          height="49"
          rx="3"
          fill="var(--gui-accent)"
        />
        <path
          d="m52 58 23-16 15 4 26-17"
          stroke="var(--gui-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="143" cy="104" r="18" fill="var(--gui-accent)" />
      <path
        d="m134 104 6 6 12-13"
        stroke="var(--gui-bg)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 46v10m-5-5h10M151 24v8m-4-4h8"
        stroke="var(--gui-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
