#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

program
  .name("unused")
  .description("Find unused files, exports, and dependencies in a TypeScript/JavaScript project — with confidence scores.")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan a project for unused code")
  .argument("[path]", "path to the project to scan", ".")
  .action((path: string) => {
    console.log(chalk.cyan(`Scanning: ${path}`));
    console.log(chalk.yellow("Analyzer not wired up yet — coming next."));
  });

program.parse();