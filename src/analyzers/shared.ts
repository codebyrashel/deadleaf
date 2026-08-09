import type { Project, SourceFile } from "ts-morph";

export const DEFAULT_IGNORE_DIRS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  "out",
  "generated",
  "coverage",
  ".turbo",
  ".cache",
  ".git",
];

export function isIgnoredPath(filePath: string): boolean {
  const segments = filePath.split("/");
  return segments.some((segment) => DEFAULT_IGNORE_DIRS.includes(segment));
}

export function getRelevantSourceFiles(project: Project): SourceFile[] {
  return project.getSourceFiles().filter((file) => !isIgnoredPath(file.getFilePath()));
}

export function isTestFile(filePath: string): boolean {
  return /\.(test|spec)\.[jt]sx?$/.test(filePath);
}