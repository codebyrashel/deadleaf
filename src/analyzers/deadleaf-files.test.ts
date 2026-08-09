import { test } from "node:test";
import assert from "node:assert/strict";
import { Project } from "ts-morph";
import { findDeadleafFiles } from "./deadleaf-files.ts";

test("flags a file that nothing imports", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile("src/index.ts", `import "./used.js";`);
  project.createSourceFile("src/used.ts", `export const x = 1;`);
  project.createSourceFile("src/ghost.ts", `export const y = 2;`);

  const results = findDeadleafFiles(project);
  const flaggedPaths = results.map((r) => r.filePath);

  assert.equal(results.length, 1);
  assert.ok(flaggedPaths[0]?.endsWith("ghost.ts"));
});

test("does not flag entry point files", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile("src/index.ts", `export const x = 1;`);
  project.createSourceFile("src/cli.ts", `export const y = 2;`);

  const results = findDeadleafFiles(project);

  assert.equal(results.length, 0);
});


test("does not flag files inside ignored directories like .next", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile("src/index.ts", `export const x = 1;`);
  project.createSourceFile("src/.next/generated.ts", `export const y = 2;`);

  const results = findDeadleafFiles(project);

  assert.equal(results.length, 0);
});


test("does not flag test files as unused", () => {
  const project = new Project({ useInMemoryFileSystem: true });

  project.createSourceFile("src/index.ts", `export const x = 1;`);
  project.createSourceFile("src/thing.test.ts", `export const y = 2;`);

  const results = findDeadleafFiles(project);

  assert.equal(results.length, 0);
});