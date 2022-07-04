import TSESTree from "@typescript-eslint/typescript-estree";
type TSMethodSignature = TSESTree.TSESTree.TSMethodSignature;
type TSPropertySignature = TSESTree.TSESTree.TSPropertySignature;

type AppendableStringSet = ReadonlySet<string> & Pick<Set<string>, "add">;

export interface ClassSources
{
  readonly filePrologue: ReadonlySet<string>;
  readonly classBodyFields: ReadonlySet<string>;
  readonly fileEpilogue: ReadonlySet<string>;

  /**
   * @param methodName      - The name of the method.
   * @param signatureSource - The extracted source string for arguments and types.
   * @param node            - The raw ESTree node.
   *
   * @returns True on success (false if it didn't define a method matching the name).
   */
  defineMethod(
    methodName: string,
    signatureSource: string,
    node: TSMethodSignature
  ) : boolean;

  /**
   *
   * @param propertyName    - The name of the property.
   * @param signatureSource - The extracted source string for arguments and types.
   * @param node            - The raw ESTree node.
   *
   * @returns True on success (false if it didn't define a method matching the name).
   */
  defineProperty(
    propertyName: string,
    signatureSource: string,
    node: TSPropertySignature
  ) : boolean;
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
  ): boolean;

  /**
   *
   * @param node    - the signature of the method.
   * @param exclude - Parameters we don't need void() for.
   */
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
  ): boolean;
}

export class ClassSourcesNotImplemented extends ClassSourcesBase
{
  defineMethod(
    methodName: string,
    signatureSource: string,
    node: TSESTree.TSESTree.TSMethodSignature
  ): boolean
  {
    void(methodName);
    const voidLines = this.provideVoids(node).map(v => "    " + v).join("\n");

    this.classBodyFields.add(`  ${signatureSource}
  {
${voidLines}
    throw new Error("not yet implemented");
  }`
    );
    return true;
  }

  defineProperty(
    propertyName: string,
    signatureSource: string,
    node: TSESTree.TSESTree.TSPropertySignature
  ): boolean
  {
    void(propertyName);
    void(node);
    this.classBodyFields.add(`  get ${signatureSource.replace(/(^[^:]+)/g, "$1()")}
  {
    throw new Error("not yet implemented");
  }`
    );
    return true;
  }
}
