/* ==========================================================================
   source:dev terminal — admin commands
   --------------------------------------------------------------------------
   Everything the platform owner does, in the same shell the developers use.
   Same CommandSpec pattern (help blocks are compiler-checked by the test
   below), same api/stuck/ask conventions as the student set. Destructive
   actions confirm with a typed YES; read-only ones never do. All entries
   carry role "admin" and only compose into the admin shell via
   commandsFor("admin", ADMIN_COMMANDS).
   ========================================================================== */

import { api } from "./request";
import apiClient from "@/lib/api-client";
import type { CommandCtx, CommandSpec } from "./commands";

function errText(e: unknown): string {
  const res = (e as { response?: { data?: { message?: unknown } } })?.response;
  const msg = res?.data?.message;
  if (Array.isArray(msg)) return msg.join("; ");
  if (typeof msg === "string") return msg;
  if (e instanceof Error && e.message) return e.message;
  return "request failed";
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(14)} ${value}`;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

/** Typed-YES gate for destructive admin actions. */
async function confirmDestructive(
  ctx: CommandCtx,
  what: string,
): Promise<boolean> {
  const { io } = ctx;
  io.print(what, "dim");
  const typed = await io.ask("type YES to continue");
  if (typed.trim() !== "YES") {
    io.print("cancelled", "dim");
    return false;
  }
  return true;
}

function needArg(
  io: CommandCtx["io"],
  value: string | undefined,
  usage: string,
): value is string {
  if (!value) {
    io.print(`usage: ${usage}`, "err");
    return false;
  }
  return true;
}

// ─── Types (shaped like the backend contracts) ─────────────────────────────

interface PendingConcept {
  id: string;
  title: string;
  reviewStatus: string;
  difficulty?: string;
  isAiGenerated?: boolean;
  draftContent?: string | null;
  rejectionReason?: string | null;
  author?: { id: string; name: string; email: string } | null;
  placements?: Array<{ roadmapTitle?: string; moduleTitle?: string }>;
}

interface ReviewConcept {
  id: string;
  title: string;
  reviewStatus: string;
  rejectionReason?: string | null;
  hasPendingDraft?: boolean;
  originLabel?: string;
}

interface ReviewModule {
  moduleId: string;
  title: string;
  approved: boolean;
  originLabel?: string | null;
  concepts: ReviewConcept[];
}

interface ReviewStatus {
  roadmapId: string;
  title: string;
  reviewStatus: string;
  rejectionReason?: string | null;
  modules: ReviewModule[];
  moduleCount: number;
  conceptCount: number;
  pendingCount: number;
  rejectedCount: number;
  canPublish: boolean;
}

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface DeletionRequest {
  id: string;
  user?: { name?: string; email?: string; role?: string } | null;
  reason?: string | null;
  status: string;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  author?: { name?: string } | null;
  authorId?: string | null;
  roadmapId?: string | null;
  conceptId?: string | null;
  createdAt: string;
}

interface GenerationJob {
  id: string;
  jobType: string;
  targetId: string;
  status: string;
  progressCurrent: number;
  progressTotal: number;
  provider?: string | null;
  model?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  resultSummary?: {
    createdCount: number;
    failedCount: number;
    skippedCount: number;
    targetLabel?: string;
    failedItems?: Array<{ title: string; reason: string }>;
  } | null;
}

interface KeyMeta {
  id: string;
  provider: string;
  label?: string | null;
  keyHint: string;
  isDefault: boolean;
  dailyLimit: number;
  defaultModel?: string | null;
}

// ─── review ────────────────────────────────────────────────────────────────

const review: CommandSpec = {
  name: "review",
  usage: "review <queue|show|approve|reject> ...",
  summary: "run the content review queue",
  group: "review",
  role: "admin",
  help: {
    usage: "review <queue|show|approve|reject> ...",
    description: [
      "The review queue: pending concepts in submitted roadmaps plus staged",
      "drafts on published ones. Approve publishes drafts into live content;",
      "reject needs a reason and keeps live bodies untouched.",
    ],
    args: [
      { name: "queue", text: "List everything awaiting review" },
      { name: "show <id>", text: "Full detail for one queued concept" },
      { name: "approve <id>", text: "Approve a queued concept" },
      { name: "reject <id> <reason>", text: "Reject with admin feedback" },
    ],
    examples: ["review queue", "review show a1b2c3", "review approve a1b2c3"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, id, ...rest] = args;

    if (sub === "queue" || !sub) {
      let items: PendingConcept[];
      try {
        ({ data: items } = await api.get<PendingConcept[]>(
          "/admin/content-review/pending",
        ));
      } catch (e) {
        io.print(`review queue: ${errText(e)}`, "err");
        return;
      }
      if (items.length === 0) {
        io.print("queue empty — nothing awaiting review", "dim");
        return;
      }
      io.print(`REVIEW QUEUE [${items.length}]`, "head");
      for (const c of items) {
        const where = (c.placements ?? [])
          .map((p) => p.roadmapTitle || "?")
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(", ");
        const draft = c.draftContent ? " [DRAFT]" : "";
        io.print(
          `  ${shortId(c.id)}  ${c.title}${draft} — ${c.author?.name ?? "?"}${where ? ` <${where}>` : ""}`,
        );
      }
      io.print("", "dim");
      io.print("review show <id> to inspect · approve / reject to decide", "dim");
      return;
    }

    if (sub === "show") {
      if (!needArg(io, id, "review show <id>")) return;
      let items: PendingConcept[];
      try {
        ({ data: items } = await api.get<PendingConcept[]>(
          "/admin/content-review/pending",
        ));
      } catch (e) {
        io.print(`review show: ${errText(e)}`, "err");
        return;
      }
      const c = items.find((x) => x.id === id || x.id.startsWith(id));
      if (!c) {
        io.print(`review show: ${id} is not in the queue`, "err");
        return;
      }
      io.print(`REVIEW · ${c.title}`, "head");
      io.print(row("id", c.id));
      io.print(row("author", `${c.author?.name ?? "?"} <${c.author?.email ?? "?"}>`));
      io.print(row("status", c.reviewStatus));
      io.print(row("difficulty", c.difficulty ?? "—"));
      io.print(row("origin", c.isAiGenerated ? "ai" : "handwritten"));
      for (const p of c.placements ?? []) {
        io.print(row("placed", `${p.roadmapTitle ?? "?"} / ${p.moduleTitle ?? "?"}`));
      }
      if (c.draftContent) {
        io.print("", "dim");
        io.print("STAGED DRAFT (approve publishes this):", "dim");
        io.print(c.draftContent.slice(0, 1200));
      }
      return;
    }

    if (sub === "approve") {
      if (!needArg(io, id, "review approve <id>")) return;
      try {
        await api.patch(`/admin/content-review/${id}/approve`);
        io.print(`[OK] ${shortId(id)} approved`, "ok");
      } catch (e) {
        io.print(`review approve: ${errText(e)}`, "err");
      }
      return;
    }

    if (sub === "reject") {
      if (!needArg(io, id, "review reject <id> <reason>")) return;
      const reason = rest.join(" ").trim();
      if (!reason) {
        io.print("review reject: a reason is required", "err");
        return;
      }
      try {
        await api.patch(`/admin/content-review/${id}/reject`, { reason });
        io.print(`[OK] ${shortId(id)} rejected`, "ok");
      } catch (e) {
        io.print(`review reject: ${errText(e)}`, "err");
      }
      return;
    }

    io.print(`review: unknown subcommand "${sub}" — queue, show, approve, reject`, "err");
  },
};

// ─── roadmap ───────────────────────────────────────────────────────────────

const roadmapCmd: CommandSpec = {
  name: "roadmap",
  usage: "roadmap <review|publish|reject|unpublish|schedule-delete|cancel-delete|purge> ...",
  summary: "publish, reject and retire roadmaps",
  group: "review",
  role: "admin",
  help: {
    usage: "roadmap <review|publish|reject|unpublish|schedule-delete|cancel-delete|purge> ...",
    description: [
      "Whole-roadmap decisions. Publish unlocks only when every concept is",
      "approved; reject sends a roadmap back to draft with a reason;",
      "destructive steps confirm with a typed YES.",
    ],
    args: [
      { name: "review <id>", text: "Compiled review response with publish readiness" },
      { name: "publish <id>", text: "Publish a fully-approved roadmap" },
      { name: "reject <id> <reason>", text: "Reject outright (spam), back to draft" },
      { name: "unpublish <id>", text: "Immediate takedown, approvals intact" },
      { name: "schedule-delete <id>", text: "Moderation delete with 30-day delay" },
      { name: "cancel-delete <id>", text: "Cancel a scheduled deletion" },
      { name: "purge", text: "Hard-delete rows past their deletion date" },
    ],
    examples: ["roadmap review r1", "roadmap publish r1"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, id, ...rest] = args;

    if (sub === "review") {
      if (!needArg(io, id, "roadmap review <id>")) return;
      let r: ReviewStatus;
      try {
        ({ data: r } = await api.get<ReviewStatus>(`/roadmaps/${id}/review`));
      } catch (e) {
        io.print(`roadmap review: ${errText(e)}`, "err");
        return;
      }
      io.print(`REVIEW · ${r.title} [${r.reviewStatus}]`, "head");
      io.print(row("concepts", `${r.conceptCount} (${r.pendingCount} pending, ${r.rejectedCount} rejected)`));
      io.print(row("publishable", r.canPublish ? "YES" : "NO"));
      if (r.rejectionReason) io.print(row("rejection", r.rejectionReason));
      for (const m of r.modules) {
        const mark = m.approved ? "[OK]" : "[..]";
        io.print(`  ${mark} ${m.title}${m.originLabel ? ` {${m.originLabel}}` : ""}`);
        for (const c of m.concepts) {
          const draft = c.hasPendingDraft ? " [DRAFT]" : "";
          io.print(`      ${shortId(c.id)}  ${c.title} <${c.reviewStatus}>${draft}`);
        }
      }
      return;
    }

    if (sub === "publish") {
      if (!needArg(io, id, "roadmap publish <id>")) return;
      try {
        await api.patch(`/admin/content-review/roadmaps/${id}/publish`);
        io.print(`[OK] roadmap ${shortId(id)} published`, "ok");
      } catch (e) {
        io.print(`roadmap publish: ${errText(e)}`, "err");
      }
      return;
    }

    if (sub === "reject") {
      if (!needArg(io, id, "roadmap reject <id> <reason>")) return;
      const reason = rest.join(" ").trim();
      if (!reason) {
        io.print("roadmap reject: a reason is required", "err");
        return;
      }
      if (!(await confirmDestructive(ctx, `Reject roadmap ${shortId(id)} back to draft.`))) return;
      try {
        await api.patch(`/admin/content-review/roadmaps/${id}/reject`, { reason });
        io.print(`[OK] roadmap ${shortId(id)} rejected`, "ok");
      } catch (e) {
        io.print(`roadmap reject: ${errText(e)}`, "err");
      }
      return;
    }

    if (sub === "unpublish") {
      if (!needArg(io, id, "roadmap unpublish <id>")) return;
      if (!(await confirmDestructive(ctx, `Take down roadmap ${shortId(id)} now (approvals kept).`))) return;
      try {
        await api.patch(`/admin/content-review/roadmaps/${id}/unpublish`);
        io.print(`[OK] roadmap ${shortId(id)} unpublished`, "ok");
      } catch (e) {
        io.print(`roadmap unpublish: ${errText(e)}`, "err");
      }
      return;
    }

    if (sub === "schedule-delete") {
      if (!needArg(io, id, "roadmap schedule-delete <id>")) return;
      if (!(await confirmDestructive(ctx, `Schedule deletion of roadmap ${shortId(id)} (30-day delay).`))) return;
      try {
        await api.patch(`/admin/content-review/roadmaps/${id}/schedule-delete`);
        io.print(`[OK] deletion scheduled for ${shortId(id)}`, "ok");
      } catch (e) {
        io.print(`roadmap schedule-delete: ${errText(e)}`, "err");
      }
      return;
    }

    if (sub === "cancel-delete") {
      if (!needArg(io, id, "roadmap cancel-delete <id>")) return;
      try {
        await api.patch(`/admin/content-review/roadmaps/${id}/cancel-scheduled-delete`);
        io.print(`[OK] scheduled deletion cancelled for ${shortId(id)}`, "ok");
      } catch (e) {
        io.print(`roadmap cancel-delete: ${errText(e)}`, "err");
      }
      return;
    }

    if (sub === "purge") {
      if (!(await confirmDestructive(ctx, "Hard-delete every roadmap past its deletion date."))) return;
      try {
        const { data } = await api.delete<{ purged: number }>(
          "/admin/content-review/roadmaps/purge-deleted",
        );
        io.print(`[OK] purged ${data.purged} roadmap(s)`, "ok");
      } catch (e) {
        io.print(`roadmap purge: ${errText(e)}`, "err");
      }
      return;
    }

    io.print(`roadmap: unknown subcommand "${sub ?? ""}" — review, publish, reject, unpublish, schedule-delete, cancel-delete, purge`, "err");
  },
};

// ─── unpublish (request flow) ──────────────────────────────────────────────

const unpublish: CommandSpec = {
  name: "unpublish",
  usage: "unpublish <approve|deny> <id>",
  summary: "decide author takedown requests",
  group: "review",
  role: "admin",
  help: {
    usage: "unpublish <approve|deny> <id>",
    description: [
      "Author takedown requests. Approving starts the 30-day public",
      "countdown; denying keeps the roadmap published.",
    ],
    args: [
      { name: "approve <id>", text: "Approve takedown, start countdown" },
      { name: "deny <id>", text: "Deny takedown, stays published" },
    ],
    examples: ["unpublish approve r1"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, id] = args;
    if ((sub !== "approve" && sub !== "deny") || !id) {
      io.print("usage: unpublish <approve|deny> <id>", "err");
      return;
    }
    try {
      await api.patch(`/admin/content-review/roadmaps/${id}/${sub}-unpublish`);
      io.print(`[OK] takedown ${sub}d for ${shortId(id)}`, "ok");
    } catch (e) {
      io.print(`unpublish ${sub}: ${errText(e)}`, "err");
    }
  },
};

// ─── users ─────────────────────────────────────────────────────────────────

const users: CommandSpec = {
  name: "users",
  usage: "users [search] [--role developer|admin]",
  summary: "list developers and admins",
  group: "users",
  role: "admin",
  help: {
    usage: "users [search] [--role developer|admin]",
    description: ["Directory of developers and admins, newest query first."],
    args: [
      { name: "[search]", text: "Match name or email" },
      { name: "--role", text: "Filter to developer or admin" },
    ],
    examples: ["users", "users ann --role developer"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const searchBits: string[] = [];
    let role = "";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--role") {
        role = args[++i] ?? "";
      } else if (!args[i].startsWith("-")) {
        searchBits.push(args[i]);
      }
    }
    if (role && role !== "developer" && role !== "admin") {
      io.print("users: --role must be developer or admin", "err");
      return;
    }
    const params = new URLSearchParams();
    if (searchBits.join(" ")) params.set("search", searchBits.join(" "));
    if (role) params.set("role", role);
    const qs = params.toString();
    let list: DirectoryUser[];
    try {
      ({ data: list } = await api.get<DirectoryUser[]>(`/users${qs ? `?${qs}` : ""}`));
    } catch (e) {
      io.print(`users: ${errText(e)}`, "err");
      return;
    }
    if (list.length === 0) {
      io.print("no users match", "dim");
      return;
    }
    io.print(`USERS [${list.length}]`, "head");
    for (const u of list) {
      io.print(`  ${shortId(u.id)}  ${u.name} <${u.email}> [${u.role}]`);
    }
  },
};

const userCmd: CommandSpec = {
  name: "user",
  usage: "user delete <id>",
  summary: "permanently delete a developer",
  group: "users",
  role: "admin",
  help: {
    usage: "user delete <id>",
    description: [
      "Delete a developer account. Authored content is preserved; personal",
      "progress data is erased. Admins are protected.",
    ],
    args: [{ name: "delete <id>", text: "Delete by user id" }],
    examples: ["user delete u1"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, id] = args;
    if (sub !== "delete" || !id) {
      io.print("usage: user delete <id>", "err");
      return;
    }
    if (!(await confirmDestructive(ctx, `Permanently delete user ${shortId(id)}?`))) return;
    try {
      await api.delete(`/users/${id}`);
      io.print(`[OK] user ${shortId(id)} deleted`, "ok");
    } catch (e) {
      io.print(`user delete: ${errText(e)}`, "err");
    }
  },
};

const deletions: CommandSpec = {
  name: "deletions",
  usage: "deletions [all]",
  summary: "list account deletion requests",
  group: "users",
  role: "admin",
  help: {
    usage: "deletions [all]",
    description: ["Pending requests by default; `all` includes decided ones."],
    args: [{ name: "[all]", text: "Include approved and rejected requests" }],
    examples: ["deletions", "deletions all"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const showAll = args[0] === "all";
    let list: DeletionRequest[];
    try {
      ({ data: list } = await api.get<DeletionRequest[]>("/users/deletion-requests"));
    } catch (e) {
      io.print(`deletions: ${errText(e)}`, "err");
      return;
    }
    const rows = showAll ? list : list.filter((r) => r.status === "pending");
    if (rows.length === 0) {
      io.print("no deletion requests", "dim");
      return;
    }
    io.print(`DELETIONS [${rows.length}]`, "head");
    for (const r of rows) {
      io.print(
        `  ${shortId(r.id)}  ${r.user?.name ?? "deleted"} <${r.user?.email ?? "?"}> [${r.status}]${r.reason ? ` — ${r.reason.slice(0, 60)}` : ""}`,
      );
    }
  },
};

const deletion: CommandSpec = {
  name: "deletion",
  usage: "deletion <approve|reject> <id>",
  summary: "decide an account deletion request",
  group: "users",
  role: "admin",
  help: {
    usage: "deletion <approve|reject> <id>",
    description: ["Approving erases the account; rejecting keeps it active."],
    args: [
      { name: "approve <id>", text: "Approve and erase the account" },
      { name: "reject <id>", text: "Reject, account stays active" },
    ],
    examples: ["deletion approve d1"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, id] = args;
    if ((sub !== "approve" && sub !== "reject") || !id) {
      io.print("usage: deletion <approve|reject> <id>", "err");
      return;
    }
    if (sub === "approve") {
      if (!(await confirmDestructive(ctx, `Approve deletion ${shortId(id)} and erase the account?`))) return;
    }
    try {
      await api.patch(`/users/deletion-requests/${id}/${sub}`);
      io.print(`[OK] deletion ${sub}d`, "ok");
    } catch (e) {
      io.print(`deletion ${sub}: ${errText(e)}`, "err");
    }
  },
};

// ─── articles ──────────────────────────────────────────────────────────────

const articles: CommandSpec = {
  name: "articles",
  usage: "articles [search]",
  summary: "list public articles",
  group: "articles",
  role: "admin",
  help: {
    usage: "articles [search]",
    description: ["Public articles, newest first, optional title search."],
    args: [{ name: "[search]", text: "Match the title" }],
    examples: ["articles", "articles closures"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const qs = args.length ? `?search=${encodeURIComponent(args.join(" "))}` : "";
    let list: ArticleItem[];
    try {
      ({ data: list } = await api.get<ArticleItem[]>(`/articles${qs}`));
    } catch (e) {
      io.print(`articles: ${errText(e)}`, "err");
      return;
    }
    if (list.length === 0) {
      io.print("no articles", "dim");
      return;
    }
    io.print(`ARTICLES [${list.length}]`, "head");
    for (const a of list) {
      io.print(`  ${shortId(a.id)}  ${a.title} — ${a.author?.name ?? "?"}`);
    }
  },
};

const article: CommandSpec = {
  name: "article",
  usage: "article <show|delete> ...",
  summary: "inspect or moderate an article",
  group: "articles",
  role: "admin",
  help: {
    usage: "article <show|delete> ...",
    description: ["Read one article, or delete it with a reason to the author."],
    args: [
      { name: "show <id>", text: "Print the article" },
      { name: "delete <id> <reason>", text: "Moderation delete with reason" },
    ],
    examples: ["article show a1"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, id, ...rest] = args;
    if (sub === "show") {
      if (!needArg(io, id, "article show <id>")) return;
      let a: ArticleItem & { content?: string };
      try {
        ({ data: a } = await api.get<ArticleItem & { content?: string }>(`/articles/${id}`));
      } catch (e) {
        io.print(`article show: ${errText(e)}`, "err");
        return;
      }
      io.print(`ARTICLE · ${a.title}`, "head");
      io.print(row("author", a.author?.name ?? "?"));
      io.print(row("slug", a.slug));
      io.print("");
      io.print((a.content ?? "").slice(0, 2000));
      return;
    }
    if (sub === "delete") {
      if (!needArg(io, id, "article delete <id> <reason>")) return;
      const reason = rest.join(" ").trim();
      if (!reason) {
        io.print("article delete: a reason is required (it goes to the author)", "err");
        return;
      }
      if (!(await confirmDestructive(ctx, `Delete article ${shortId(id)}? The author gets the reason.`))) return;
      try {
        await apiClient.delete(`/articles/admin/${id}`, { data: { reason } });
        io.print(`[OK] article ${shortId(id)} deleted, author notified`, "ok");
      } catch (e) {
        io.print(`article delete: ${errText(e)}`, "err");
      }
      return;
    }
    io.print(`article: unknown subcommand "${sub ?? ""}" — show, delete`, "err");
  },
};

// ─── jobs ──────────────────────────────────────────────────────────────────

function jobLine(j: GenerationJob): string {
  const total = j.progressTotal || 0;
  return `  ${shortId(j.id)}  [${j.status}] ${j.jobType} → ${j.targetId.slice(0, 8)} (${j.progressCurrent}/${total})${j.provider ? ` {${j.provider}${j.model ? `/${j.model}` : ""}}` : ""}`;
}

const jobs: CommandSpec = {
  name: "jobs",
  usage: "jobs [active|results]",
  summary: "list AI generation jobs",
  group: "jobs",
  role: "admin",
  help: {
    usage: "jobs [active|results]",
    description: ["Running jobs by default; finished, unread results with `results`."],
    args: [{ name: "[active|results]", text: "Which set to list" }],
    examples: ["jobs", "jobs results"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const which = args[0] ?? "active";
    if (which !== "active" && which !== "results") {
      io.print("jobs: expected active or results", "err");
      return;
    }
    const path =
      which === "active" ? "/ai-generate/jobs/active" : "/ai-generate/jobs/results";
    let list: GenerationJob[];
    try {
      ({ data: list } = await api.get<GenerationJob[]>(path));
    } catch (e) {
      io.print(`jobs: ${errText(e)}`, "err");
      return;
    }
    if (list.length === 0) {
      io.print(`no ${which} jobs`, "dim");
      return;
    }
    io.print(`JOBS · ${which.toUpperCase()} [${list.length}]`, "head");
    for (const j of list) io.print(jobLine(j));
  },
};

const job: CommandSpec = {
  name: "job",
  usage: "job <show|ack> ...",
  summary: "inspect or acknowledge a job",
  group: "jobs",
  role: "admin",
  help: {
    usage: "job <show|ack> ...",
    description: ["Status and result summary, or acknowledge finished results."],
    args: [
      { name: "show <id>", text: "Status, progress and result" },
      { name: "ack [ids...]", text: "Acknowledge results (all when omitted)" },
    ],
    examples: ["job show j1", "job ack"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, ...rest] = args;
    if (sub === "show") {
      if (!needArg(io, rest[0], "job show <id>")) return;
      let j: GenerationJob;
      try {
        ({ data: j } = await api.get<GenerationJob>(`/ai-generate/jobs/${rest[0]}`));
      } catch (e) {
        io.print(`job show: ${errText(e)}`, "err");
        return;
      }
      io.print(`JOB · ${shortId(j.id)} [${j.status}]`, "head");
      io.print(row("type", j.jobType));
      io.print(row("target", j.targetId));
      io.print(row("progress", `${j.progressCurrent}/${j.progressTotal}`));
      if (j.provider) io.print(row("provider", `${j.provider}${j.model ? ` / ${j.model}` : ""}`));
      if (j.errorMessage) io.print(row("error", j.errorMessage));
      const s = j.resultSummary;
      if (s) {
        io.print(row("created", String(s.createdCount)));
        io.print(row("failed", String(s.failedCount)));
        for (const f of s.failedItems ?? []) io.print(`  ! ${f.title} — ${f.reason}`);
      }
      return;
    }
    if (sub === "ack") {
      try {
        const { data } = await api.post<{ acknowledged: number }>(
          "/ai-generate/jobs/acknowledge",
          rest.length ? { jobIds: rest } : {},
        );
        io.print(`[OK] acknowledged ${data.acknowledged}`, "ok");
      } catch (e) {
        io.print(`job ack: ${errText(e)}`, "err");
      }
      return;
    }
    io.print(`job: unknown subcommand "${sub ?? ""}" — show, ack`, "err");
  },
};

// ─── keys & quota ──────────────────────────────────────────────────────────

const keys: CommandSpec = {
  name: "keys",
  usage: "keys",
  summary: "list your stored provider keys",
  group: "keys",
  role: "admin",
  help: {
    usage: "keys",
    description: ["Metadata only — secrets never come back to the shell."],
    examples: ["keys"],
  },
  run: async ({ io }) => {
    let list: KeyMeta[];
    try {
      ({ data: list } = await api.get<KeyMeta[]>("/ai-keys"));
    } catch (e) {
      io.print(`keys: ${errText(e)}`, "err");
      return;
    }
    if (list.length === 0) {
      io.print("no stored keys — generations run on the free tier", "dim");
      return;
    }
    io.print(`KEYS [${list.length}/2]`, "head");
    for (const k of list) {
      io.print(
        `  ${shortId(k.id)}  ${k.provider} ····${k.keyHint}  cap ${k.dailyLimit}/day${k.isDefault ? " [DEFAULT]" : ""}${k.label ? ` — ${k.label}` : ""}${k.defaultModel ? ` <${k.defaultModel}>` : ""}`,
      );
    }
  },
};

const key: CommandSpec = {
  name: "key",
  usage: "key <default|cap|delete> ...",
  summary: "manage one stored provider key",
  group: "keys",
  role: "admin",
  help: {
    usage: "key <default|cap|delete> ...",
    description: ["Pick the default key, set a cap (1–50), or delete one."],
    args: [
      { name: "default <id>", text: "Route all generations through this key" },
      { name: "cap <id> <n>", text: "Daily cap, 1 to 50" },
      { name: "delete <id>", text: "Delete (blocked while a job uses it)" },
    ],
    examples: ["key default k1", "key cap k1 50"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, id, extra] = args;
    if (sub === "default") {
      if (!needArg(io, id, "key default <id>")) return;
      try {
        await api.patch(`/ai-keys/${id}`, { isDefault: true });
        io.print(`[OK] ${shortId(id)} is now the default key`, "ok");
      } catch (e) {
        io.print(`key default: ${errText(e)}`, "err");
      }
      return;
    }
    if (sub === "cap") {
      if (!id || !extra) {
        io.print("usage: key cap <id> <n>", "err");
        return;
      }
      const n = Number(extra);
      if (!Number.isInteger(n) || n < 1 || n > 50) {
        io.print("key cap: n must be an integer from 1 to 50", "err");
        return;
      }
      try {
        await api.patch(`/ai-keys/${id}`, { dailyLimit: n });
        io.print(`[OK] cap set to ${n}/day`, "ok");
      } catch (e) {
        io.print(`key cap: ${errText(e)}`, "err");
      }
      return;
    }
    if (sub === "delete") {
      if (!needArg(io, id, "key delete <id>")) return;
      if (!(await confirmDestructive(ctx, `Delete key ${shortId(id)}? Usage falls back to the free tier.`))) return;
      try {
        await api.delete(`/ai-keys/${id}`);
        io.print(`[OK] key ${shortId(id)} deleted`, "ok");
      } catch (e) {
        io.print(`key delete: ${errText(e)}`, "err");
      }
      return;
    }
    io.print(`key: unknown subcommand "${sub ?? ""}" — default, cap, delete`, "err");
  },
};

const quota: CommandSpec = {
  name: "quota",
  usage: "quota",
  summary: "show what the next generation would use",
  group: "keys",
  role: "admin",
  help: {
    usage: "quota",
    description: ["Tier, provider and remaining allowance for the next call."],
    examples: ["quota"],
  },
  run: async ({ io }) => {
    try {
      const { data } = await api.get<{
        remaining: number;
        limit: number;
        unlimited: boolean;
        tier: string;
        provider: string;
      }>("/ai-generate/quota");
      if (data.unlimited) {
        io.print("quota: UNLIMITED [admin]", "ok");
        return;
      }
      io.print(`quota: ${data.remaining}/${data.limit} [${data.tier} · ${data.provider}]`, "ok");
    } catch (e) {
      io.print(`quota: ${errText(e)}`, "err");
    }
  },
};

const providers: CommandSpec = {
  name: "providers",
  usage: "providers",
  summary: "list supported AI providers",
  group: "keys",
  role: "admin",
  help: {
    usage: "providers",
    description: ["Providers, defaults, and which are BYOK-only."],
    examples: ["providers"],
  },
  run: async ({ io }) => {
    try {
      const { data } = await api.get<
        Array<{ provider: string; displayName: string; byokOnly: boolean; defaultModel: string }>
      >("/ai-providers");
      io.print("PROVIDERS", "head");
      for (const p of data) {
        io.print(`  ${p.provider}  ${p.displayName}${p.byokOnly ? " [BYOK-only]" : ""} <${p.defaultModel}>`);
      }
    } catch (e) {
      io.print(`providers: ${errText(e)}`, "err");
    }
  },
};

const models: CommandSpec = {
  name: "models",
  usage: "models <nvidia|gemini> [--key <id>]",
  summary: "live model list for a provider",
  group: "keys",
  role: "admin",
  help: {
    usage: "models <nvidia|gemini> [--key <id>]",
    description: ["Auto-fetched list; curated fallback when unreachable."],
    args: [
      { name: "<provider>", text: "nvidia or gemini" },
      { name: "--key <id>", text: "List with one of your stored keys" },
    ],
    examples: ["models gemini"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    let provider = "";
    let keyId = "";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--key") keyId = args[++i] ?? "";
      else if (!args[i].startsWith("-")) provider = args[i];
    }
    if (provider !== "nvidia" && provider !== "gemini") {
      io.print("models: provider must be nvidia or gemini", "err");
      return;
    }
    const qs = keyId ? `?keyId=${encodeURIComponent(keyId)}` : "";
    try {
      const { data } = await api.get<{ models: string[]; live: boolean }>(
        `/ai-providers/${provider}/models${qs}`,
      );
      io.print(`MODELS · ${provider} [${data.live ? "live" : "fallback"}]`, "head");
      for (const m of data.models) io.print(`  ${m}`);
    } catch (e) {
      io.print(`models: ${errText(e)}`, "err");
    }
  },
};

// ─── analytics ─────────────────────────────────────────────────────────────

const overview: CommandSpec = {
  name: "overview",
  usage: "overview",
  summary: "platform numbers at a glance",
  group: "analytics",
  role: "admin",
  help: {
    usage: "overview",
    description: ["Developers, content totals, activity and XP in one panel."],
    examples: ["overview"],
  },
  run: async ({ io }) => {
    try {
      const { data } = await api.get<{
        totalDevelopers: number;
        totalAdmins: number;
        totalRoadmaps: number;
        totalModules: number;
        totalConcepts: number;
        totalConceptCompletions: number;
        activeDevelopers: number;
        totalXpAwarded: number;
      }>("/admin/analytics/overview");
      io.print("PLATFORM OVERVIEW", "head");
      io.print(row("developers", `${data.totalDevelopers} (${data.activeDevelopers} active 7d)`));
      io.print(row("admins", String(data.totalAdmins)));
      io.print(row("roadmaps", String(data.totalRoadmaps)));
      io.print(row("modules", String(data.totalModules)));
      io.print(row("concepts", String(data.totalConcepts)));
      io.print(row("completions", String(data.totalConceptCompletions)));
      io.print(row("total xp", Number(data.totalXpAwarded).toLocaleString()));
    } catch (e) {
      io.print(`overview: ${errText(e)}`, "err");
    }
  },
};

const analytics: CommandSpec = {
  name: "analytics",
  usage: "analytics developers",
  summary: "per-developer activity table",
  group: "analytics",
  role: "admin",
  help: {
    usage: "analytics developers",
    description: ["Content and Q&A activity per developer."],
    args: [{ name: "developers", text: "The per-developer breakdown" }],
    examples: ["analytics developers"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    if (args[0] !== "developers") {
      io.print("usage: analytics developers", "err");
      return;
    }
    let list: Array<{
      developerId: string;
      name: string;
      email: string;
      roadmapsCreated: number;
      conceptsAuthored: number;
      questionsAnswered: number;
      mcqQuestionsCreated: number;
    }>;
    try {
      const res = await api.get("/admin/analytics/developers");
      list = res.data as Array<{
        developerId: string;
        name: string;
        email: string;
        roadmapsCreated: number;
        conceptsAuthored: number;
        questionsAnswered: number;
        mcqQuestionsCreated: number;
      }>;
    } catch (e) {
      io.print(`analytics: ${errText(e)}`, "err");
      return;
    }
    if (list.length === 0) {
      io.print("no developers yet", "dim");
      return;
    }
    io.print(`DEVELOPERS [${list.length}]`, "head");
    for (const d of list) {
      io.print(
        `  ${shortId(d.developerId)}  ${d.name} <${d.email}> — ${d.roadmapsCreated} roadmaps · ${d.conceptsAuthored} concepts · ${d.questionsAnswered} answers · ${d.mcqQuestionsCreated} mcqs`,
      );
    }
  },
};

// ─── navigate ──────────────────────────────────────────────────────────────

const dashboard: CommandSpec = {
  name: "dashboard",
  usage: "dashboard",
  summary: "return to mission control",
  group: "navigate",
  role: "admin",
  help: {
    usage: "dashboard",
    description: ["Leave the shell for the admin dashboard, keeping the session."],
    examples: ["dashboard"],
  },
  run: (ctx) => {
    const navigate = ctx.navigate;
    if (navigate) navigate("/admin/dashboard");
    else ctx.io.close();
  },
};

// ─── qa (moderation) ───────────────────────────────────────────────────────

const qa: CommandSpec = {
  name: "qa",
  usage: "qa <verify|unverify> <answerId>",
  summary: "verify discussion answers",
  group: "review",
  role: "admin",
  help: {
    usage: "qa <verify|unverify> <answerId>",
    description: [
      "Mark a discussion answer verified (or remove it). Authoritative",
      "answers from authors and admins verify themselves on arrival —",
      "this is for everyone else's.",
    ],
    args: [
      { name: "verify <id>", text: "Badge an answer as verified" },
      { name: "unverify <id>", text: "Remove the verified badge" },
    ],
    examples: ["qa verify a1"],
  },
  run: async (ctx) => {
    const { args, io } = ctx;
    const [sub, id] = args;
    if ((sub !== "verify" && sub !== "unverify") || !id) {
      io.print("usage: qa <verify|unverify> <answerId>", "err");
      return;
    }
    try {
      await api.patch(`/answers/${id}/${sub}`);
      io.print(`[OK] answer ${shortId(id)} ${sub === "verify" ? "verified" : "unverified"}`, "ok");
    } catch (e) {
      io.print(`qa ${sub}: ${errText(e)}`, "err");
    }
  },
};

// ─── Registry ──────────────────────────────────────────────────────────────

export const ADMIN_COMMANDS: CommandSpec[] = [
  review,
  roadmapCmd,
  unpublish,
  qa,
  users,
  userCmd,
  deletions,
  deletion,
  articles,
  article,
  jobs,
  job,
  keys,
  key,
  quota,
  providers,
  models,
  overview,
  analytics,
  dashboard,
];
