import path from "path";
import fs from "fs/promises";

import TSESTree from "@typescript-eslint/typescript-estree";

// TSNode is a union of many TSNode types, each with an unique "type" attribute
type TSNode = TSESTree.TSESTree.Node;
type Identifier = TSESTree.TSESTree.Identifier;

import { ClassSources } from "./ClassSources.mjs";
import { TSFieldIterator, TSFieldIteratorDecider } from "./TSFieldIterator.mjs";

import {
  DefaultMap
} from "../../_00_shared_utilities/source/DefaultMap.mjs";

import {
  PromiseAllSequence,
  SingletonPromise
} from "../../_00_shared_utilities/source/PromiseTypes.mjs";

import MultiFileParser, { ParseForESLintResult_Sources } from "../../_01_TypeScript_ESTree/source/MultiFileParser.mjs";
import ESTreeTraversal from "../../_01_TypeScript_ESTree/source/ESTreeTraversal.mjs";
import IsIdentifier from "../../_01_TypeScript_ESTree/source/IsIdentifier.mjs";
import { TSExportTypeExtractor, TSExportTypeFilterDecider } from "./TSExportTypeExtractor.mjs";

type TypeToImportAndSource = {
  typeToImplement: string,
  sourceLocation: string,
  targetImplements: boolean,

  exportedNodes: Set<TSNode>
};

export default class Driver {
  readonly #targetLocation: string;
  readonly #targetClassName: string;
  readonly #classSources: ClassSources;
  readonly #parser: MultiFileParser;
  readonly #userConsole?: Console;

  /**
   * The nodes in the map's value set might not be in the same AST as the map's key!
   */
  readonly #identifierToDefinitionNodes = new WeakMap<Identifier, Set<TSNode>>;

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

    this.#parser = new MultiFileParser(project, tsconfigRootDir);

    this.#userConsole = userConsole;

    void(this.#identifierToDefinitionNodes);
  }

  /**
   * Declare the target class must implement a particular type.
   *
   * @param typeToImplement - The exported type name.
   * @param sourceLocation  - The path to the TypeScript file.
   */
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
          targetImplements: true,

          exportedNodes: new Set,
        };
      }
    ).targetImplements = true;
  }

  #typesAndSources: DefaultMap<string, TypeToImportAndSource> = new DefaultMap;
  #sourceAndAST_Promises: DefaultMap<string, Promise<ParseForESLintResult_Sources>> = new DefaultMap;

  async run() : Promise<void>
  {
    await this.#runPromise.run();
  }

  async #run() : Promise<void>
  {
    if (!this.#typesAndSources.size)
      throw new Error("There must be some types to implement!");

    const sourceLocations: Set<string> = new Set;
    this.#typesAndSources.forEach(
      ({ sourceLocation }) => sourceLocations.add(sourceLocation)
    );

    sourceLocations.forEach(location => this.#sourceAndAST_Promises.set(
      location, this.#parser.getSourcesAndAST(location)
    ));

    await PromiseAllSequence(
      Array.from(this.#typesAndSources.values()),
      async (typeAndSource) => {
        await this.#fillExportedNodes(typeAndSource);
      }
    );

    // At this point, I must look up the references of the exported nodes.
    // For references to imported types, sometimes I'll need to asynchronously parse the imported modules...
    await PromiseAllSequence(
      Array.from(this.#typesAndSources.values()),
      async (typeAndSource) => {
        await this.#replaceAllReferencesTopLevel(typeAndSource);
      }
    );

    await PromiseAllSequence(
      Array.from(this.#typesAndSources.values()),
      async (typeAndSource) => {
        await this.#fillClassDefinition(typeAndSource);
      }
    );

    await this.#writeFinalModule();
  }

  /**
   * Find type and interface nodes matching the desired type, and determine if those types are exported.
   * Assign retrieved nodes to the exportedNodes field.
   * @param typeAndSource - the desired type and source location.
   */
  async #fillExportedNodes(
    typeAndSource: TypeToImportAndSource
  ) : Promise<void>
  {
    const sourceAndAST = await this.#sourceAndAST_Promises.get(typeAndSource.sourceLocation);
    if (!sourceAndAST)
      throw new Error("assertion failure: we should have tried loading this file");

    const pathToFile = typeAndSource.sourceLocation,
          typeToExtract = typeAndSource.typeToImplement;

    const traversal = new ESTreeTraversal(
      sourceAndAST.ast,
      TSExportTypeFilterDecider
    );
    const typeExtractor = new TSExportTypeExtractor(
      typeToExtract,
      this.#userConsole
    );

    traversal.traverseEnterAndLeave(sourceAndAST.ast, typeExtractor);

    if (!typeExtractor.exportTypeFound)
      throw new Error(`Export type not found for type "${typeToExtract}" in file "${pathToFile}"`);
    if (!typeExtractor.typeNodes.size)
      throw new Error(`No type or interface nodes found for type "${typeToExtract}" in file "${pathToFile}"`);
    typeAndSource.exportedNodes = typeExtractor.typeNodes;
  }

  /**
   * Loop over all exported nodes repeatedly to resolve type references.
   *
   * @param typeAndSource - The type data.
   */
  async #replaceAllReferencesTopLevel(
    typeAndSource: TypeToImportAndSource
  ): Promise<void>
  {
    const exportedNodes = Array.from(typeAndSource.exportedNodes);
    let references: TSNode[] = Driver.#filterForReferences(exportedNodes);

    /* Each pass should replace a reference with an unknown number of other
     * type aliases.  Ultimately, I should be able to eliminate all type
     * references at the top level this way.
     *
     * Note: This is likely throwaway code, as later I'll have to deal with
     * unions and parameterized types containing type references, for starters.
     * I have tests, though, so it should be safe to rewrite in the future.
     */

    while (references.length) {
      await PromiseAllSequence(
        references,
        async (referenceNode: TSNode) => {
          if (referenceNode.type === "TSTypeAliasDeclaration")
            referenceNode = referenceNode.typeAnnotation;
          if ((referenceNode.type === "TSTypeReference") ||
              (referenceNode.type === "TSIntersectionType")) {
            await this.#replaceOneReference(exportedNodes, referenceNode, true);
          }
          else {
            throw new Error("assertion failure: unsupported type reference?")
          }
        }
      );

      references = Driver.#filterForReferences(exportedNodes);
    }

    typeAndSource.exportedNodes = new Set(exportedNodes);
  }

  static #filterForReferences(exportedNodes: TSNode[]) : TSNode[]
  {
    return exportedNodes.filter(exportedNode => {
      if (exportedNode.type === "TSTypeAliasDeclaration")
        exportedNode = exportedNode.typeAnnotation;

      if (exportedNode.type === "TSTypeReference")
        return true;
      if (exportedNode.type === "TSIntersectionType")
        return true;

      return false;
    });
  }

  /**
   * Replace one type reference with the underlying type aliases and interface declarations.
   *
   * @param exportedNodes - the current list of nodes to export.
   * @param referenceNode - a member of exported nodes, to replace.
   * @param mustImport    - True if we should look up an imported type.
   */
  async #replaceOneReference(
    exportedNodes: TSNode[],
    referenceNode: TSNode,
    mustImport: boolean
  ) : Promise<void>
  {
    let replacements: TSNode[] = [];
    if (referenceNode.type === "TSTypeReference")
    {
      // The replacements may live in another file.
      replacements = await this.#parser.dereferenceIdentifier(
        referenceNode, mustImport
      );
    }
    else if (referenceNode.type === "TSIntersectionType")
    {
      replacements = referenceNode.types;
    }
    else {
      throw new Error("assertion failure: unsupported type reference?")
    }

    // Do the replacement.  If there are other type references, trust the caller
    // to handle them.
    exportedNodes.splice(
      exportedNodes.indexOf(referenceNode),
      1,
      ...replacements
    );
  }

  /**
   * Generate the class fields for a requested type.
   * @param typeAndSource - the desired type and source location.
   */
  async #fillClassDefinition(
    typeAndSource: TypeToImportAndSource
  ) : Promise<void>
  {
    await PromiseAllSequence(
      Array.from(typeAndSource.exportedNodes),
      async typeNode => await this.#fillClassForTypeNode(typeAndSource, typeNode)
    );
  }

  async #fillClassForTypeNode(
    typeAndSource: TypeToImportAndSource,
    typeNode: TSNode
  ) : Promise<void>
  {
    const sourceAndAST = await this.#parser.getSourcesAndASTByNode(typeNode);

    // Through the TSFieldIterator, we notify the class sources of each method to implement.
    const traversal = new ESTreeTraversal(
      sourceAndAST.ast,
      TSFieldIteratorDecider
    );
    const fieldIterator = new TSFieldIterator(
      sourceAndAST,
      this.#classSources,
      this.#userConsole
    );

    traversal.traverseEnterAndLeave(typeNode, fieldIterator);

    // Presumably the caller's class sources have been fully populated.
    // We still need to declare the 'implements' field.
    if (fieldIterator.fieldsFound.size === fieldIterator.fieldsImplemented.size) {
      this.#implementedTypes.set(
        typeAndSource.typeToImplement,
        typeAndSource.typeToImplement
      );
    }
    else {
      // Some fields are missing.  Generate a `Pick<>` type.
      const fieldsImplementedUnion = Array.from(
        fieldIterator.fieldsImplemented.values()
      );

      this.#implementedTypes.set(
        typeAndSource.typeToImplement,
        `Pick<\n  ${typeAndSource.typeToImplement},\n${
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
