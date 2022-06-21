import TSESTree from "@typescript-eslint/typescript-estree";
type TSMethodSignature = TSESTree.TSESTree.TSMethodSignature;
type TSPropertySignature = TSESTree.TSESTree.TSPropertySignature;

type AppendableStringSet = ReadonlySet<string> & Pick<Set<string>, "add">;

export interface ClassSources
{
  readonly filePrologue: ReadonlySet<string>;
  readonly classBodyFields: ReadonlySet<string>;
  readonly fileEpilogue: ReadonlySet<string>;

  defineMethod(
    methodName: string,
    signatureSource: string,
    node: TSMethodSignature
  ) : void;

  defineProperty(
    propertyName: string,
    signatureSource: string,
    node: TSPropertySignature
  ) : void;
}

export abstract class ClassSourcesBase implements ClassSources
{
  filePrologue: AppendableStringSet = new Set;
  classBodyFields: AppendableStringSet = new Set;
  fileEpilogue: AppendableStringSet = new Set;

  abstract defineMethod(
    methodName: string,
    signatureSource: string,
    node: TSMethodSignature
  ): void;

  protected provideVoids(
    node: TSMethodSignature,
    exclude: Set<string> = new Set
  ) : string[]
  {
    const params = node.params.map(p => {
      if (p.type === "Identifier") {
        return exclude.has(p.name) ? "" : p.name;
      }
      throw new Error("Unexpected parameter type: " + p.type);
    });

    return params.filter(Boolean).map(p => `void(${p});`)
  }

  abstract defineProperty(
    propertyName: string,
    signatureSource: string,
    node: TSESTree.TSESTree.TSPropertySignature
  ): void;
}

export class ClassSourcesNotImplemented extends ClassSourcesBase
{
  defineMethod(
    methodName: string,
    signatureSource: string,
    node: TSESTree.TSESTree.TSMethodSignature
  ): void
  {
    void(methodName);
    const voidLines = this.provideVoids(node).map(v => "    " + v).join("\n");

    this.classBodyFields.add(`  ${signatureSource}
  {
${voidLines}
    throw new Error("not yet implemented");
  }`
    );
  }

  defineProperty(
    propertyName: string,
    signatureSource: string,
    node: TSESTree.TSESTree.TSPropertySignature
  ): void
  {
    void(propertyName);
    void(node);
    this.classBodyFields.add(`  get ${signatureSource}
  {
    throw new Error("not yet implemented");
  }`
    );
  }
}
