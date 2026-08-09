import { test } from "node:test";
import assert from "node:assert/strict";
import { Project } from "ts-morph";
import { findDeadleafExports } from "./deadleaf-exports.ts";

test("flags an export never used outside its own file", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile(
    "src/math.ts",
    `export function add(a: number, b: number) { return a + b; }
     export function unusedHelper() { return 42; }`
  );
  project.createSourceFile("src/main.ts", `import { add } from "./math.js"; add(1, 2);`);

  const results = findDeadleafExports(project);
  const flaggedNames = results.map((r) => r.exportName);

  assert.equal(results.length, 1);
  assert.equal(flaggedNames[0], "unusedHelper");
});

test("does not flag interfaces or type aliases", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile(
    "src/types.ts",
    `export interface Thing { id: number }
     export type Alias = string;`
  );
  project.createSourceFile("src/main.ts", `const x = 1; console.log(x);`);

  const results = findDeadleafExports(project);

  assert.equal(results.length, 0);
});

test("gives barrel file exports lower confidence", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile("src/index.ts", `export function publicApi() { return "hi"; }`);
  project.createSourceFile("src/main.ts", `const x = 1; console.log(x);`);

  const results = findDeadleafExports(project);

  assert.equal(results.length, 1);
  assert.equal(results[0]?.confidence, 60);
});