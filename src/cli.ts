#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { Project } from "ts-morph";
import { dirname, join } from "node:path";
import { findUnusedFiles } from "./analyzers/unused-files.js";
import { findUnusedExports } from "./analyzers/unused-exports.js";
import { findUnusedDependencies } from "./analyzers/unused-dependencies.js";

const program = new Command();

program
  .name("unused")
  .description("Find unused files, exports, and dependencies in a TypeScript/JavaScript project - with confidence scores.")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan a project for unused code")
  .argument("[path]", "path to the project's tsconfig.json", "./tsconfig.json")
  .option("--json", "output results as JSON instead of formatted text")
  .action((tsconfigPath: string, options: { json?: boolean }) => {
    const project = new Project({
      tsConfigFilePath: tsconfigPath,
    });

    const unusedFiles = findUnusedFiles(project);
    const unusedExports = findUnusedExports(project);
    const packageJsonPath = join(dirname(tsconfigPath), "package.json");
    const unusedDependencies = findUnusedDependencies(project, packageJsonPath);

    if (options.json) {
      console.log(JSON.stringify({ unusedFiles, unusedExports, unusedDependencies }, null, 2));
      return;
    }

    printTextReport(tsconfigPath, unusedFiles, unusedExports, unusedDependencies);
  });

function confidenceLabel(confidence: number): string {
  const text = `${confidence}%`;
  if (confidence >= 80) return chalk.red(text);
  if (confidence >= 50) return chalk.yellow(text);
  return chalk.dim(text);
}

function printTextReport(
  tsconfigPath: string,
  unusedFiles: ReturnType<typeof findUnusedFiles>,
  unusedExports: ReturnType<typeof findUnusedExports>,
  unusedDependencies: ReturnType<typeof findUnusedDependencies>
): void {
  console.log(chalk.cyan(`Scanning using: ${tsconfigPath}`));

  const totalIssues = unusedFiles.length + unusedExports.length + unusedDependencies.length;

  if (totalIssues === 0) {
    console.log(chalk.green("\n✓ Nothing found - project looks clean.\n"));
    return;
  }

  console.log(
    chalk.bold(
      `\nSummary: ${totalIssues} possible issue(s) - ` +
        `${unusedFiles.length} file(s), ${unusedExports.length} export(s), ${unusedDependencies.length} dependency(s)\n`
    )
  );

  if (unusedFiles.length > 0) {
    console.log(chalk.yellow(`Unused files (${unusedFiles.length}):`));
    for (const result of unusedFiles) {
      console.log(`  ${confidenceLabel(result.confidence)}  ${result.filePath}`);
    }
    console.log();
  }

  if (unusedExports.length > 0) {
    console.log(chalk.yellow(`Unused exports (${unusedExports.length}):`));
    for (const result of unusedExports) {
      console.log(`  ${confidenceLabel(result.confidence)}  ${result.exportName}  ${chalk.dim(result.filePath)}`);
    }
    console.log();
  }

  if (unusedDependencies.length > 0) {
    console.log(chalk.yellow(`Unused dependencies (${unusedDependencies.length}):`));
    for (const result of unusedDependencies) {
      console.log(`  ${confidenceLabel(result.confidence)}  ${result.packageName}  ${chalk.dim("(" + result.type + ")")}`);
      console.log(`       ${chalk.dim(result.reason)}`);
    }
    console.log();
  }
}

program.parse();