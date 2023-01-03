import ts, {
  MethodSignatureStructure,
  PropertySignatureStructure,
} from "ts-morph";

// #region user structures
export type UserMethodStructure = Pick<
  ts.MethodDeclarationStructure,
  "docs" |
  "isAsync" |
  "name" |
  "typeParameters" |
  "parameters" |
  "hasQuestionToken" |
  "returnType" |
  "statements" |
  never
>;

type UserPropertyStructure = Pick<
  ts.PropertyDeclarationStructure,
  "docs" |
  "isReadonly" |
  "name" |
  "hasQuestionToken" |
  "type" |
  "initializer" |
  never
>;

type UserGetterStructure = Pick<
  ts.GetAccessorDeclarationStructure,
  "docs" |
  "name" |
  "typeParameters" |
  /*
  I don't think this is used in a property getter.
  "parameters" |
  */
  "returnType" |
  "statements" |
  never
>;

type UserSetterStructure = Pick<
  ts.SetAccessorDeclarationStructure,
  "docs" |
  "name" |
  "typeParameters" |
  "parameters" |
  "statements" |
  never
>;
// #endregion user structures

export type UserPropertyDictionary = {
  property: UserPropertyStructure
};

export type UserGetterDictionary = {
  getter: UserGetterStructure;
};

export type UserSetterDictionary = {
  setter: UserSetterStructure;
};

export type UserBothAccessorsDictionary =
  UserGetterDictionary & UserSetterDictionary;

// At least one of them.
export type UserAccessorDictionary =
  UserGetterDictionary | UserSetterDictionary | UserBothAccessorsDictionary;

const SignaturesToDeclarations = Object.freeze({
  convertMethod(
    signature: MethodSignatureStructure
  ) : UserMethodStructure
  {
    return {
      docs: signature.docs,
      // I know someone could write type FooPromise<T, ...> = Promise<T>, but this is a best guess.
      isAsync: signature.returnType?.toString().startsWith("Promise<") ?? false,
      name: signature.name,
      typeParameters: signature.typeParameters,
      parameters: signature.parameters,
      hasQuestionToken: signature.hasQuestionToken ?? false,
      returnType: signature.returnType,
      statements: [],
    };
  },

  convertProperty(
    signature: PropertySignatureStructure
  ) : UserPropertyDictionary & UserBothAccessorsDictionary
  {
    const property: UserPropertyStructure = {
      docs: signature.docs,
      isReadonly: signature.isReadonly ?? false,
      hasQuestionToken: signature.hasQuestionToken ?? false,
      name: signature.name,
      type: signature.type,
      initializer: signature.initializer,
    };

    const getter: UserGetterStructure = {
      docs: signature.docs,
      name: signature.name,
      typeParameters: [],
      returnType: signature.type,
      statements: [],
    };

    const setter: UserSetterStructure = {
      docs: signature.docs,
      name: signature.name,
      typeParameters: [],
      parameters: [
        {
          name: "value",
          type: signature.type
        }
      ],
      statements: [],
    };

    return { property, getter, setter };
  }
});
export default SignaturesToDeclarations;
