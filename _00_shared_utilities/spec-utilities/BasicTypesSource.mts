import path from "path";
import url from "url";

import ts from "ts-morph";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

const project = new ts.Project({
  compilerOptions: {
    lib: ["es2022"],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    sourceMap: true,
    declaration: true,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  }
});

const BasicTypes = project.addSourceFileAtPath(
  path.join(parentDir, "fixtures/BasicTypes.mts")
);
export default BasicTypes;

export function getAliasTypeNodeByName<
  TKind extends ts.SyntaxKind
  >(
  name: string,
  kind: TKind
) : ts.KindToNodeMappings[TKind]
{
  return BasicTypes.getTypeAliasOrThrow(name)
    .getTypeNodeOrThrow()
    .asKindOrThrow(kind);
}


