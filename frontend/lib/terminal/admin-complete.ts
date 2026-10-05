/* ==========================================================================
   source:dev terminal — admin value completion
   --------------------------------------------------------------------------
   Live-argument completion for the admin shell, mirroring the student
   catalogue pattern: starts-with first, then contains, capped at twelve,
   returned as whole `verb …` lines. Subcommand keywords complete from
   static tables (the same lists the commands validate against); ids and
   emails complete against the admin list endpoints. Anything unknown
   returns null so the shared completer falls through. Failures complete
   to nothing — a dead network must never break typing.
   ========================================================================== */

import { api } from "./request";

const CAP = 12;

function quoteValue(value: string): string {
  return /\s/.test(value) ? `"${value.replace(/"/g, "")}"` : value;
}

function matchWhole(head: string, values: string[], typed: string): string[] {
  const needle = typed.toLowerCase();
  const starts = values.filter((v) => v.toLowerCase().startsWith(needle));
  const hits = (
    starts.length
      ? starts
      : values.filter((v) => v.toLowerCase().includes(needle))
  ).slice(0, CAP);
  return hits.map((v) => `${head} ${quoteValue(v)}`);
}

async function tryFetch<T>(url: string): Promise<T[]> {
  try {
    const { data } = await api.get<T[]>(url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

interface PendingConcept {
  id: string;
  title: string;
}
interface RoadmapRef {
  id: string;
  slug?: string;
  title: string;
}
interface UserRef {
  id: string;
  email: string;
  name: string;
}
interface JobRef {
  id: string;
}
interface ArticleRef {
  id: string;
  title: string;
}
interface KeyRef {
  id: string;
  provider: string;
  label?: string | null;
}

const SUBCOMMANDS: Record<string, string[]> = {
  review: ["queue", "show", "approve", "reject"],
  roadmap: [
    "review",
    "publish",
    "reject",
    "unpublish",
    "schedule-delete",
    "cancel-delete",
    "purge",
  ],
  unpublish: ["approve", "deny"],
  qa: ["verify", "unverify"],
  users: [],
  user: ["delete"],
  deletions: [],
  deletion: ["approve", "reject"],
  notifications: ["read", "clear"],
  articles: [],
  article: ["show", "delete"],
  jobs: ["active", "results"],
  job: ["show", "ack"],
  keys: [],
  key: ["default", "cap", "delete"],
  quota: [],
  providers: [],
  models: ["nvidia", "gemini"],
  overview: [],
  analytics: ["developers"],
  dashboard: [],
};

async function roadmapSlugs(): Promise<string[]> {
  const items = await tryFetch<RoadmapRef>("/roadmaps");
  return items.map((r) => r.slug || r.id);
}

async function userIds(search: string): Promise<string[]> {
  const items = await tryFetch<UserRef>(
    `/users?search=${encodeURIComponent(search)}`,
  );
  return items.map((u) => u.id);
}

const ID_COMMANDS: Record<string, { fetch: (typed: string) => Promise<string[]> }> = {
  review: {
    fetch: async () => {
      const items = await tryFetch<PendingConcept>(
        "/admin/content-review/pending",
      );
      return items.map((c) => c.id);
    },
  },
  roadmap: {
    fetch: async () => roadmapSlugs(),
  },
  unpublish: {
    fetch: async () => roadmapSlugs(),
  },
  user: {
    fetch: async (typed) => userIds(typed),
  },
  job: {
    fetch: async () => {
      const items = await tryFetch<JobRef>("/ai-generate/jobs/active");
      return items.map((j) => j.id);
    },
  },
  article: {
    fetch: async () => {
      const items = await tryFetch<ArticleRef>("/articles");
      return items.map((a) => a.id);
    },
  },
  key: {
    fetch: async () => {
      const items = await tryFetch<KeyRef>("/ai-keys");
      return items.map((k) => k.id);
    },
  },
};

/**
 * Complete one admin-shell argument. Returns null when the verb is not an
 * admin verb (caller falls through), otherwise the whole-line candidates.
 * `head` is the verb plus any subcommand already typed, so multi-word
 * fragments complete whole.
 */
export async function completeAdminValues(
  verb: string,
  operands: string[],
  fragment: string,
  head: string,
): Promise<string[] | null> {
  const subs = SUBCOMMANDS[verb];
  if (!subs) return null;

  // Still naming the subcommand (or the verb takes none / takes free text).
  if (operands.length === 0) {
    if (verb === "users") {
      const users = await tryFetch<UserRef>(
        `/users?search=${encodeURIComponent(fragment)}`,
      );
      return matchWhole(
        head,
        users.map((u) => u.email),
        fragment,
      );
    }
    return matchWhole(head, subs, fragment);
  }

  // Past the subcommand: ids for the commands that take them.
  const idCompleter = ID_COMMANDS[verb];
  if (!idCompleter || operands.length > 1) return [];
  const ids = await idCompleter.fetch(fragment);
  return matchWhole(head, ids, fragment);
}
