import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import vm from "node:vm";

const source = readFileSync(
  new URL("./homepage-data.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const exports = {};
vm.runInNewContext(outputText, { exports });
const { DEMO_QUIZ, checkDemoAnswer, LEARNING_RECIPE, PRODUCT_FEATURES } = exports;

test("the illustrative quiz accepts only the branch reference answer", () => {
  DEMO_QUIZ.options.forEach((_, index) => {
    assert.equal(checkDemoAnswer(index), index === DEMO_QUIZ.correctIndex);
  });
});

test("the product showcase describes generation, discussion and authoring", () => {
  assert.deepEqual(Array.from(PRODUCT_FEATURES, ({ id }) => id), [
    "generate", "discuss", "author",
  ]);
  for (const feature of PRODUCT_FEATURES) {
    for (const key of ["label", "title", "detail", "note"]) {
      assert.ok(feature[key].trim().length > 0, `${feature.id} is missing ${key}`);
    }
  }
});

const themeCss = readFileSync(
  new URL("../gui/gui-theme.module.css", import.meta.url), "utf8",
);
const pageCss = readFileSync(
  new URL("./homepage-experiment.module.css", import.meta.url), "utf8",
);

function colorsIn(block) {
  return Object.fromEntries(
    Array.from(block.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi), ([, key, value]) => [key, value]),
  );
}

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

test("orange theme text pairs remain readable in both light and dark mode", () => {
  const themeBlocks = themeCss.match(/\{[^}]+\}/g);
  const pageBlocks = pageCss.match(/\{[^}]+\}/g);
  for (const [index, mode] of ["light", "dark"].entries()) {
    const tokens = {
      ...colorsIn(themeBlocks[0]), ...colorsIn(pageBlocks[0]),
      ...(index ? { ...colorsIn(themeBlocks[1]), ...colorsIn(pageBlocks[1]) } : {}),
    };
    for (const [foreground, background] of [
      ["--gui-ink", "--gui-bg"],
      ["--gui-muted", "--gui-bg"],
      ["--gui-muted", "--gui-soft"],
      ["--gui-muted", "--gui-surface"],
      ["--gui-accent", "--gui-surface"],
      ["--gui-on-primary", "--gui-primary"],
      ["--lab-highlight-ink", "--lab-highlight"],
      ["--gui-terminal-accent", "--gui-terminal-bg"],
    ]) {
      const a = luminance(tokens[foreground]);
      const b = luminance(tokens[background]);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(ratio >= 4.5, `${mode} ${foreground} on ${background}: ${ratio.toFixed(2)}:1`);
    }
  }
});

test("invalid or missing answer indexes cannot produce a quiz result", () => {
  for (const index of [
    -1,
    DEMO_QUIZ.options.length,
    1.5,
    NaN,
    Infinity,
    null,
    undefined,
    "1",
  ]) {
    assert.equal(checkDemoAnswer(index), null);
  }
});

test("checking an example does not mutate its content", () => {
  const before = JSON.stringify(DEMO_QUIZ);
  checkDemoAnswer(0);
  checkDemoAnswer(1);
  assert.equal(JSON.stringify(DEMO_QUIZ), before);
});

test("the hero and recipe share three distinct, complete learning steps", () => {
  assert.equal(LEARNING_RECIPE.length, 3);
  assert.equal(new Set(LEARNING_RECIPE.map((step) => step.id)).size, 3);
  assert.equal(
    LEARNING_RECIPE.map((step) => step.verb).join(" → "),
    "Learn → Connect → Recall",
  );
  for (const step of LEARNING_RECIPE) {
    for (const key of [
      "number",
      "title",
      "node",
      "caption",
      "explanation",
      "detail",
    ]) {
      assert.ok(step[key].trim().length > 0, `${step.id} is missing ${key}`);
    }
  }
});
