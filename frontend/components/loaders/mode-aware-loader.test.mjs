import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const requirePackage = createRequire(import.meta.url);
function transpile(file) {
  return ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2017,
      },
    },
  ).outputText;
}
function harness({ mode = "gui", ready = true, recent = false } = {}) {
  const effects = [],
    cache = {};
  let terminalRenders = 0;
  function load(file) {
    if (cache[file]) return cache[file];
    const exports = (cache[file] = {});
    vm.runInNewContext(transpile(file), {
      exports,
      window: {},
      sessionStorage: { getItem: () => (recent ? String(Date.now()) : null) },
      require: (name) => {
        if (name.endsWith(".css"))
          return { default: new Proxy({}, { get: (_, key) => key }) };
        if (name === "react")
          return { ...React, useEffect: (callback) => effects.push(callback) };
        if (name === "@/providers/ui-mode-provider")
          return { useUiMode: () => ({ mode, ready }) };
        if (name === "./minimal-terminal-loader")
          return {
            MinimalTerminalLoader: (props) => {
              terminalRenders++;
              return createElement(
                "div",
                {
                  "data-terminal": true,
                  "data-duration": props.minDuration,
                  "data-ready": props.isAsyncComplete,
                },
                props.title,
              );
            },
          };
        if (name === "@/components/gui/gui-page-loader")
          return load("../gui/gui-page-loader.tsx");
        if (name === "@/components/brand/source-mark")
          return {
            SourceMark: () => createElement("svg", { "aria-hidden": true }),
          };
        if (name === "@/components/loaders/mode-aware-loader")
          return load("./mode-aware-loader.tsx");
        return requirePackage(name);
      },
    });
    return exports;
  }
  const { ModeAwareLoader } = load("./mode-aware-loader.tsx");
  return {
    effects,
    render: (props) =>
      renderToStaticMarkup(createElement(ModeAwareLoader, props)),
    renderRoute: (file) =>
      renderToStaticMarkup(createElement(load(file).default)),
    terminalRenders: () => terminalRenders,
  };
}

test("GUI shows branded accessible feedback, never terminal logs or synthetic progress", () => {
  const h = harness();
  const html = h.render({
    title: "developer // auth_guard",
    stage: "STAGE_01",
    minDuration: 2000,
  });
  assert.match(html, /source:dev/);
  assert.match(html, /Opening your page/);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-atomic="true"/);
  assert.doesNotMatch(html, /auth_guard|STAGE_01|data-terminal|progressbar|%/);
  assert.equal(h.terminalRenders(), 0);
});
test("unknown preference shows neither interface; CLI keeps original loader options", () => {
  for (const mode of ["gui", "cli"]) {
    const h = harness({ mode, ready: false });
    assert.equal(h.render({}), "");
    assert.equal(h.terminalRenders(), 0);
  }
  const cli = harness({ mode: "cli" });
  const html = cli.render({
    title: "source-dev // sys_sync",
    minDuration: 2000,
    isAsyncComplete: false,
  });
  assert.match(html, /data-terminal="true"/);
  assert.match(html, /data-duration="2000"/);
  assert.match(html, /data-ready="false"/);
  assert.doesNotMatch(html, /Opening your page/);
});
test("GUI auth gates complete once when actually ready, with no artificial timer", () => {
  for (const isAsyncComplete of [false, true]) {
    const h = harness();
    let completed = 0;
    h.render({ isAsyncComplete, onComplete: () => completed++ });
    h.effects.forEach((effect) => {
      effect();
      effect();
    });
    assert.equal(completed, isAsyncComplete ? 1 : 0);
  }
  for (const options of [{ mode: "cli" }, { ready: false }]) {
    const h = harness(options);
    h.render({
      onComplete: () => assert.fail("Unknown/CLI must not use GUI completion"),
    });
    h.effects.forEach((effect) => effect());
  }
});
test("all shared route fallbacks select GUI/CLI and retain recent-sign-in bypass", () => {
  for (const file of [
    "../../app/loading.tsx",
    "../../app/developer/loading.tsx",
    "../../app/admin/loading.tsx",
  ]) {
    const gui = harness();
    assert.match(gui.renderRoute(file), /Opening your page/);
    assert.equal(gui.terminalRenders(), 0);
    assert.match(
      harness({ mode: "cli" }).renderRoute(file),
      /data-terminal="true"/,
    );
    assert.equal(harness({ recent: true }).renderRoute(file), "");
  }
  for (const file of [
    "../../app/developer/layout.tsx",
    "../../app/admin/layout.tsx",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(source, /<ModeAwareLoader/);
    assert.doesNotMatch(source, /<MinimalTerminalLoader/);
    assert.match(source, /isAsyncComplete=/);
  }
});
test("GUI loading animation respects reduced motion and does not impose a JS wait", () => {
  const css = readFileSync(
    new URL("../gui/gui-page-loader.module.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation:\s*none/);
  const source = readFileSync(
    new URL("./mode-aware-loader.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /setTimeout|setInterval|requestAnimationFrame/);
});

test("both terminal bridges stay in CLI and stop immediately when appearance becomes GUI", () => {
  for (const [file, symbol] of [
    ["./minimal-terminal-loader.tsx", "preserveMinimalLoader"],
    ["./centered-terminal-loader.tsx", "preserveCenteredLoader"],
  ]) {
    for (const initialMode of ["gui", "cli"]) {
      const frames = [],
        appended = [];
      const overlay = {
        style: {},
        isConnected: false,
        querySelector: () => null,
        remove: () => {
          overlay.isConnected = false;
        },
      };
      const document = {
        documentElement: { dataset: { uiMode: initialMode } },
        getElementById: () => null,
        body: {
          appendChild: (node) => {
            node.isConnected = true;
            appended.push(node);
          },
        },
      };
      const exports = {};
      vm.runInNewContext(`${transpile(file)}\nexports.bridge = ${symbol};`, {
        exports,
        document,
        window: {},
        sessionStorage: { getItem: () => null },
        requestAnimationFrame: (callback) => {
          frames.push(callback);
          return frames.length;
        },
        require: (name) =>
          name.endsWith(".css") || name === "@/providers/theme-provider"
            ? {}
            : requirePackage(name),
      });
      exports.bridge({ cloneNode: () => overlay }, Date.now(), 5000, false);
      if (initialMode === "gui") {
        assert.equal(appended.length, 0);
        assert.equal(frames.length, 0);
      } else {
        assert.equal(appended.length, 1);
        frames.shift()();
        assert.equal(overlay.isConnected, true);
        assert.equal(frames.length, 1);
        document.documentElement.dataset.uiMode = "gui";
        frames.shift()();
        assert.equal(overlay.isConnected, false);
        assert.equal(frames.length, 0);
      }
    }
  }
  const css = readFileSync(
    new URL("./terminal-loaders.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /html\[data-ui-mode="gui"\] #sd-minimal-terminal-overlay/);
  assert.match(css, /html\[data-ui-mode="gui"\] #sd-centered-terminal-overlay/);
});
