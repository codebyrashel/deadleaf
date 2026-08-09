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
  .description("Find unused files, exports, and dependencies in a TypeScript/JavaScript project — with confidence scores.")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan a project for unused code")
  .argument("[path]", "path to the project's tsconfig.json", "./tsconfig.json")
  .action((tsconfigPath: string) => {
    console.log(chalk.cyan(`Scanning using: ${tsconfigPath}`));

    const project = new Project({
      tsConfigFilePath: tsconfigPath,
    });

    const unusedFiles = findUnusedFiles(project);
    if (unusedFiles.length === 0) {
      console.log(chalk.green("No unused files found."));
    } else {
      console.log(chalk.yellow(`\nFound ${unusedFiles.length} possibly unused file(s):\n`));
      for (const result of unusedFiles) {
        console.log(`  ${chalk.red(result.confidence + "%")}  ${result.filePath}`);
      }
    }

    const unusedExports = findUnusedExports(project);
    if (unusedExports.length === 0) {
      console.log(chalk.green("No unused exports found."));
    } else {
      console.log(chalk.yellow(`\nFound ${unusedExports.length} possibly unused export(s):\n`));
      for (const result of unusedExports) {
        console.log(`  ${chalk.red(result.confidence + "%")}  ${result.exportName}  ${chalk.dim(result.filePath)}`);
      }
    }

    const packageJsonPath = join(dirname(tsconfigPath), "package.json");
        const unusedDeps = findUnusedDependencies(project, packageJsonPath);
        if (unusedDeps.length === 0) {
          console.log(chalk.green("No unused dependencies found."));
        } else {
          console.log(chalk.yellow(`\nFound ${unusedDeps.length} possibly unused dependency(s):\n`));
          for (const result of unusedDeps) {
            console.log(`  ${chalk.red(result.confidence + "%")}  ${result.packageName}  ${chalk.dim("(" + result.type + ")")}`);
            console.log(`       ${chalk.dim(result.reason)}`);
          }
        }
  });

program.parse();