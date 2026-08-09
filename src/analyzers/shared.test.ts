import { test } from "node:test";
import assert from "node:assert/strict";
import { isIgnoredPath, isTestFile } from "./shared.ts";

test("ignores files inside default build/generated directories", () => {
  assert.equal(isIgnoredPath("/project/.next/dev/types/validator.ts"), true);
  assert.equal(isIgnoredPath("/project/node_modules/foo/index.ts"), true);
  assert.equal(isIgnoredPath("/project/packages/db/generated/client.ts"), true);
});

test("does not ignore normal source files", () => {
  assert.equal(isIgnoredPath("/project/src/analyzers/deadleaf-files.ts"), false);
});

test("recognizes .test. and .spec. files", () => {
  assert.equal(isTestFile("/project/src/foo.test.ts"), true);
  assert.equal(isTestFile("/project/src/foo.spec.tsx"), true);
  assert.equal(isTestFile("/project/src/foo.ts"), false);
});