import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const requirePackage = createRequire(import.meta.url);
export function dashboardHarness({
  shellHooks,
  windowMock,
  documentMock,
} = {}) {
  const cache = {},
    modes = [],
    calls = [];
  const root = new URL("../../", import.meta.url);
  function load(url) {
    const key = url.href;
    if (cache[key]) return cache[key];
    const exports = (cache[key] = {});
    const code = ts.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2019,
      },
    }).outputText;
    vm.runInNewContext(code, {
      exports,
      window: windowMock,
      document: documentMock,
      require: (name) => {
        if (
          name === "react" &&
          shellHooks &&
          url.pathname.endsWith("gui-workspace-shell.tsx")
        )
          return { ...requirePackage(name), ...shellHooks };
        if (name.endsWith(".css")) {
          const prefix = name
            .split("/")
            .at(-1)
            .replace(/\.module\.css$/, "")
            .replaceAll("-", "_");
          return {
            default: new Proxy({}, { get: (_, cls) => `${prefix}_${cls}` }),
          };
        }
        if (name === "next/link")
          return {
            default: ({ children, ...props }) =>
              createElement("a", props, children),
          };
        if (name === "next/navigation")
          return {
            usePathname: () => "/developer/dashboard",
            useRouter: () => ({ replace: (path) => calls.push(path) }),
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({ clear: () => calls.push("clearQueries") }),
          };
        if (name === "@/providers/ui-mode-provider")
          return {
            useUiMode: () => ({
              setMode: (...args) => modes.push(args),
              location: { kind: "root" },
            }),
          };
        if (name === "@/providers/theme-provider")
          return {
            useTheme: () => ({
              isDark: false,
              toggleTheme: () => calls.push("theme"),
            }),
          };
        if (name === "@/lib/api-client") return { default: {} };
        if (name === "@/lib/auth")
          return { clearAuth: () => calls.push("clearAuth") };
        if (name === "@/lib/terminal/session")
          return {
            clearTerminalSessions: () => calls.push("clearTerminalSessions"),
          };
        if (name === "@/lib/terminal/location")
          return { toCliRoute: () => "/developer/terminal" };
        if (name.startsWith("@/"))
          return load(
            new URL(
              `${name.slice(2)}.${name === "@/lib/auth" || name === "@/lib/timezone" ? "ts" : "tsx"}`,
              root,
            ),
          );
        if (name.startsWith("./"))
          return load(
            new URL(
              `${name}.${name === "./dashboard-data" ? "ts" : "tsx"}`,
              url,
            ),
          );
        return requirePackage(name);
      },
    });
    return exports;
  }
  const data = load(new URL("./dashboard-data.ts", import.meta.url));
  const view = load(new URL("./dashboard-view.tsx", import.meta.url));
  const shell = load(
    new URL("../gui/gui-workspace-shell.tsx", import.meta.url),
  );
  return {
    data,
    view,
    shell,
    modes,
    calls,
    render: (props, user) =>
      renderToStaticMarkup(
        createElement(
          shell.GuiWorkspaceShell,
          { user },
          createElement(view.DashboardView, props),
        ),
      ),
  };
}

export const ready = (data) => ({
  data,
  pending: false,
  error: false,
  retry() {},
});
export function emptyProps() {
  return {
    user: ready({
      id: "fixture-user",
      name: "Sample Learner",
      role: "developer",
      timezone: "Asia/Kolkata",
    }),
    gamification: ready({
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      earnedBadges: [],
    }),
    progress: ready([]),
    activity: ready([]),
    roadmaps: ready([]),
    badges: ready([]),
    review: ready({ count: 0, dueCount: 0 }),
    renderRoadmap: () => null,
  };
}

test("most recent started concept is selected without mutation or invented fallback", () => {
  const { data } = dashboardHarness();
  const rows = [
    {
      conceptId: "older",
      status: "in_progress",
      updatedAt: "2026-10-01",
      concept: { title: "Old" },
    },
    {
      conceptId: "done",
      status: "completed",
      updatedAt: "2026-10-09",
      concept: { title: "Done" },
    },
    {
      conceptId: "recent",
      status: "in_progress",
      updatedAt: "2026-10-08",
      concept: { title: "Recent" },
    },
    { conceptId: "deleted", status: "in_progress", updatedAt: "2026-10-09" },
  ];
  const before = JSON.stringify(rows);
  assert.equal(data.currentFocus(rows).conceptId, "recent");
  assert.equal(data.currentFocus([]), undefined);
  assert.equal(JSON.stringify(rows), before);
});
test("FSRS session size stays distinct from due, held-back and inaccessible histories", () => {
  const { data } = dashboardHarness();
  assert.equal(
    data.reviewSummary({
      dueCount: 80,
      sessionCount: 50,
      heldBackCount: 20,
      unavailableCount: 10,
    }).session,
    50,
  );
  assert.equal(data.reviewSummary({ count: 5, dueCount: 5 }).session, 5);
  assert.equal(
    data.reviewSummary({ dueCount: 8, sessionCount: 0, unavailableCount: 8 })
      .session,
    0,
  );
});
test("activity uses civil dates, weekday padding and exact XP tiers", () => {
  const { data } = dashboardHarness();
  const weeks = data.activityWeeks([
    { date: "2026-10-09", xp: 25, active: true },
    { date: "2026-10-08", xp: 0, active: false },
  ]);
  assert.equal(weeks[0][4].date, "2026-10-08");
  assert.equal(weeks[0][5].date, "2026-10-09");
  assert.equal(weeks[0][0], null);
  assert.deepEqual(
    [0, 1, 24, 25, 59, 60, 109, 110].map(data.activityLevel),
    [0, 1, 1, 2, 2, 3, 3, 4],
  );
  assert.equal(data.activityWeeks([]).length, 0);
});
test("milestones preserve awards removed from catalog and events skip invalid timestamps", () => {
  const { data } = dashboardHarness();
  const earned = [
    {
      id: "historical",
      name: "First idea",
      criteriaKey: "first_concept",
      earnedAt: "2026-10-08",
    },
  ];
  assert.equal(data.badgeRows([], earned)[0].earnedAt, "2026-10-08");
  assert.equal(
    data.badgeRows(
      [{ id: "new", name: "First idea", criteriaKey: "first_concept" }],
      earned,
    ).length,
    1,
  );
  const events = data.recentEvents(
    [
      {
        id: "invalid",
        status: "completed",
        completedAt: "bad",
        concept: { title: "Invalid" },
      },
    ],
    earned,
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, "Earned badge");
  assert.equal(events[0].xp, undefined);
});
test("roadmap totals support legacy fields and never overrun progress bounds", () => {
  const { data } = dashboardHarness();
  assert.equal(
    data.roadmapSummary({ totalConcepts: 8, completedConcepts: 3 }).percentage,
    38,
  );
  assert.equal(
    data.roadmapSummary({ totalConcepts: 3, completedConceptsCount: 99 })
      .percentage,
    100,
  );
  assert.equal(data.roadmapSummary({ totalConcepts: 0 }).percentage, 0);
});
test("actual dashboard empty, pending and error UI are distinct and actionable", () => {
  const h = dashboardHarness(),
    props = emptyProps();
  const empty = h.render(props, props.user.data);
  assert.match(empty, /No roadmaps available yet/);
  assert.match(empty, /You’re all caught up/);
  assert.match(
    empty,
    /Your completed concepts and earned badges will appear here/,
  );
  assert.doesNotMatch(empty, /SYS:|auth_guard|terminal boot/);
  const pending = h.render({
    ...props,
    progress: { pending: true, error: false, retry() {} },
  });
  assert.match(pending, /Loading learning progress/);
  assert.doesNotMatch(pending, /Browse roadmaps/);
  const error = h.render({
    ...props,
    review: { pending: false, error: true, retry() {} },
  });
  assert.match(error, /Review queue couldn’t load/);
  assert.match(error, /Try again/);
  assert.doesNotMatch(error, /You’re all caught up|Start a review/);
  assert.match(error, /role="alert"/);
});
test("stale refresh failure retains data and clearly labels it", () => {
  const props = emptyProps();
  const html = dashboardHarness().render({
    ...props,
    review: { ...ready({ dueCount: 3 }), error: true },
  });
  assert.match(html, /Review queue couldn’t refresh/);
  assert.match(html, /Showing the last loaded data/);
  assert.match(html, /3 items are ready/);
});
test("review action never promises an unavailable session", () => {
  const props = emptyProps();
  const html = dashboardHarness().render({
    ...props,
    review: ready({ dueCount: 8, sessionCount: 0, unavailableCount: 8 }),
  });
  assert.match(html, /8 unavailable/);
  assert.doesNotMatch(html, /Start a review/);
});
test("CLI handoffs are marked and persist mode without racing default navigation", () => {
  const h = dashboardHarness();
  const link = h.view.CliLink({
    href: "/developer/terminal?view=review",
    children: "Review",
  });
  link.props.onClick();
  assert.equal(h.modes[0][0], "cli");
  assert.equal(h.modes[0][1].navigate, false);
  assert.equal(link.props.href, "/developer/terminal?view=review");
  assert.match(renderToStaticMarkup(link), /CLI/);
});
test("shell provides named navigation, skip target, GUI confirmation and admin escape", () => {
  const h = dashboardHarness(),
    props = emptyProps();
  const html = h.render(props, { ...props.user.data, role: "admin" });
  assert.match(html, /aria-label="Workspace navigation"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /id="workspace-content"/);
  assert.match(html, /aria-controls="workspace-sidebar"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Notifications — opens in CLI/);
  assert.match(html, /href="\/admin\/dashboard"/);
  assert.match(html, /Log out of source:dev\?/);
  assert.match(html, /Stay here/);
});

test("GUI menu Escape and logout dialog preserve focus and clear the existing session caches", () => {
  const effects = [],
    refs = [],
    states = [],
    focus = [],
    listeners = new Map();
  const h = dashboardHarness({
    shellHooks: {
      useState: () => [true, (value) => states.push(value)],
      useRef: () => {
        const ref = { current: null };
        refs.push(ref);
        return ref;
      },
      useEffect: (callback) => effects.push(callback),
    },
    windowMock: {
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
    documentMock: { activeElement: { focus: () => focus.push("previous") } },
  });
  const tree = h.shell.GuiWorkspaceShell({ children: null });
  refs[0].current = { focus: () => focus.push("menu") };
  refs[1].current = {
    showModal: () => focus.push("modal"),
    close: () => focus.push("close"),
  };
  refs[2].current = { focus: () => focus.push("stay") };
  const cleanups = effects.map((effect) => effect());
  listeners.get("keydown")({ key: "Escape" });
  assert.equal(states.at(-1), false);
  assert.deepEqual(focus, ["modal", "stay", "menu"]);
  const buttons = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "button" && node.props.children === "Log out")
      buttons.push(node);
    [node.props?.children].flat(Infinity).forEach(visit);
  }
  visit(tree);
  buttons.at(-1).props.onClick();
  assert.deepEqual(h.calls, [
    "clearTerminalSessions",
    "clearAuth",
    "clearQueries",
    "/login",
  ]);
  cleanups.forEach((cleanup) => cleanup?.());
  assert.equal(listeners.size, 0);
  assert.deepEqual(focus.slice(-2), ["close", "previous"]);
});
test("activity has an accessible exact-data alternative and roadmap errors do not become 0%", () => {
  const h = dashboardHarness(),
    props = emptyProps();
  const html = h.render({
    ...props,
    activity: ready([{ date: "2026-10-09", active: true, xp: 25 }]),
  });
  assert.match(html, /Daily XP data/);
  assert.match(html, /<caption>Daily XP/);
  assert.match(html, /role="img"/);
  const roadmap = renderToStaticMarkup(
    createElement(h.view.RoadmapCard, {
      roadmap: { id: "a", title: "Real roadmap" },
      progress: { pending: false, error: true, retry() {} },
    }),
  );
  assert.match(roadmap, /Roadmap progress couldn’t load/);
  assert.doesNotMatch(roadmap, /0%|<progress/);
});
test("new presentation is scoped and motion respects reduced-motion preference", () => {
  const css = readFileSync(
    new URL("./dashboard.module.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /animation: none/);
  assert.match(css, /overflow-x: auto/);
  assert.match(css, /minmax\(0, 1fr\)/);
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i);
  const controller = readFileSync(
    new URL("./gui-dashboard.tsx", import.meta.url),
    "utf8",
  );
  assert.match(controller, /signal, timeout: 12000/);
  assert.match(controller, /useRoadmapProgress\(roadmap.id\)/);
  assert.doesNotMatch(controller, /useAllRoadmapsProgress|post\(|patch\(/);
});

// Exported helpers also support an isolated, visibly labeled layout fixture; no auth bypass.
export const harnessPath = fileURLToPath(import.meta.url);
