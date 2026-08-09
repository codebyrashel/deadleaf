import { getRelevantSourceFiles, isTestFile } from "./shared.ts";
import { Project, Node } from "ts-morph";

export interface DeadleafExportResult {
  filePath: string;
  exportName: string;
  confidence: number;
}

const BARREL_FILES = ["index.ts"];

export function findDeadleafExports(project: Project): DeadleafExportResult[] {
  const results: DeadleafExportResult[] = [];

  for (const file of getRelevantSourceFiles(project)) {
    if (file.isDeclarationFile()) continue;

    if (isTestFile(file.getFilePath())) continue;

    const isBarrel = BARREL_FILES.includes(file.getBaseName());
    const exportedDeclarations = file.getExportedDeclarations();

    for (const [exportName, declarations] of exportedDeclarations) {
      for (const declaration of declarations) {
        if (Node.isInterfaceDeclaration(declaration)) continue;
        if (Node.isTypeAliasDeclaration(declaration)) continue;
        if (!Node.isReferenceFindable(declaration)) continue;

        const references = declaration.findReferencesAsNodes();
        const usedInAnotherFile = references.some(
          (ref) => ref.getSourceFile() !== file
        );

        if (!usedInAnotherFile) {
          results.push({
            filePath: file.getFilePath(),
            exportName,
            confidence: isBarrel ? 60 : 85,
          });
        }
      }
    }
  }

  return results;
}
