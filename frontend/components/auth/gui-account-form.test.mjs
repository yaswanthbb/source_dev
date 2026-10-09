import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const requirePackage = createRequire(import.meta.url);
const modules = {};
function load(file) {
  if (modules[file]) return modules[file];
  const exports = (modules[file] = {});
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2017,
      },
    },
  );
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (name.endsWith(".module.css"))
        return { default: new Proxy({}, { get: (_, key) => key }) };
      if (name === "next/navigation")
        return { useRouter: () => ({ replace: () => {} }) };
      if (name === "next/link")
        return {
          default: ({ children, ...props }) =>
            createElement("a", props, children),
        };
      if (name === "@/providers/theme-provider")
        return { useTheme: () => ({ theme: "light", toggleTheme: () => {} }) };
      if (name === "@/components/brand/source-mark")
        return { SourceMark: () => null };
      if (name === "@/lib/sign-in")
        return {
          dashboardFor: (role) =>
            role === "admin" ? "/admin/dashboard" : "/developer/dashboard",
        };
      if (name === "@/lib/sign-up") return {};
      if (name === "@/lib/password-recovery") return { resendSeconds: () => 0 };
      if (name === "./gui-auth-shell") return load("./gui-auth-shell.tsx");
      if (name === "@/components/gui/gui-feedback")
        return load("../gui/gui-feedback.tsx");
      return requirePackage(name);
    },
  });
  return exports;
}
const { GuiAccountForm } = load("./gui-account-form.tsx");
const render = (kind) =>
  renderToStaticMarkup(
    createElement(GuiAccountForm, { kind, onSwitchToCli: () => {} }),
  );

test("registration renders three required labelled fields, password help and real auth destinations", () => {
  const html = render("register");
  assert.equal((html.match(/<input/g) || []).length, 3);
  for (const key of ["name", "email", "password"]) {
    assert.match(html, new RegExp(`for="register-${key}"`));
    assert.match(html, new RegExp(`id="register-${key}"`));
  }
  assert.equal((html.match(/required=""/g) || []).length, 3);
  assert.match(html, /autoComplete="name"/);
  assert.match(html, /autoComplete="email"/);
  assert.match(html, /autoComplete="new-password"/);
  assert.match(html, /aria-describedby="register-password-hint"/);
  assert.match(html, /At least 8 characters/);
  assert.match(html, /href="#sign-up"/);
  assert.match(html, /aria-labelledby="register-title"/);
  assert.match(html, /Create account/);
  assert.match(html, /class="authorCanvas"/);
  assert.match(html, /class="canvasModule"/);
  assert.doesNotMatch(html, /class="learningPath"/);
  assert.match(html, /href="\/login"/);
  assert.match(html, />Google<|Google<\/button>/);
  assert.match(html, />GitHub<|GitHub<\/button>/);
  assert.doesNotMatch(html, /role="alert"|Cancel sign-in|Forgot password/);
});

test("recovery starts with a labelled email field and honest three-step progress", () => {
  const { GuiPasswordRecovery } = load("./gui-password-recovery.tsx");
  const html = renderToStaticMarkup(
    createElement(GuiPasswordRecovery, { onSwitchToCli: () => {} }),
  );
  assert.equal((html.match(/<input/g) || []).length, 1);
  assert.match(html, /for="recovery-email"/);
  assert.match(html, /id="recovery-email"/);
  assert.match(html, /type="email"/);
  assert.match(html, /autoComplete="email"/);
  assert.match(html, /required=""/);
  assert.match(html, /aria-label="Recovery progress"/);
  assert.match(html, /aria-current="step"/);
  assert.match(html, /Send reset code/);
  assert.match(html, /href="\/login"/);
  assert.doesNotMatch(html, /resetToken|role="alert"/);
});

test("OAuth pending, failure and verified success have separate accessible presentations", () => {
  const { GuiOAuthCallback } = load("./gui-oauth-callback.tsx");
  const view = (props) =>
    renderToStaticMarkup(
      createElement(GuiOAuthCallback, { user: null, ...props }),
    );
  const pending = view({});
  assert.match(pending, /role="status"/);
  assert.match(pending, /Verifying your sign-in/);
  assert.doesNotMatch(pending, /Open workspace|role="alert"/);
  const failure = view({
    problem: { title: "Please try again", message: "Return to login" },
  });
  assert.match(failure, /role="alert"/);
  assert.match(failure, /tabindex="-1"/);
  assert.match(failure, /Back to sign in/);
  assert.doesNotMatch(failure, /Open workspace|Verifying your sign-in/);
  for (const role of ["developer", "admin"]) {
    const success = view({ user: { id: "test", role } });
    assert.match(success, new RegExp(`href="/${role}/dashboard"`));
    assert.match(success, /Sign-in complete/);
    assert.doesNotMatch(success, /role="alert"/);
  }
});

test("shared form preserves login field count, IDs, autocomplete, recovery and register links", () => {
  const html = render("login");
  assert.equal((html.match(/<input/g) || []).length, 2);
  assert.match(html, /id="login-email"/);
  assert.match(html, /class="learningPath"/);
  assert.doesNotMatch(html, /class="authorCanvas"/);
  assert.match(html, /autoComplete="username"/);
  assert.match(html, /id="login-password"/);
  assert.match(html, /autoComplete="current-password"/);
  assert.match(html, /href="#sign-in"/);
  assert.match(html, /aria-labelledby="login-title"/);
  assert.match(html, /href="\/forgot-password"/);
  assert.match(html, /href="\/register"/);
  assert.doesNotMatch(
    html,
    /register-password-hint|Create account with name|role="alert"/,
  );
});
