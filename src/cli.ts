#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { Project } from "ts-morph";
import { dirname, join } from "node:path";
import { findDeadleafFiles } from "./analyzers/deadleaf-files.js";
import { findDeadleafExports } from "./analyzers/deadleaf-exports.js";
import { findDeadleafDependencies } from "./analyzers/deadleaf-dependencies.js";

const program = new Command();

program
  .name("deadleaf")
  .description("Find deadleaf files, exports, and dependencies in a TypeScript/JavaScript project with confidence scores.")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan a project for deadleaf code")
  .argument("[path]", "path to the project's tsconfig.json", "./tsconfig.json")
  .option("--json", "output results as JSON instead of formatted text")
  .action((tsconfigPath: string, options: { json?: boolean }) => {
    const project = new Project({
      tsConfigFilePath: tsconfigPath,
    });
    const deadleafFiles = findDeadleafFiles(project);
    const deadleafExports = findDeadleafExports(project);
    const packageJsonPath = join(dirname(tsconfigPath), "package.json");
    const deadleafDependencies = findDeadleafDependencies(project, packageJsonPath);
    if (options.json) {
      console.log(JSON.stringify({ deadleafFiles, deadleafExports, deadleafDependencies }, null, 2));
      return;
    }
    printTextReport(tsconfigPath, deadleafFiles, deadleafExports, deadleafDependencies);
  });

function confidenceLabel(confidence: number): string {
  const text = `${confidence}%`;
  if (confidence >= 80) return chalk.red(text);
  if (confidence >= 50) return chalk.yellow(text);
  return chalk.dim(text);
}

function printTextReport(
  tsconfigPath: string,
  deadleafFiles: ReturnType<typeof findDeadleafFiles>,
  deadleafExports: ReturnType<typeof findDeadleafExports>,
  deadleafDependencies: ReturnType<typeof findDeadleafDependencies>
): void {
  console.log(chalk.cyan(`Scanning using: ${tsconfigPath}`));
  const totalIssues = deadleafFiles.length + deadleafExports.length + deadleafDependencies.length;
  if (totalIssues === 0) {
    console.log(chalk.green("\n✓ Nothing found - project looks clean.\n"));
    return;
  }
  console.log(
    chalk.bold(
      `\nSummary: ${totalIssues} possible issue(s) - ` +
        `${deadleafFiles.length} file(s), ${deadleafExports.length} export(s), ${deadleafDependencies.length} dependency(s)\n`
    )
  );
  if (deadleafFiles.length > 0) {
    console.log(chalk.yellow(`Unused files (${deadleafFiles.length}):`));
    for (const result of deadleafFiles) {
      console.log(`  ${confidenceLabel(result.confidence)}  ${result.filePath}`);
    }
    console.log();
  }
  if (deadleafExports.length > 0) {
    console.log(chalk.yellow(`Unused exports (${deadleafExports.length}):`));
    for (const result of deadleafExports) {
      console.log(`  ${confidenceLabel(result.confidence)}  ${result.exportName}  ${chalk.dim(result.filePath)}`);
    }
    console.log();
  }
  if (deadleafDependencies.length > 0) {
    console.log(chalk.yellow(`Unused dependencies (${deadleafDependencies.length}):`));
    for (const result of deadleafDependencies) {
      console.log(`  ${confidenceLabel(result.confidence)}  ${result.packageName}  ${chalk.dim("(" + result.type + ")")}`);
      console.log(`       ${chalk.dim(result.reason)}`);
    }
    console.log();
  }
}

program.parse();