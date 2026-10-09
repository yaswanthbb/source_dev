import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function harness(post) {
  const calls = [],
    cache = {};
  function load(name) {
    if (name === "./auth-flow-client")
      return {
        default: {
          post: async (...args) => {
            calls.push(args);
            return post ? post(...args) : { data: {} };
          },
        },
      };
    if (name === "./api-client") return {};
    if (name === "./auth")
      return {
        setToken: () => assert.fail("Recovery must not save auth"),
        setUser: () => assert.fail("Recovery must not log in"),
        clearAuth: () => assert.fail("Recovery must not clear another session"),
      };
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
    vm.runInNewContext(outputText, { exports, require: load });
    return exports;
  }
  return { ...load("./password-recovery"), calls };
}
const values = {
  email: "demo@example.invalid",
  code: "012345",
  newPassword: " untrimmed password ",
  confirmPassword: " untrimmed password ",
};

test("each recovery stage validates only its own fields and preserves password bytes", () => {
  const h = harness();
  for (const step of ["email", "code", "password", "success"])
    assert.equal(Object.keys(h.validateRecovery(step, values)).length, 0);
  assert.ok(h.validateRecovery("email", { ...values, email: "bad" }).email);
  for (const code of ["", "12345", "1234567", "123a56"])
    assert.ok(h.validateRecovery("code", { ...values, code }).code);
  assert.ok(
    h.validateRecovery("password", { ...values, newPassword: "short" })
      .newPassword,
  );
  assert.ok(
    h.validateRecovery("password", {
      ...values,
      confirmPassword: values.newPassword.trim(),
    }).confirmPassword,
  );
  assert.equal(h.normalizeRecoveryCode(" 012 345\n"), "012345");
  assert.equal(h.normalizeRecoveryCode("a1234567"), "123456");
});

test("resend countdown follows a deadline, including elapsed time in background tabs", () => {
  const h = harness();
  assert.equal(h.RESEND_WAIT_MS, 60000);
  assert.equal(h.resendSeconds(60000, 0), 60);
  assert.equal(h.resendSeconds(60000, 59999), 1);
  assert.equal(h.resendSeconds(60000, 70000), 0);
});

test("email requests always return generic confirmation without revealing existence", async () => {
  for (const response of [{ message: "No account" }, { message: "Sent" }]) {
    const h = harness(async () => ({ data: response }));
    const signal = new AbortController().signal;
    assert.equal(
      await h.requestRecoveryCode(" demo@example.invalid ", signal),
      h.RECOVERY_CONFIRMATION,
    );
    assert.equal(h.calls[0][0], "/auth/forgot-password");
    assert.equal(h.calls[0][1].email, values.email);
    assert.equal(h.calls[0][2].signal, signal);
    assert.equal(h.calls[0][2].timeout, 20000);
  }
});

test("verified code leads to reset-token payload, without automatic login", async () => {
  const h = harness(async (path) => ({
    data: path === "/auth/verify-otp" ? { resetToken: "test-reset-token" } : {},
  }));
  const signal = new AbortController().signal;
  const token = await h.verifyRecoveryCode(
    " demo@example.invalid ",
    values.code,
    signal,
  );
  assert.equal(token, "test-reset-token");
  assert.equal(h.calls[0][1].otp, "012345");
  assert.equal(h.calls[0][1].email, values.email);
  await h.updateRecoveredPassword(token, values.newPassword, signal);
  assert.equal(h.calls[1][0], "/auth/reset-password");
  assert.equal(h.calls[1][1].resetToken, token);
  assert.equal(h.calls[1][1].newPassword, values.newPassword);
  await assert.rejects(
    h.updateRecoveredPassword("", values.newPassword, signal),
  );
  assert.equal(h.calls.length, 2);
});

test("missing reset tokens and abandoned responses cannot advance recovery", async () => {
  for (const data of [{}, { resetToken: "" }, { resetToken: 12 }, null]) {
    const h = harness(async () => ({ data }));
    await assert.rejects(
      h.verifyRecoveryCode(
        values.email,
        values.code,
        new AbortController().signal,
      ),
    );
  }
  const before = new AbortController();
  before.abort();
  const h = harness();
  await assert.rejects(h.requestRecoveryCode(values.email, before.signal));
  assert.equal(h.calls.length, 0);
  const after = new AbortController();
  const abandoned = harness(async () => {
    after.abort();
    return { data: { resetToken: "abandoned" } };
  });
  await assert.rejects(
    abandoned.verifyRecoveryCode(values.email, values.code, after.signal),
  );
});

test("errors explain expired codes, restart, throttling and uncertain update outcomes without server internals", () => {
  const h = harness();
  assert.equal(
    h.recoveryProblem({ response: { status: 400 } }, "verify").requestCode,
    true,
  );
  assert.equal(
    h.recoveryProblem({ response: { status: 401 } }, "reset").startOver,
    true,
  );
  assert.match(
    h.recoveryProblem({ response: { status: 429 } }, "send").title,
    /wait/,
  );
  assert.match(
    h.recoveryProblem(new Error("network"), "reset").message,
    /may have completed/,
  );
  const result = h.recoveryProblem(
    { response: { status: 500, data: { message: "secret stack trace" } } },
    "reset",
  );
  assert.match(result.message, /signing in/);
  assert.doesNotMatch(JSON.stringify(result), /secret stack/);
});
