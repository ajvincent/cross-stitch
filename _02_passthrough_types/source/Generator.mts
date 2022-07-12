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
      "AnyFunction.mts",
      "ForwardTo_Base.mts",
      "PassThroughSupport.mts",
    ], leafName => this.#copyBaseFile(leafName));

    const baseClassFile = await this.#createBaseClass();
    void(baseClassFile);

    await this.#createPassThroughType();
  }

  async #copyBaseFile(
    leafName: string
  ) : Promise<void>
  {
    await fs.copyFile(
      path.join(parentDir, "source", leafName),
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
}
