import fs from "fs/promises";
import path from "path";
import url from "url";

import TSESTree, { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";

import ESTreeErrorUnregistered from "./ESTreeErrorUnregistered.mjs";
import tempDirWithCleanup from "../../_00_shared_utilities/source/tempDirWithCleanup.mjs";

type TSNode = TSESTree.TSESTree.Node;

type TSToMethodType = (
  identifier: string,
  typedArguments: TSNode[],
  returnType: TSNode
) => string;

type ClassConfiguration = {
  filePrologue: string,
  fileEpilogue: string,
  classPrologue: string,
  classEpilogue: string
};

type TraversalEnterAccept = (n: TSNode) => boolean;
type TraversalLeaveAccept = (n: TSNode) => void;

class NodeToClassTreeTraversal extends ESTreeErrorUnregistered
{
  #enterAccept: TraversalEnterAccept;
  #leaveAccept: TraversalLeaveAccept;

  constructor(
    pathToSourceFile: string,
    enterAccept: TraversalEnterAccept,
    leaveAccept: TraversalLeaveAccept
  )
  {
    super(pathToSourceFile);
    this.#enterAccept = enterAccept;
    this.#leaveAccept = leaveAccept;
  }

  static readonly #acceptTypes: ReadonlySet<AST_NODE_TYPES> = new Set([

  ]);

  static readonly #skipTypes: ReadonlySet<TSESTree.AST_NODE_TYPES> = new Set([

  ]);
  static readonly #rejectTypes: ReadonlySet<TSESTree.AST_NODE_TYPES> = new Set([

  ]);
  static readonly #rejectChildrenTypes: ReadonlySet<TSESTree.AST_NODE_TYPES> = new Set([

  ]);

  readonly skipTypes = NodeToClassTreeTraversal.#skipTypes;
  readonly rejectTypes = NodeToClassTreeTraversal.#rejectTypes;
  readonly rejectChildrenTypes = NodeToClassTreeTraversal.#rejectChildrenTypes;

  enter(n: TSNode): boolean {
    return NodeToClassTreeTraversal.#acceptTypes.has(n.type) ?
      this.#enterAccept(n) :
      super.enter(n);
  }

  leave(n: TSNode): void
  {
    return NodeToClassTreeTraversal.#acceptTypes.has(n.type) ?
      this.#leaveAccept(n) :
      super.leave(n);
  }
}

export class TSNodeToClassFile
{
  readonly #traversal: NodeToClassTreeTraversal;
  readonly #typeToExtract: string;
  readonly #pathToTargetModule: string;
  readonly #targetClassName: string;
  readonly #tsToMethodType: TSToMethodType;
  readonly #classConfiguration: ClassConfiguration;

  #generatedMethods: string[] = [];

  constructor(
    pathToSourceModule: string,
    typeToExtract: string,
    pathToTargetModule: string,
    targetClassName: string,
    classConfiguration: ClassConfiguration,
    tsToMethodType: TSToMethodType
  )
  {
    this.#traversal = new NodeToClassTreeTraversal(pathToSourceModule, this.#enterAccept, this.#leaveAccept);
    this.#typeToExtract = typeToExtract;
    this.#pathToTargetModule = pathToTargetModule;
    this.#targetClassName = targetClassName;
    this.#classConfiguration = classConfiguration;
    this.#tsToMethodType = tsToMethodType;
  }

  // #region Parse file and start iteration
  async run(): Promise<void>
  {
    const targetModuleGroups: string[] = [
      this.#classConfiguration.filePrologue,

      `export default class ${this.#targetClassName} implements ${this.#typeToExtract}\n{`,

      this.#classConfiguration.classPrologue,
      ...(await this.#traverseForOutput()),
      this.#classConfiguration.classEpilogue,

      `}`,

      this.#classConfiguration.fileEpilogue
    ];

    const targetModuleContents = targetModuleGroups.join("\n\n");

    await fs.writeFile(this.#pathToTargetModule, targetModuleContents, { encoding: "utf-8"});

    // Sanity check the generated content.
    TSESTree.parse(
      targetModuleContents,
      {
        errorOnUnknownASTType: false,
        filePath: this.#pathToTargetModule,
        loc: true,
      }
    );
  }

  async #traverseForOutput(): Promise<string[]>
  {
    await this.#traversal.run();
    return this.#generatedMethods;
  }

  #enterAccept = (n: TSNode): boolean =>
  {
    void(n);
    void(this.#tsToMethodType);
    return true;
  }

  #leaveAccept = (n: TSNode): void =>
  {
    void(this.#tsToMethodType);
    void(n);
  }
  // #endregion Parse file and start iteration
}

export async function TSNodeToInlineClass<
  constructorType extends (...__args__: unknown[]) => unknown
>
(
  importURL: URL,
  typeToExtract: string,
  classConfiguration: ClassConfiguration,
  tsToMethodType: TSToMethodType
): Promise<constructorType>
{
  console.warn("Do not invoke TSNodeToInlineClass in production code!  " + url.fileURLToPath(importURL));
  const pathToSourceModule = url.fileURLToPath(importURL);

  const cleanup = await tempDirWithCleanup();
  try {
    const pathToTargetModule = path.join(cleanup.tempDir, "module.mts");
    const targetClassName = "__generated__";

    const nodeToClass = new TSNodeToClassFile(
      pathToSourceModule,
      typeToExtract,
      pathToTargetModule,
      targetClassName,
      classConfiguration,
      tsToMethodType
    );
    await nodeToClass.run();

    const urlToTargetModule = url.pathToFileURL(pathToTargetModule);
    const targetModule = (await import(urlToTargetModule.href)).default;

    return targetModule.default as constructorType;
  }
  finally {
    cleanup.resolve(null);
    await cleanup.promise;
  }
}
