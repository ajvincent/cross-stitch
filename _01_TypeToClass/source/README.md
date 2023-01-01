# TypeToClass API rewrite

## ExtractMembers

We need to navigate the AST of nodes from `ts-morph` to construct our members list for `TypeToClass` to iterate over.

Now, at first glance this seems very much like reinventing the wheel... and it really is, because the following code should work:

```typescript
TypeLiteral.getType().getProperties();
```

Unfortunately, [ECMAScript symbol keys don't show up in the properties list](https://github.com/dsherret/ts-morph/issues/1365).  So, because there's so many different ways a symbol key can appear in the AST... I have to cover as many of those possibilities as I can.  Which means reinventing the wheel as far as
generating signatures for properties, methods, etc.

This is likely to be buggy.  Which is why I have to write lots of tests.  I will _gladly_ throw away all this code if someone shows me a way to fix the missing-symbol-keys problem.

## Miscellaneous notes

I'm starting to figure out that what I really need is Structure instances, which I pass into this.#classNode.addMethod().

``` typescript
class TypeToClass_New {
  #examineField(
    firstTypeNode: InterfaceOrTypeAlias,
    field: ts.Symbol
  ) : void
  {
    const typeAtNode = field.getTypeAtLocation(firstTypeNode);

    const declarations = field.getDeclarations();
    if (declarations.length > 1) {
      throw new Error("unexpected: more than one declaration");
    }

    const firstDecl = declarations[0];
    if (ts.Node.isMethodSignature(firstDecl)) {
      const typeAliasStructure = firstDecl.getStructure();
      console.log(typeAliasStructure);
      debugger;
    }
    else if (ts.Node.isPropertySignature(firstDecl)) {
      const typeAliasStructure = firstDecl.getStructure();
      console.log(typeAliasStructure);
      debugger;
    }
    else {
      throw new Error("unexpected");
    }
  }
}

export interface MethodSignatureStructure  extends
  Structure,
  PropertyNamedNodeStructure, // name ,
  JSDocableNodeStructure, // docs?
  ParameteredNodeStructure, // parameters?
  ReturnTypedNodeStructure, // returnType
  TypeParameteredNodeStructure, // typeParameters
  QuestionTokenableNodeStructure // hasQuestionToken
{
}

export interface MethodDeclarationStructure extends
  Structure,
  PropertyNamedNodeStructure,
  JSDocableNodeStructure,
  ParameteredNodeStructure,
  ReturnTypedNodeStructure,
  TypeParameteredNodeStructure,
  QuestionTokenableNodeStructure,

  AsyncableNodeStructure, // isAsync
  StatementedNodeStructure // statements
{
}

export interface PropertySignatureStructure extends
  Structure,
  PropertyNamedNodeStructure, // name
  TypedNodeStructure, // type
  QuestionTokenableNodeStructure, // hasQuestionToken
  JSDocableNodeStructure, // docs
  ReadonlyableNodeStructure, // isReadonly
  InitializerExpressionableNodeStructure // initializer
{
}

export interface PropertyDeclarationStructure extends
  Structure,
  PropertyNamedNodeStructure,
  TypedNodeStructure,
  QuestionTokenableNodeStructure,
  JSDocableNodeStructure,
  ReadonlyableNodeStructure,
  InitializerExpressionableNodeStructure,

  PropertyDeclarationSpecificStructure, // hasAccessorKeyword
  ExclamationTokenableNodeStructure, // hasExclamationToken
  StaticableNodeStructure, // isStatic
  ScopedNodeStructure, // scope
  DecoratableNodeStructure, // decorators
  AbstractableNodeStructure, // isAbstract
  AmbientableNodeStructure, // hasDeclareKeyword
  OverrideableNodeStructure // hasOverrideKeyword
{
}

export interface GetAccessorDeclarationStructure extends
  Structure,
  PropertyNamedNodeStructure,

  ParameteredNodeStructure, // parameters
  ReturnTypedNodeStructure, // returnType
  TypeParameteredNodeStructure, // typeParameters
  JSDocableNodeStructure, // docs
  StatementedNodeStructure // statements

  StaticableNodeStructure, // isStatic
  DecoratableNodeStructure, // decorators
  AbstractableNodeStructure, // isAbstract
  ScopedNodeStructure, // scope
{
}

export interface SetAccessorDeclarationStructure extends
  Structure,
  PropertyNamedNodeStructure,

  ParameteredNodeStructure, // parameters
  ReturnTypedNodeStructure, // returnType
  TypeParameteredNodeStructure, // typeParameters
  JSDocableNodeStructure, // docs
  StatementedNodeStructure, // statements

  StaticableNodeStructure, // isStatic
  DecoratableNodeStructure, // decorators
  AbstractableNodeStructure, // isAbstract
  ScopedNodeStructure, // scope
{
}


/* ------------------------------- */

export interface Structure {};

export interface PropertyNamedNodeStructure {
  name: string;
}

interface QuestionTokenableNodeStructure {
  hasQuestionToken?: boolean;
}

export interface JSDocableNodeStructure {
  docs?: (string)[];
}

export interface ParameteredNodeStructure {
  parameters?: OptionalKind<ParameterDeclarationStructure>[];
}

export interface ReturnTypedNodeStructure {
  returnType?: string | WriterFunction;
}

export interface TypeParameteredNodeStructure {
  typeParameters?: (OptionalKind<TypeParameterDeclarationStructure> | string)[];
}

/* --------------------------------------- */

interface AsyncableNodeStructure {
  isAsync?: boolean;
}

interface StatementedNodeStructure {
  statements?: (string | WriterFunction | StatementStructures)[] | string | WriterFunction;
}

/* ----------------------------------- */

interface PropertySignatureSpecificStructure {}

interface TypedNodeStructure {
  type?: string | WriterFunction;
}

interface ReadonlyableNodeStructure {
  isReadonly?: boolean;
}

interface InitializerExpressionableNodeStructure {
  initializer?: string | WriterFunction;
}

/* -------------------------------------------- */

interface PropertyDeclarationSpecificStructure extends KindedStructure<StructureKind.Property> {
  hasAccessorKeyword?: boolean;
}

interface ExclamationTokenableNodeStructure {
  hasExclamationToken?: boolean;
}

interface StaticableNodeStructure {
  isStatic?: boolean;
}

interface ScopedNodeStructure {
  scope?: Scope;
}

interface DecoratableNodeStructure {
  decorators?: OptionalKind<DecoratorStructure>[];
}

interface AbstractableNodeStructure {
  isAbstract?: boolean;
}

interface AmbientableNodeStructure {
  hasDeclareKeyword?: boolean;
}

interface OverrideableNodeStructure {
  hasOverrideKeyword?: boolean;
}
```

Checklist to add:

- [ ] Property getters
- [ ] Property setters
