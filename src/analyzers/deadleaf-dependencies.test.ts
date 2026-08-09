import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Project } from "ts-morph";
import { findDeadleafDependencies } from "./deadleaf-dependencies.ts";

function makeTempPackageJson(content: object): string {
  const dir = mkdtempSync(join(tmpdir(), "deadleaf-test-"));
  const filePath = join(dir, "package.json");
  writeFileSync(filePath, JSON.stringify(content));
  return filePath;
}

test("flags a dependency that is never imported", () => {
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile("src/main.ts", `export const x = 1;`);

  const packageJsonPath = makeTempPackageJson({
    dependencies: { leftpad: "^1.0.0" },
  });

  const results = findDeadleafDependencies(project, packageJsonPath);

  assert.equal(results.length, 1);
  assert.equal(results[0]?.packageName, "leftpad");
  assert.equal(results[0]?.confidence, 80);
});

test("does not flag a dependency that is imported", () => {
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile("src/main.ts", `import chalk from "chalk"; chalk.red("hi");`);

  const packageJsonPath = makeTempPackageJson({
    dependencies: { chalk: "^6.0.0" },
  });

  const results = findDeadleafDependencies(project, packageJsonPath);

  assert.equal(results.length, 0);
});

test("gives low confidence to a devDependency used in an npm script", () => {
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile("src/main.ts", `export const x = 1;`);

  const packageJsonPath = makeTempPackageJson({
    devDependencies: { tsdown: "^0.22.0" },
    scripts: { build: "tsdown src/cli.ts" },
  });

  const results = findDeadleafDependencies(project, packageJsonPath);

  assert.equal(results.length, 1);
  assert.equal(results[0]?.confidence, 15);
});