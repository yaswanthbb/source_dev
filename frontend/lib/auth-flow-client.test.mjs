import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

test("recovery and OAuth use an isolated client with no cached-token or redirect interceptors", () => {
  let config;
  const fresh = {};
  const workspace = { defaults: { baseURL: "https://api.example.invalid" } };
  const exports = {};
  const { outputText } = ts.transpileModule(
    readFileSync(new URL("./auth-flow-client.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2017,
      },
    },
  );
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (name === "axios")
        return {
          default: {
            create: (options) => {
              config = options;
              return fresh;
            },
          },
        };
      if (name === "./api-client") return { default: workspace };
      assert.fail(`Unexpected dependency ${name}`);
    },
  });
  assert.equal(exports.default, fresh);
  assert.notEqual(exports.default, workspace);
  assert.equal(config.baseURL, workspace.defaults.baseURL);
  assert.equal(config.headers["Content-Type"], "application/json");
  assert.equal(config.headers.Authorization, undefined);
});

test("background expired-session requests cannot interrupt OAuth, but other routes keep the 401 guard", async () => {
  for (const pathname of ["/auth/callback", "/developer/dashboard", "/login"]) {
    let rejectResponse;
    let cleared = 0;
    const location = { pathname, href: pathname };
    const { outputText } = ts.transpileModule(
      readFileSync(new URL("./api-client.ts", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2017,
        },
      },
    );
    vm.runInNewContext(outputText, {
      exports: {},
      window: { location },
      process: { env: {} },
      require: (name) => {
        if (name === "axios")
          return {
            default: {
              create: () => ({
                interceptors: {
                  request: { use: () => {} },
                  response: {
                    use: (_, reject) => {
                      rejectResponse = reject;
                    },
                  },
                },
              }),
            },
          };
        if (name === "./auth")
          return {
            getToken: () => "old-test-token",
            clearAuth: () => {
              cleared++;
            },
          };
        assert.fail(`Unexpected dependency ${name}`);
      },
    });
    const failure = { response: { status: 401 } };
    await assert.rejects(rejectResponse(failure));
    assert.equal(cleared, pathname === "/auth/callback" ? 0 : 1);
    assert.equal(
      location.href,
      pathname === "/developer/dashboard" ? "/login" : pathname,
    );
  }
});
