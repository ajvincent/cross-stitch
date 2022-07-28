import ts from "ts-morph";

import path from "path";
import url from "url";

const parentDir = path.resolve(url.fileURLToPath(import.meta.url), "../..");

import BaseClassGenerator from "../source/BaseClassGenerator.mjs";

export default async function() : Promise<void>
{
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

  const fixturesDir  = project.addDirectoryAtPath(path.join(parentDir, "fixtures"));
  const generatedDir = project.addDirectoryAtPath(path.join(parentDir, "spec-generated"));

  const generator = new BaseClassGenerator(
    fixturesDir.addSourceFileAtPath("NumberStringType.mts"),
    "NumberStringType",
    generatedDir,
    "NumberStringClass",
    "NumberStringType",
  );

  await generator.run();

  await createJasmineSpyClass(generatedDir);
}

async function createJasmineSpyClass(
  generatedDir: ts.Directory
) : Promise<void>
{
  const NI_File = generatedDir.getSourceFileOrThrow("PassThrough_NotImplemented.mts");
  const SpyClassFile = NI_File.copy("PassThrough_JasmineSpy.mts");

  const SpyClass = SpyClassFile.getClassOrThrow("NumberStringClass_PassThroughNI");
  SpyClass.rename("NumberStringClass_JasmineSpy");

  SpyClassFile.addTypeAlias({
    name: "PassThroughClassWithSpy",
    type: "PassThroughClassType & { spy: jasmine.Spy }",
    isExported: true
  });

  SpyClass.removeImplements(0);
  SpyClass.addImplements("PassThroughClassWithSpy");
  SpyClass.addProperty({
    name: "spy",
    isReadonly: true,
    initializer: "jasmine.createSpy()"
  });

  const methods = SpyClass.getMethods();
  methods.forEach(method => {
    const name = method.getName();

    const throwLine = method.getStatementByKindOrThrow(ts.SyntaxKind.ThrowStatement);
    method.removeStatement(throwLine.getChildIndex());
    method.addStatements(`__previousResults__.setReturnValue(
      this.spy("${name}", __previousResults__, s, n) as ReturnType<NumberStringType["${name}"]>
    );`);
  });

  SpyClassFile.formatText({
    ensureNewLineAtEndOfFile: true,
    placeOpenBraceOnNewLineForFunctions: true,
    indentSize: 2,
  });

  SpyClassFile.fixMissingImports();
  await SpyClassFile.save();
}
