import { Project } from "ts-morph";
import { readFileSync } from "node:fs";

export interface DeadleafDependencyResult {
  packageName: string;
  type: "dependency" | "devDependency";
  confidence: number;
  reason: string;
}

export function findDeadleafDependencies(
  project: Project,
  packageJsonPath: string
): DeadleafDependencyResult[] {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  const dependencies: Record<string, string> = packageJson.dependencies ?? {};
  const devDependencies: Record<string, string> = packageJson.devDependencies ?? {};
  const scripts: Record<string, string> = packageJson.scripts ?? {};

  const usedPackages = collectImportedPackages(project);
  const results: DeadleafDependencyResult[] = [];

  for (const name of Object.keys(dependencies)) {
    if (name.startsWith("@types/")) continue;
    if (usedPackages.has(name)) continue;

    results.push(classify(name, "dependency", scripts));
  }

  for (const name of Object.keys(devDependencies)) {
    if (name.startsWith("@types/")) continue;
    if (usedPackages.has(name)) continue;

    results.push(classify(name, "devDependency", scripts));
  }

  return results;
}

function classify(
  packageName: string,
  type: "dependency" | "devDependency",
  scripts: Record<string, string>
): DeadleafDependencyResult {
  const scriptMatch = findScriptUsage(packageName, scripts);

  if (scriptMatch) {
    return {
      packageName,
      type,
      confidence: 15,
      reason: `Invoked in npm script "${scriptMatch}" — likely a build/CLI tool, not meant to be imported.`,
    };
  }

  if (type === "devDependency") {
    return {
      packageName,
      type,
      confidence: 50,
      reason: "Dev dependency with no import and no matching npm script. Could be a build tool used via config file.",
    };
  }

  return {
    packageName,
    type,
    confidence: 80,
    reason: "Not imported anywhere in source and not referenced in any npm script.",
  };
}

function findScriptUsage(
  packageName: string,
  scripts: Record<string, string>
): string | undefined {
  for (const [scriptName, command] of Object.entries(scripts)) {
    const words = command.split(/\s+/);
    if (words.includes(packageName)) {
      return scriptName;
    }
  }
  return undefined;
}

function collectImportedPackages(project: Project): Set<string> {
  const packages = new Set<string>();

  // Deliberately unfiltered: a package used only inside generated/build code
  // (e.g. a Prisma client) is still genuinely "used" - ignoring those files
  // here would cause false unused-dependency flags.
  for (const file of project.getSourceFiles()) {
    for (const importDecl of file.getImportDeclarations()) {
      addIfPackage(importDecl.getModuleSpecifierValue(), packages);
    }
    for (const exportDecl of file.getExportDeclarations()) {
      const specifier = exportDecl.getModuleSpecifierValue();
      if (specifier) addIfPackage(specifier, packages);
    }
  }

  return packages;
}

function addIfPackage(specifier: string, packages: Set<string>): void {
  if (specifier.startsWith(".") || specifier.startsWith("/")) return;

  const parts = specifier.split("/");
  const packageName = specifier.startsWith("@")
    ? `${parts[0]}/${parts[1]}`
    : parts[0];

  packages.add(packageName);
}
