import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import vm from "node:vm";

const source = readFileSync(new URL("./sign-in.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2017,
  },
});

function harness({
  post,
  storageThrows = false,
  authStorageThrows = false,
  apiUrl,
} = {}) {
  const writes = [];
  const calls = [];
  const user = { id: "example", role: "developer" };
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (name === "./api-client")
        return {
          default: {
            post: async (...args) => {
              calls.push(args);
              return post
                ? post(...args)
                : { data: { user, accessToken: "unit-test-token" } };
            },
          },
        };
      if (name === "./auth")
        return {
          setToken: (value) => writes.push(["token", value]),
          setUser: (value) => {
            if (authStorageThrows) throw new Error("Site storage blocked");
            writes.push(["user", value]);
          },
          clearAuth: () => writes.push(["cleared"]),
        };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    process: { env: { NEXT_PUBLIC_API_URL: apiUrl } },
    sessionStorage: {
      setItem: (key, value) => {
        if (storageThrows) throw new Error("Storage unavailable");
        writes.push([key, value]);
      },
    },
  });
  return { ...exports, writes, calls, user };
}

test("login validates both fields without modifying credentials", () => {
  const { validateLogin } = harness();
  assert.equal(
    Object.keys(validateLogin({ email: "", password: "" })).length,
    2,
  );
  assert.equal(
    Object.keys(validateLogin({ email: "invalid", password: "short" })).length,
    2,
  );
  assert.equal(
    Object.keys(
      validateLogin({
        email: " person@example.invalid ",
        password: "12345678",
      }),
    ).length,
    0,
  );
});

test("successful login uses the existing endpoint, trims only email and persists session", async () => {
  const h = harness();
  const signal = new AbortController().signal;
  const credentials = {
    email: " person@example.invalid ",
    password: " secret example ",
  };
  assert.equal(await h.signIn(credentials, signal), h.user);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0][0], "/auth/login");
  assert.equal(h.calls[0][1].email, "person@example.invalid");
  assert.equal(h.calls[0][1].password, credentials.password);
  assert.equal(h.calls[0][2].signal, signal);
  assert.equal(h.calls[0][2].timeout, 20000);
  assert.equal(h.writes[0][0], "token");
  assert.equal(h.writes[1][0], "user");
  assert.equal(h.writes[2][0], "sd_just_logged_in");
  assert.equal(credentials.email, " person@example.invalid ");
});

test("failed login never writes a session", async () => {
  const failure = {
    response: { status: 401, data: { message: "Invalid credentials" } },
  };
  const h = harness({
    post: async () => {
      throw failure;
    },
  });
  await assert.rejects(
    h.signIn(
      { email: "person@example.invalid", password: "12345678" },
      new AbortController().signal,
    ),
    (error) => error === failure,
  );
  assert.equal(h.writes.length, 0);
});

test("a late response after unmount/cancellation cannot authenticate", async () => {
  const controller = new AbortController();
  const h = harness({
    post: async () => {
      controller.abort();
      return {
        data: {
          user: { role: "developer" },
          accessToken: "cancelled-test-token",
        },
      };
    },
  });
  await assert.rejects(
    h.signIn(
      { email: "person@example.invalid", password: "12345678" },
      controller.signal,
    ),
  );
  assert.equal(h.writes.length, 0);
});

test("optional session storage does not turn successful sign-in into failure", async () => {
  const h = harness({ storageThrows: true });
  assert.equal(
    await h.signIn(
      { email: "person@example.invalid", password: "12345678" },
      new AbortController().signal,
    ),
    h.user,
  );
  assert.equal(h.writes.length, 2);
});

test("role redirects preserve developer and admin destinations", () => {
  const { dashboardFor } = harness();
  assert.equal(dashboardFor("developer"), "/developer/dashboard");
  assert.equal(dashboardFor("admin"), "/admin/dashboard");
});

test("blocked browser storage is explained distinctly and partial auth is cleared", async () => {
  const h = harness({ authStorageThrows: true });
  try {
    await h.signIn(
      { email: "person@example.invalid", password: "12345678" },
      new AbortController().signal,
    );
    assert.fail("Blocked storage must not report success");
  } catch (error) {
    assert.match(h.signInProblem(error).message, /Allow site storage/);
    assert.equal(h.writes.at(-1)[0], "cleared");
  }
});

test("failure messages distinguish network, credentials, quota and server availability", () => {
  const { signInProblem } = harness();
  assert.match(signInProblem(null).message, /connection/);
  assert.match(
    signInProblem({
      response: { status: 401, data: { message: "Invalid credentials" } },
    }).message,
    /doesn’t match/,
  );
  assert.match(signInProblem({ response: { status: 429 } }).message, /wait/);
  assert.match(
    signInProblem({
      response: { status: 500, data: { message: "SQL internal trace" } },
    }).message,
    /try again/,
  );
  assert.doesNotMatch(
    signInProblem({
      response: { status: 500, data: { message: "SQL internal trace" } },
    }).message,
    /SQL/,
  );
});

test("actionable backend social-login guidance and validation messages are retained", () => {
  const { signInProblem } = harness();
  const guidance =
    "This account uses social sign-in. Please log in with Google or GitHub.";
  assert.equal(
    signInProblem({ response: { status: 401, data: { message: guidance } } })
      .message,
    guidance,
  );
  assert.equal(
    signInProblem({
      response: {
        status: 400,
        data: { message: ["Email required", null, "Password required"] },
      },
    }).message,
    "Email required Password required",
  );
});

test("OAuth URLs use the configured API origin, not the frontend login route", () => {
  const configured = harness({ apiUrl: "https://api.example.invalid/" });
  assert.equal(
    configured.oauthUrl("google"),
    "https://api.example.invalid/auth/google",
  );
  assert.equal(
    configured.oauthUrl("github"),
    "https://api.example.invalid/auth/github",
  );
  assert.equal(
    harness().oauthUrl("google"),
    "http://localhost:3000/auth/google",
  );
});
