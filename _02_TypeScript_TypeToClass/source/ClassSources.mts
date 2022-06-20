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
    node: TSESTree.TSESTree.TSMethodSignature
  ): void;

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
    void(node);
    this.classBodyFields.add(`${signatureSource}
    {
      throw new Error("not yet implemented");
    }`)
  }

  defineProperty(
    propertyName: string,
    signatureSource: string,
    node: TSESTree.TSESTree.TSPropertySignature
  ): void
  {
    void(propertyName);
    void(node);
    this.classBodyFields.add(`get ${signatureSource}
    {
      throw new Error("not yet implemented");
    }`)
  }
}
