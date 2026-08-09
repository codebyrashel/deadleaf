import { getRelevantSourceFiles, isTestFile } from "./shared.ts";
import { Project, SourceFile } from "ts-morph";

export interface DeadleafFileResult {
  filePath: string;
  confidence: number;
}

const DEFAULT_ENTRY_PATTERNS = ["index.ts", "cli.ts", "main.ts"];

export function findDeadleafFiles(project: Project): DeadleafFileResult[] {
  const sourceFiles = getRelevantSourceFiles(project);
  const results: DeadleafFileResult[] = [];

  for (const file of sourceFiles) {
    const fileName = file.getBaseName();

    if (DEFAULT_ENTRY_PATTERNS.includes(fileName)) {
      continue;
    }

    if (isTestFile(file.getFilePath())) {
      continue;
    }

    if (file.isDeclarationFile()) {
      continue;
    }

    const referencingFiles = getReferencingFiles(file);

    if (referencingFiles.length === 0) {
      results.push({
        filePath: file.getFilePath(),
        confidence: 90,
      });
    }
  }

  return results;
}

function getReferencingFiles(file: SourceFile): SourceFile[] {
  return file.getReferencingSourceFiles();
}
