import ts from "ts-morph";
import {
  SingletonPromise,
  PromiseAllParallel,
} from "../../_00_shared_utilities/source/PromiseTypes.mjs";

import path from "path";
import url from "url";
import fs from "fs/promises";

const parentDir = path.normalize(path.resolve(url.fileURLToPath(import.meta.url), "../.."));

type InterfaceOrTypeAlias = ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
export type FieldDeclaration = ts.MethodDeclaration | ts.PropertyDeclaration;

export default class Generator {
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

    const firstTypeNode = this.#extractFirstTypeNode(this.#sourceFile, this.#sourceTypeAlias);
    const type = firstTypeNode.getType();
    if (type.getUnionTypes().length)
      throw new Error("You cannot add a type which is a union of two or more types!  (How should I know which type to support?)");

    const properties = type.getProperties();
    if (properties.length === 0)
      throw new Error("No properties to add?");

    const propertyMap = new Map<string, string>;
    properties.forEach(field => {
      const name = field.getName();

      let text = field.getTypeAtLocation(firstTypeNode).getText(
        undefined, ts.TypeFormatFlags.NodeBuilderFlagsMask
      );

      if ((field.getFlags() & ts.SymbolFlags.Method)) {
        // ts-morph, or more likely TypeScript itself, writes arrow function types, but specifies methods:
        // " => returnType" versus " : returnType".
        const signatures = type.getCallSignatures();
        if (signatures.length > 1) {
          /* From the TypeScript Handbook
          https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads
          function len(s: string): number;
          function len(arr: any[]): number;
          function len(x: any) {
            return x.length;
          }

          I think that's what ts-morph is referring to...
          */

          throw new Error("TypeToClass in cross-stitch does not know how to fix method printouts with multiple call signatures.  Please file a bug.");
        }

        const returnType = signatures[0].getReturnType().getText();
        const beforeReturn = text.substring(0, text.length - returnType.length);
        text = `${name}${
          beforeReturn.replace(/ => $/, " : ")
         }${returnType}\n    {\n    }`;
      }
      else {
        text = name + ": " + text;
      }
      propertyMap.set(name, text);
    });
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

  /**
   * Extract the type alias or interface nodes for a given type.
   *
   * @param sourceFile - The source file.
   * @param typeName   - The type to extract.
   * @returns an interface or type alias node.
   */
  #extractFirstTypeNode(
    sourceFile: ts.SourceFile,
    typeName: string,
  ) : InterfaceOrTypeAlias
  {
    let firstBaseNode: InterfaceOrTypeAlias | undefined;
    firstBaseNode = sourceFile.getTypeAlias(typeName);
    if (!firstBaseNode)
      firstBaseNode = sourceFile.getInterface(typeName);

    if (!firstBaseNode)
      throw new Error(`No interface or type alias found for type name "${typeName}"!`);

    if (!firstBaseNode.isExported())
      throw new Error("Base node must be exported for the destination file to import it!");

    return firstBaseNode;
  }
}
