import ts from "ts-morph";

import path from "path";
import url from "url";

import TypeToClass, {
  TypeToClassCallbacks
} from "../source/TypeToClass.mjs";

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

const fixturesDir = project.addDirectoryAtPath(path.join(parentDir, "fixtures"));
const generatedDir = project.addDirectoryAtPath(path.join(parentDir, "spec-generated"));

async function saveGeneratedFile(generated: ts.SourceFile) : Promise<void>
{
  generated.formatText({
    ensureNewLineAtEndOfFile: true,
    placeOpenBraceOnNewLineForFunctions: true,
    indentSize: 2,
  });

  await generated.save();
}

async function OneTypeToClass(
  pathToTypeFile: string,
  typeName: string,
  pathToClassFile: string,
  className: string,
  callbacks: TypeToClassCallbacks,
) : Promise<void>
{
  const srcFile = fixturesDir.addSourceFileAtPath(pathToTypeFile);
  const destFile = generatedDir.createSourceFile(pathToClassFile);

  const TTC = new TypeToClass(
    destFile,
    className,
    callbacks
  );

  await TTC.addTypeAliasOrInterface(
    srcFile,
    typeName,
  );

  await saveGeneratedFile(destFile);
}

export {
  fixturesDir,
  generatedDir,
  TypeToClass,
  TypeToClassCallbacks,
  saveGeneratedFile,
  OneTypeToClass
};
