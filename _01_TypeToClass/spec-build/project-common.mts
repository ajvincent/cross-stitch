import ts from "ts-morph";

import path from "path";
import url from "url";

import TypeToClass, {
  TypeToClassCallbacks
} from "../source/TypeToClass.mjs";

import {
  PromiseAllSequence,
} from "../../_00_shared_utilities/source/PromiseTypes.mjs";

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

const NotImplementedCallbacks: TypeToClassCallbacks = {
  async maybeAddMethod(classDeclaration, structure)
  {
    void(classDeclaration);
    structure.statements = [];
    if (structure.parameters)
    {
      structure.statements.push(...structure.parameters.map(p => `void(${p.name});\n`));
    }
    structure.statements.push(`throw new Error("not yet implemented");`);
    return structure;
  },

  async maybeAddProperty(classDeclaration, structures)
  {
    void(classDeclaration);

    const { getter, setter } = structures;
    getter.statements = setter.statements = [`throw new Error("not yet implemented");`];
    return { getter, setter };
  },
};

type FileWithType = Readonly<{
  /** The type definitions file. */
  pathToTypeFile: string,

  /** The type name to extract. */
  typeName: string
}>;

/**
 * 
 * @param pathToClassFile - The class file to build.
 * @param className - The class name.
 * @param filesAndTypes - The type files and types to extract.
 * @param callbacks - The method and property structure callbacks.
 */
async function ManyTypesToClass(
  pathToClassFile: string,
  className: string,
  filesAndTypes: FileWithType[],
  callbacks: TypeToClassCallbacks
) : Promise<void>
{
  const destFile = generatedDir.createSourceFile(pathToClassFile);

  const TTC = new TypeToClass(
    destFile,
    className,
    callbacks
  );

  await PromiseAllSequence(filesAndTypes, async ({pathToTypeFile, typeName}) => {
    const srcFile = fixturesDir.addSourceFileAtPath(pathToTypeFile);
    await TTC.addTypeAliasOrInterface(
      srcFile,
      typeName,
    );
  });

  await saveGeneratedFile(destFile);
}

/**
 * 
 * @param pathToTypeFile - The type definitions file.
 * @param typeName - The type name to extract.
 * @param pathToClassFile - The class file to build.
 * @param className - The class name.
 * @param callbacks - The method and property structure callbacks.
 */
async function OneTypeToClass(
  pathToTypeFile: string,
  typeName: string,
  pathToClassFile: string,
  className: string,
  callbacks: TypeToClassCallbacks,
) : Promise<void>
{
  await ManyTypesToClass(
    pathToClassFile,
    className,
    [{
      pathToTypeFile,
      typeName
    }],
    callbacks
  );
}

async function buildSingleTypePattern(
  typeName: string,
  classFileLocation: string,
) : Promise<void>
{
  return await OneTypeToClass(
    "TypePatterns.mts",
    typeName,
    classFileLocation,
    "NumberStringClass",
    NotImplementedCallbacks
  );
}

export {
  fixturesDir,
  generatedDir,
  TypeToClass,
  TypeToClassCallbacks,
  saveGeneratedFile,
  OneTypeToClass,
  FileWithType,
  ManyTypesToClass,
  buildSingleTypePattern,
  NotImplementedCallbacks,
};
