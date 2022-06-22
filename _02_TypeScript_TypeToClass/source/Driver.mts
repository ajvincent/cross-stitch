import path from "path";
import fs from "fs/promises";

import { ClassSources } from "./ClassSources.mjs";
import { TSFieldIterator, TSFieldIteratorDecider } from "./TSFieldIterator.mjs";
import type { TSTypeOrInterfaceDeclaration } from "./TSNode_types.mjs";

import {
  DefaultMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

import {
  PromiseAllSequence,
  SingletonPromise
} from "../../_00_shared_utilities/source/PromiseTypes.mjs";

import ESTreeParser from "../../_01_TypeScript_ESTree/source/ESTreeParser.mjs";
import ESTreeTraversal from "../../_01_TypeScript_ESTree/source/ESTreeTraversal.mjs";
import IsIdentifier from "../../_01_TypeScript_ESTree/source/IsIdentifier.mjs";
import { TSExportTypeExtractor, TSExportTypeFilterDecider } from "./TSExportTypeExtractor.mjs";

import { AST, TSESTreeOptions } from "@typescript-eslint/typescript-estree";

type TypeToImportAndSource = {
  typeToImplement: string,
  sourceLocation: string,
  targetImplements: boolean
};

type SourceCodeAndAST = {
  sourceCode: string,
  ast: AST<TSESTreeOptions>
};

export default class Driver {
  readonly #targetLocation: string;
  readonly #targetClassName: string;
  readonly #classSources: ClassSources;
  readonly #project: string;
  readonly #tsconfigRootDir: string;
  readonly #userConsole?: Console;

  /*
  readonly #astAccumulator: Accumulator<TSESTree.TSESTree.Program> = new Accumulator;
  */

  #runPromise: SingletonPromise<void> = new SingletonPromise(
    async () => await this.#run()
  );

  constructor(
    targetLocation: string,
    targetClassName: string,
    classSources: ClassSources,
    project: string,
    tsconfigRootDir: string,
    userConsole?: Console
  )
  {
    if (!IsIdentifier(targetClassName))
      throw new Error("Target class name is not an identifier!");

    this.#targetLocation = targetLocation;
    this.#targetClassName = targetClassName;
    this.#classSources = classSources;

    this.#project = project;
    this.#tsconfigRootDir = tsconfigRootDir;

    this.#userConsole = userConsole;
  }

  implements(
    typeToImplement: string,
    sourceLocation: string
  ) : void
  {
    if (!IsIdentifier(typeToImplement))
      throw new Error("Type is not an identifier!");

    sourceLocation = path.normalize(path.resolve(
      process.cwd(), sourceLocation
    ));

    this.#typesAndSources.getDefault(
      typeToImplement + ":" + sourceLocation,
      () => {
        return {
          typeToImplement,
          sourceLocation,
          targetImplements: true
        };
      }
    ).targetImplements = true;
  }

  #typesAndSources: DefaultMap<string, TypeToImportAndSource> = new DefaultMap;
  #sourceAndAST_Promises: DefaultMap<string, Promise<SourceCodeAndAST>> = new DefaultMap;

  async run() : Promise<void>
  {
    await this.#runPromise.run();
  }

  async #run() : Promise<void>
  {
    if (!this.#typesAndSources.size)
      throw new Error("There must be some types to implement!");

    const sourceLocations: Set<string> = new Set;
    this.#typesAndSources.forEach(({ sourceLocation }) => sourceLocations.add(sourceLocation));

    sourceLocations.forEach(location => this.#sourceAndAST_Promises.set(
      location, this.#parseFile(location)
    ));

    await PromiseAllSequence(
      Array.from(this.#typesAndSources.values()),
      async (typeAndSource) => {
        await this.#iterateOverType(typeAndSource);
      }
    );

    await this.#writeFinalModule();
  }

  async #iterateOverType(
    typeAndSource: TypeToImportAndSource
  ) : Promise<void>
  {
    const sourceAndAST = await this.#sourceAndAST_Promises.get(typeAndSource.sourceLocation);
    if (!sourceAndAST)
      throw new Error("assertion failure: we should have tried loading this file");

    const typeNodeSet: ReadonlySet<TSTypeOrInterfaceDeclaration> = this.#getExportedType(
      sourceAndAST.ast,
      typeAndSource.sourceLocation,
      typeAndSource.typeToImplement
    );

    this.#fillClassDefinition(
      sourceAndAST.sourceCode,
      typeAndSource.typeToImplement,
      sourceAndAST.ast,
      typeNodeSet
    );
  }

  async #parseFile(
    sourceLocation: string
  ) : Promise<SourceCodeAndAST>
  {
    sourceLocation = path.normalize(path.resolve(
      process.cwd(), sourceLocation
    ));
    const sourceCode = await fs.readFile(sourceLocation, { encoding: "utf-8" });

    return {
      sourceCode,
      ast: ESTreeParser(sourceCode, {
        filePath: sourceLocation,
        project: this.#project,
        tsconfigRootDir: this.#tsconfigRootDir
      })
    };
  }

  #getExportedType(
    ast: AST<TSESTreeOptions>,
    pathToFile: string,
    typeToExtract: string
  ) : ReadonlySet<TSTypeOrInterfaceDeclaration>
  {
    const traversal = new ESTreeTraversal(ast, TSExportTypeFilterDecider);

    const typeExtractor = new TSExportTypeExtractor(typeToExtract, this.#userConsole);

    traversal.traverseEnterAndLeave(ast, typeExtractor);

    if (!typeExtractor.exportTypeFound)
      throw new Error(`Export type not found for type "${typeExtractor}" in file "${pathToFile}"`);
    if (!typeExtractor.typeNodes.size)
      throw new Error(`No type or interface nodes found for type "${typeExtractor}" in file "${pathToFile}"`);
    return typeExtractor.typeNodes;
  }

  #fillClassDefinition(
    sourceCode: string,
    typeToImplement: string,
    ast: AST<TSESTreeOptions>,
    typeNodeSet: ReadonlySet<TSTypeOrInterfaceDeclaration>
  ) : void
  {
    const traversal = new ESTreeTraversal(ast, TSFieldIteratorDecider);
    const fieldIterator = new TSFieldIterator(sourceCode, this.#classSources, this.#userConsole);

    typeNodeSet.forEach(typeNode => {
      traversal.traverseEnterAndLeave(typeNode, fieldIterator)
    });

    if (fieldIterator.fieldsFound.size === fieldIterator.fieldsImplemented.size)
      this.#implementedTypes.set(typeToImplement, typeToImplement);
    else {
      const fieldsImplementedUnion = Array.from(
        fieldIterator.fieldsImplemented.values()
      );
      this.#implementedTypes.set(
        typeToImplement, `Pick<\n  ${typeToImplement},\n${
          fieldsImplementedUnion.map(f => `  "${f}"`).join(" |\n")
        }\n>`
      );
    }
  }

  readonly #implementedTypes = new Map<string, string>;

  async #writeFinalModule(): Promise<void>
  {
    let contents = `
/**
 * This code is generated.
 * @see {@link https://github.com/ajvincent/cross-stitch/tree/main/_02_TypeScript_TypeToClass}
 */
`.trim() + "\n\n";
    const sourcesToTypeImports = new DefaultMap<string, string[]>;
    const typesToImplement: string[] = [];
    this.#typesAndSources.forEach(typeAndSource => {
      const items = sourcesToTypeImports.getDefault(typeAndSource.sourceLocation, () => []);
      items.push(typeAndSource.typeToImplement);

      if (typeAndSource.targetImplements)
        typesToImplement.push(typeAndSource.typeToImplement);
    });

    sourcesToTypeImports.forEach((types, sourceLocation) => {
      contents += `import type {\n  ${ types.join("\n  , ") }\n} from "${
        path.relative(path.dirname(this.#targetLocation), sourceLocation).replace(/ts$/, "js")
      }";\n`
    });
    contents += `\n`

    function appendString(s: string) : void {
      contents += s + "\n\n";
    }

    this.#classSources.filePrologue.forEach(appendString);

    contents += `export default class ${this.#targetClassName}\nimplements ${
      Array.from(this.#implementedTypes.values()).join(", ")
    }\n`;
    contents += `{\n\n`;

    this.#classSources.classBodyFields.forEach(appendString);

    contents += "}\n";

    this.#classSources.fileEpilogue.forEach(appendString);

    await fs.writeFile(this.#targetLocation, contents, { encoding: "utf-8" });
  }
}
