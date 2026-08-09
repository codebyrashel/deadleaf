import { Project, SourceFile } from "ts-morph";

export interface UnusedFileResult {
  filePath: string;
  confidence: number;
}

const DEFAULT_ENTRY_PATTERNS = ["index.ts", "cli.ts", "main.ts"];

export function findUnusedFiles(project: Project): UnusedFileResult[] {
  const sourceFiles = project.getSourceFiles();
  const results: UnusedFileResult[] = [];

  for (const file of sourceFiles) {
    const fileName = file.getBaseName();

    if (DEFAULT_ENTRY_PATTERNS.includes(fileName)) {
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
