import path from "path";
import fs from "fs/promises";

import { ClassSources } from "./ClassSources.mjs";
import { TSFieldIterator, TSFieldIteratorDecider } from "./TSFieldIterator.mjs";
import type { TSTypeOrInterfaceDeclaration } from "./TSNode_types.mjs";

import {
  SingletonPromise
} from "../../_00_shared_utilities/source/PromiseTypes.mjs";

import ESTreeParser from "../../_01_TypeScript_ESTree/source/ESTreeParser.mjs";
import ESTreeTraversal from "../../_01_TypeScript_ESTree/source/ESTreeTraversal.mjs";
import { TSExportTypeExtractor, TSExportTypeFilterDecider } from "./TSExportTypeExtractor.mjs";

import { AST, TSESTreeOptions } from "@typescript-eslint/typescript-estree";

export default class Driver {
  #sourceLocation: string;
  #targetLocation: string;
  #typesToImplement: string[];
  #classSources: ClassSources;
  #userConsole?: Console;

  /*
  readonly #astAccumulator: Accumulator<TSESTree.TSESTree.Program> = new Accumulator;
  */

  #runPromise: SingletonPromise<void> = new SingletonPromise(
    async () => await this.#run()
  );

  constructor(
    sourceLocation: string,
    targetLocation: string,
    typesToImplement: string[],
    classSources: ClassSources,
    userConsole?: Console
  )
  {
    if (typesToImplement.length === 0)
      throw new Error("There must be some types to implement!");

    this.#sourceLocation = sourceLocation;
    this.#targetLocation = targetLocation;
    this.#typesToImplement = typesToImplement;
    this.#classSources = classSources;
    this.#userConsole = userConsole;
  }

  async run() : Promise<void>
  {
    await this.#runPromise.run();
  }

  async #run() : Promise<void>
  {
    const [sourceCode, ast] = await this.#parseFile(this.#sourceLocation);
    const typeNodesArray: ReadonlySet<TSTypeOrInterfaceDeclaration>[] = this.#typesToImplement.map(
      typeToExtract => this.#getExportedType(ast, this.#sourceLocation, typeToExtract)
    );

    const typeNodeSet: ReadonlySet<TSTypeOrInterfaceDeclaration> = new Set(
      ...typeNodesArray.map(types => types.values())
    );

    this.#fillClassDefinition(sourceCode, ast, typeNodeSet);

    void(this.#targetLocation);
  }

  async #parseFile(
    sourceLocation: string
  ) : Promise<[string, AST<TSESTreeOptions>]>
  {
    sourceLocation = path.normalize(path.resolve(
      process.cwd(), sourceLocation
    ));
    const sourceCode = await fs.readFile(sourceLocation, { encoding: "utf-8" });

    return [sourceCode, ESTreeParser(sourceCode, {
      filePath: sourceLocation
    })];
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
    return typeExtractor.typeNodes;
  }

  #fillClassDefinition(
    sourceCode: string,
    ast: AST<TSESTreeOptions>,
    typeNodeSet: ReadonlySet<TSTypeOrInterfaceDeclaration>
  ) : void
  {
    const traversal = new ESTreeTraversal(ast, TSFieldIteratorDecider);
    const fieldIterator = new TSFieldIterator(sourceCode, this.#classSources, this.#userConsole);

    typeNodeSet.forEach(typeNode => {
      traversal.traverseEnterAndLeave(typeNode, fieldIterator)
    });
  }
}
