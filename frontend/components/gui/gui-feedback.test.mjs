import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const requirePackage = createRequire(import.meta.url);
const source = readFileSync(
  new URL("./gui-feedback.tsx", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
});
const exports = {};
vm.runInNewContext(outputText, {
  exports,
  require: (name) =>
    name.endsWith(".module.css")
      ? { default: new Proxy({}, { get: (_, key) => key }) }
      : requirePackage(name),
});

test("failure feedback has an alert, readable explanation and named dismiss control", () => {
  const html = renderToStaticMarkup(
    createElement(
      exports.GuiFeedback,
      {
        kind: "error",
        title: "We couldn’t sign you in",
        onDismiss: () => {},
      },
      "Try again or reset your password.",
    ),
  );
  assert.match(html, /role="alert"/);
  assert.match(html, /tabindex="-1"/);
  assert.match(html, /Try again or reset your password/);
  assert.match(html, /aria-label="Dismiss message"/);
});

test("success, information and loading states announce status, not errors", () => {
  for (const kind of ["success", "info", "loading"]) {
    const html = renderToStaticMarkup(
      createElement(
        exports.GuiFeedback,
        {
          kind,
          title: "A clear status",
        },
        "Next step explained.",
      ),
    );
    assert.match(html, /role="status"/);
    assert.match(html, /aria-atomic="true"/);
    assert.doesNotMatch(html, /role="alert"|aria-label="Dismiss message"/);
    assert.match(html, /aria-hidden="true"/);
  }
});
