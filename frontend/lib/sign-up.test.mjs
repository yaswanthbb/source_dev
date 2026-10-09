import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function harness({
  post,
  timezone = "Asia/Kolkata",
  storageThrows = false,
  markerThrows = false,
} = {}) {
  const calls = [],
    writes = [],
    cache = {};
  const user = { id: "unit-test-user", role: "developer" };
  const dependencies = {
    "./api-client": {
      default: {
        post: async (...args) => {
          calls.push(args);
          return post
            ? post(...args)
            : { data: { user, accessToken: "unit-test-token" } };
        },
      },
    },
    "./auth": {
      setToken: (value) => writes.push(["token", value]),
      setUser: (value) => {
        if (storageThrows) throw new Error("Storage blocked");
        writes.push(["user", value]);
      },
      clearAuth: () => writes.push(["cleared"]),
    },
    "./timezone": { detectTimezone: () => timezone ?? undefined },
  };
  function load(name) {
    if (dependencies[name]) return dependencies[name];
    if (cache[name]) return cache[name];
    if (name !== "./sign-in" && name !== "./sign-up")
      throw new Error(`Unexpected module: ${name}`);
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
      sessionStorage: {
        setItem: (key, value) => {
          if (markerThrows) throw new Error("Unavailable");
          writes.push([key, value]);
        },
      },
    });
    return exports;
  }
  return { ...load("./sign-up"), calls, writes, user };
}

const valid = {
  name: "Example Developer",
  email: "unit@example.invalid",
  password: "unit-test-password",
};

test("all registration fields are validated with the existing name and password rules", () => {
  const { validateRegistration } = harness();
  assert.deepEqual(
    Object.keys(
      validateRegistration({ name: "", email: "", password: "" }),
    ).sort(),
    ["email", "name", "password"],
  );
  for (const name of ["A", "1234", "Name123", "Example_Dev", " "])
    assert.ok(validateRegistration({ ...valid, name }).name);
  for (const name of [
    "李明",
    "Γιώργος",
    "O'Connor",
    "Anne-Marie",
    " Example Developer ",
  ])
    assert.equal(validateRegistration({ ...valid, name }).name, undefined);
  // Preserve the current CLI's restriction on combining marks rather than silently changing policy.
  assert.ok(validateRegistration({ ...valid, name: "नमस्ते" }).name);
  assert.ok(validateRegistration({ ...valid, email: "invalid" }).email);
  assert.ok(validateRegistration({ ...valid, password: "short" }).password);
  assert.equal(Object.keys(validateRegistration(valid)).length, 0);
});

test("registration reuses endpoint, timezone, session and preserves password bytes", async () => {
  const h = harness();
  const signal = new AbortController().signal;
  const input = {
    ...valid,
    name: " Example Developer ",
    email: " unit@example.invalid ",
    password: " untrimmed password ",
  };
  assert.equal(await h.signUp(input, signal), h.user);
  const [url, payload, config] = h.calls[0];
  assert.equal(url, "/auth/register");
  assert.equal(payload.name, valid.name);
  assert.equal(payload.email, valid.email);
  assert.equal(payload.password, input.password);
  assert.equal(payload.timezone, "Asia/Kolkata");
  assert.equal(config.signal, signal);
  assert.equal(config.timeout, 20000);
  assert.deepEqual(
    h.writes.map(([key]) => key),
    ["token", "user", "sd_just_logged_in"],
  );
  assert.equal(input.name, " Example Developer ");
});

test("missing timezone preserves the server default and optional marker failure is non-blocking", async () => {
  const h = harness({ timezone: null, markerThrows: true });
  assert.equal(await h.signUp(valid, new AbortController().signal), h.user);
  assert.equal(h.calls[0][1].timezone, undefined);
  assert.deepEqual(
    h.writes.map(([key]) => key),
    ["token", "user"],
  );
});

test("failed registration has no auth writes and conflict offers existing-account recovery", async () => {
  const failure = {
    response: { status: 409, data: { message: "Email already registered" } },
  };
  const h = harness({
    post: async () => {
      throw failure;
    },
  });
  await assert.rejects(
    h.signUp(valid, new AbortController().signal),
    (error) => error === failure,
  );
  assert.equal(h.writes.length, 0);
  assert.equal(h.registrationProblem(failure).signInInstead, true);
  assert.match(h.registrationProblem(failure).message, /Google or GitHub/);
});

test("an abandoned response does not persist auth or claim server-side cancellation", async () => {
  const controller = new AbortController();
  const h = harness({
    post: async () => {
      controller.abort();
      return {
        data: { user: { role: "developer" }, accessToken: "abandoned-token" },
      };
    },
  });
  await assert.rejects(h.signUp(valid, controller.signal));
  assert.equal(h.writes.length, 0);
  const message = h.registrationProblem(null);
  assert.equal(message.signInInstead, true);
  assert.match(message.message, /may have reached the server/);
});

test("a created account with blocked storage is directed to sign in, not registered again", async () => {
  const h = harness({ storageThrows: true });
  await assert.rejects(
    h.signUp(valid, new AbortController().signal),
    (error) => {
      const problem = h.registrationProblem(error);
      assert.match(problem.title, /account was created/);
      assert.equal(problem.signInInstead, true);
      assert.match(problem.message, /Allow site storage/);
      return true;
    },
  );
  assert.equal(h.writes.at(-1)[0], "cleared");
});

test("server and quota errors are readable, do not leak traces, retain actionable validation", () => {
  const { registrationProblem } = harness();
  assert.match(
    registrationProblem({ response: { status: 429 } }).message,
    /wait/,
  );
  const server = registrationProblem({
    response: { status: 500, data: { message: "SQL stack trace" } },
  });
  assert.doesNotMatch(server.message, /SQL/);
  assert.equal(server.signInInstead, true);
  assert.equal(
    registrationProblem({
      response: {
        status: 400,
        data: { message: ["Name required", null, "Email invalid"] },
      },
    }).message,
    "Name required Email invalid",
  );
});
