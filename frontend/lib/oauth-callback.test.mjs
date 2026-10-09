import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function harness({
  get,
  patch,
  timezone = "Asia/Kolkata",
  storageThrows = false,
} = {}) {
  const calls = [],
    writes = [],
    cache = {};
  const user = { id: "test-user", role: "developer" };
  const dependencies = {
    "./auth-flow-client": {
      default: {
        get: async (...args) => {
          calls.push(["get", ...args]);
          return get ? get(...args) : { data: user };
        },
        patch: async (...args) => {
          calls.push(["patch", ...args]);
          return patch ? patch(...args) : { data: user };
        },
      },
    },
    "./api-client": {},
    "./auth": {
      setToken: (token) => writes.push(["token", token]),
      setUser: (profile) => {
        if (storageThrows) throw new Error("storage");
        writes.push(["user", profile]);
      },
      clearAuth: () => writes.push(["cleared"]),
    },
    "./timezone": { detectTimezone: () => timezone },
  };
  function load(name) {
    if (dependencies[name]) return dependencies[name];
    if (cache[name]) return cache[name];
    const exports = (cache[name] = {});
    const { outputText } = ts.transpileModule(
      readFileSync(new URL(`${name}.ts`, import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2017,
        },
      },
    );
    vm.runInNewContext(outputText, {
      exports,
      require: load,
      sessionStorage: { setItem: (key, value) => writes.push([key, value]) },
    });
    return exports;
  }
  return { ...load("./oauth-callback"), calls, writes, user };
}
const input = { token: "test-provider-token", newAccount: false };

test("callback query handles missing token and malformed provider errors safely", () => {
  const h = harness();
  assert.ok(h.readCallbackInput(new URLSearchParams()).problem);
  const failed = h.readCallbackInput(
    new URLSearchParams("token=test&error=%E0%A4%A"),
  );
  assert.ok(failed.problem);
  assert.equal(failed.token, "");
  assert.doesNotMatch(
    JSON.stringify(failed.problem),
    /%E0|test-provider-token/,
  );
  assert.equal(
    h.readCallbackInput(new URLSearchParams("token=test&new=1")).newAccount,
    true,
  );
  assert.equal(
    h.readCallbackInput(new URLSearchParams("token=test&new=true")).newAccount,
    false,
  );
});

test("profile verification uses explicit provider token before any auth writes", async () => {
  let h;
  h = harness({
    get: async () => {
      assert.equal(h.writes.length, 0);
      return { data: h.user };
    },
  });
  const signal = new AbortController().signal;
  assert.equal(await h.completeOAuth(input, signal), h.user);
  const [, path, config] = h.calls[0];
  assert.equal(path, "/users/me");
  assert.equal(config.headers.Authorization, "Bearer test-provider-token");
  assert.equal(config.signal, signal);
  assert.equal(config.timeout, 15000);
  assert.equal(h.calls.length, 1);
  assert.deepEqual(
    h.writes.map(([key]) => key),
    ["token", "user", "sd_just_logged_in"],
  );
});

test("only new accounts sync timezone, and optional timezone failure does not prevent login", async () => {
  const h = harness();
  const user = await h.completeOAuth(
    { ...input, newAccount: true },
    new AbortController().signal,
  );
  assert.equal(user.timezone, "Asia/Kolkata");
  assert.equal(h.calls[1][0], "patch");
  assert.equal(h.calls[1][2].timezone, "Asia/Kolkata");
  assert.equal(
    h.calls[1][3].headers.Authorization,
    "Bearer test-provider-token",
  );
  assert.equal(h.calls[1][3].timeout, 8000);
  const failed = harness({
    patch: async () => {
      throw new Error("offline");
    },
  });
  assert.equal(
    await failed.completeOAuth(
      { ...input, newAccount: true },
      new AbortController().signal,
    ),
    failed.user,
  );
  const unavailable = harness({ timezone: null });
  await unavailable.completeOAuth(
    { ...input, newAccount: true },
    new AbortController().signal,
  );
  assert.equal(unavailable.calls.length, 1);
});

test("failed verification and invalid profiles leave existing auth untouched", async () => {
  const failure = { response: { status: 401 } };
  const h = harness({
    get: async () => {
      throw failure;
    },
  });
  await assert.rejects(h.completeOAuth(input, new AbortController().signal));
  assert.equal(h.writes.length, 0);
  assert.match(h.callbackProblem(failure).title, /no longer valid/);
  for (const user of [null, {}, { id: "user", role: "unknown" }]) {
    const invalid = harness({ get: async () => ({ data: user }) });
    await assert.rejects(
      invalid.completeOAuth(input, new AbortController().signal),
    );
    assert.equal(invalid.writes.length, 0);
  }
});

test("abort before request, after verification or optional sync cannot save a session", async () => {
  const before = new AbortController();
  before.abort();
  const h = harness();
  await assert.rejects(h.completeOAuth(input, before.signal));
  assert.equal(h.calls.length, 0);
  for (const phase of ["get", "patch"]) {
    const controller = new AbortController();
    const canceled = harness({
      [phase]: async () => {
        controller.abort();
        return { data: { id: "user", role: "admin" } };
      },
    });
    await assert.rejects(
      canceled.completeOAuth({ ...input, newAccount: true }, controller.signal),
    );
    assert.equal(canceled.writes.length, 0);
  }
});

test("storage failure cleans up and connection failures never expose provider internals", async () => {
  const h = harness({ storageThrows: true });
  let failure;
  try {
    await h.completeOAuth(input, new AbortController().signal);
  } catch (error) {
    failure = error;
  }
  assert.match(h.callbackProblem(failure).title, /browser/);
  assert.deepEqual(
    h.writes.map(([key]) => key),
    ["token", "cleared"],
  );
  assert.doesNotMatch(
    JSON.stringify(h.callbackProblem(new Error("secret token"))),
    /secret token/,
  );
});
