import ts from "ts-morph";
import {
  SingletonPromise,
  PromiseAllParallel,
} from "../../_00_shared_utilities/source/PromiseTypes.mjs";

import TypeToClass from "../../_01_ts-morph_utilities/source/TypeToClass.mjs";

import path from "path";
import url from "url";
import fs from "fs/promises";

const parentDir = path.normalize(path.resolve(url.fileURLToPath(import.meta.url), "../.."));

//type InterfaceOrTypeAlias = ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
export type FieldDeclaration = ts.MethodDeclaration | ts.PropertyDeclaration;

export default class Generator
{
  #sourceFile: ts.SourceFile;
  #sourceTypeAlias: string;

  #targetDir: ts.Directory;
  #baseClassName: string;

  constructor(
    sourceFile: ts.SourceFile,
    sourceTypeAlias: string,
    targetDir: ts.Directory,
    baseClassName: string,
  )
  {
    this.#sourceFile = sourceFile;
    this.#sourceTypeAlias = sourceTypeAlias;
    this.#baseClassName = baseClassName;
    this.#targetDir = targetDir;

    void(this.#baseClassName);
  }

  #runPromise = new SingletonPromise(() => this.#run());

  async run(): Promise<void>
  {
    await this.#runPromise.run();
  }

  async #run() : Promise<void>
  {
    await PromiseAllParallel([
      "Common.mts",
      "Entry_Base.mts",
      "KeyToComponentMap_Base.mts",
      "PassThroughSupport.mts",
    ], leafName => this.#copyExport(leafName));

    const baseClassFile = await this.#createBaseClass();

    await this.#createPassThroughType();

    const extendedNIClassFile = await this.#createExtendedNIClass(baseClassFile);

    await this.#createExtendedContinueClass(extendedNIClassFile);
  }

  async #copyExport(
    leafName: string
  ) : Promise<void>
  {
    await fs.copyFile(
      path.join(parentDir, "source/exports", leafName),
      path.join(this.#targetDir.getPath(), leafName)
    );

    this.#targetDir.addSourceFileAtPath(leafName);
  }

  async #createBaseClass() : Promise<ts.SourceFile>
  {
    const baseClassFile = this.#targetDir.createSourceFile("BaseClass.mts");
    const TTC = new TypeToClass(
      baseClassFile,
      this.#baseClassName,
      TypeToClass.notImplementedCallback
    );

    TTC.addTypeAliasOrInterface(
      this.#sourceFile,
      this.#sourceTypeAlias
    );

    await baseClassFile.save();
    return baseClassFile;
  }

  async #createPassThroughType() : Promise<void>
  {
    const passThroughTypeFile = this.#targetDir.createSourceFile("PassThroughClassType.mts");
    passThroughTypeFile.addStatements(`
export type PassThroughClassType = ComponentPassThroughClass<${this.#sourceTypeAlias}>;
    `.trim() + "\n");
    passThroughTypeFile.fixMissingImports();
    await passThroughTypeFile.save();
  }

  async #createExtendedNIClass(
    baseClassFile: ts.SourceFile
  ) : Promise<ts.SourceFile>
  {
    const extendedClassFile = baseClassFile.copy("PassThrough_NotImplemented.mts");

    const extendedClass = extendedClassFile.getClassOrThrow(this.#baseClassName);
    extendedClass.rename(this.#baseClassName + "_PassThroughNI");
    extendedClass.removeImplements(0);
    extendedClass.addImplements("PassThroughClassType");

    const methods = extendedClass.getMethods();
    methods.forEach(method => {
      const name = method.getName();
      const revisedType = `PassThroughType<${this.#sourceTypeAlias}["${name}"]>`;
      method.insertParameter(0, {
        name: "__previousResults__",
        type: revisedType
      });

      const returnType = method.getReturnType().getText();
      method.setReturnType(returnType + " | " + revisedType);
    });

    extendedClassFile.fixMissingImports();

    extendedClassFile.formatText({
      ensureNewLineAtEndOfFile: true,
      placeOpenBraceOnNewLineForFunctions: true,
      indentSize: 2,
    });

    await extendedClassFile.save();
    return extendedClassFile;
  }

  async #createExtendedContinueClass(
    niClassFile: ts.SourceFile
  ) : Promise<void>
  {
    const continueFile = niClassFile.copy("PassThrough_Continue.mts");
    const extendedClass = continueFile.getClassOrThrow(
      this.#baseClassName + "_PassThroughNI"
    );
    extendedClass.rename(this.#baseClassName + "_PassThroughContinue");

    const methods = extendedClass.getMethods();
    methods.forEach(method => {
      const name = method.getName();
      const revisedType = `PassThroughType<${this.#sourceTypeAlias}["${name}"]>`;
      method.setReturnType(revisedType);

      const throwLine = method.getStatementByKindOrThrow(ts.SyntaxKind.ThrowStatement);
      method.removeStatement(throwLine.getChildIndex());
      method.addStatements("return __previousResults__;");
    });

    continueFile.formatText({
      ensureNewLineAtEndOfFile: true,
      placeOpenBraceOnNewLineForFunctions: true,
      indentSize: 2,
    });

    await continueFile.save();
  }
}
