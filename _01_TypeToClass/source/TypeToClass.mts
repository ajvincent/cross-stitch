import ts from "ts-morph";
import { PromiseAllSequence } from "../../_00_shared_utilities/source/PromiseTypes.mjs";

import SignaturesToDeclarations, {
  UserMethodStructure,
  UserPropertyDictionary,
  UserBothAccessorsDictionary,
  UserAccessorDictionary,
} from "./SignaturesToDeclarations.mjs";

export type InterfaceOrTypeAlias = ts.InterfaceDeclaration | ts.TypeAliasDeclaration;

export type TypeToClassCallbacks =
{
  maybeAddMethod(
    classDeclaration: ts.ClassDeclaration,
    structure: UserMethodStructure
  ) : Promise<UserMethodStructure | null>;

  maybeAddProperty(
    classDeclaration: ts.ClassDeclaration,
    structures: UserPropertyDictionary & UserBothAccessorsDictionary
  ) : Promise<UserPropertyDictionary | UserAccessorDictionary | null>;
};

export default class TypeToClass
{
  readonly #destFile: ts.SourceFile;
  #targetClass: ts.ClassDeclaration;
  readonly #userCallbacks: TypeToClassCallbacks;

  /**
   * @param destFile  - The destination file, which must be empty.
   * @param className - The name of the class to create.
   * @param callback  - The callback to define the contents of a field.
   */
  constructor(
    destFile: ts.SourceFile,
    className: string,
    userCallbacks: TypeToClassCallbacks,
  )
  {
    this.#destFile = destFile;

    destFile.insertStatements(0, `
/* This is generated code.  Do not edit directly.
   Instead, edit the types this file imports.
*/
    `.trim());

    this.#targetClass = destFile.addClass({
      name: className,
      isDefaultExport: true,
      isExported: true,
    });

    this.#userCallbacks = userCallbacks;
  }

  /**
   * Add a type from a source file.  This will invoke the user's callback for members of that type.
   *
   * @param sourceFile - The source file.
   * @param typeName   - The type to extract.
   * @param parametersMap - parameters to apply to the type.
   * @param classParametersMap - parameters to add to the class definition.
   */
  async addTypeAliasOrInterface(
    sourceFile: ts.SourceFile,
    typeName: string,
    parametersMap: Map<string, string> = new Map,
    classParametersMap: Set<string> = new Set,
  ) : Promise<void>
  {
    if (parametersMap.size)
      throw new Error("parametersMap must be empty for now - this feature is not yet supported!");
    if (classParametersMap.size)
      throw new Error("classParametersMap must be empty for now - this feature is not yet supported!");

    const firstTypeNode = this.#extractFirstTypeNode(sourceFile, typeName);
    const type = firstTypeNode.getType();

    if (type.getUnionTypes().length)
      throw new Error("You cannot add a type which is a union of two or more types!  (How should I know which type to support?)");

    const fields = type.getProperties();
    if (fields.length === 0)
      throw new Error("No properties to add?");

    const fieldNames = new Set(fields.map(field => {
      // Symbol keys appear at the end of the fully qualified name.
      const fullName = field.getFullyQualifiedName();
      const fieldName = fullName.substring(fullName.lastIndexOf(".") + 1);
      return fieldName;
    }));

    const acceptedFields = new Set((
      await PromiseAllSequence(fields, async field => {
        return await this.#processField(
          firstTypeNode, field
        );
      })
    ).filter(Boolean));

    if (acceptedFields.size === 0)
      throw new Error(`For type ${typeName}, no properties or methods were accepted!`);
    if (acceptedFields.size === fieldNames.size)
      this.#targetClass.addImplements(typeName);
    else {
      this.#targetClass.addImplements(`Pick<${typeName}, ${
        Array.from(acceptedFields.values()).map(v => v ? `"${v}"` : `null`).join(" | ")
      }>`);
    }

    this.#addTypeImport(sourceFile, typeName);
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

  async #processField(
    firstTypeNode: InterfaceOrTypeAlias,
    field: ts.Symbol,
  ) : Promise<string | null>
  {
    // Symbol keys appear at the end of the fully qualified name.
    const fullName = field.getFullyQualifiedName();
    const fieldName = fullName.substring(fullName.lastIndexOf(".") + 1);

    const declarations = field.getDeclarations();
    if (declarations.length > 1) {
      throw new Error("unexpected: more than one declaration");
    }

    const firstDecl = declarations[0];

    if (ts.Node.isMethodSignature(firstDecl)) {
      const structure = SignaturesToDeclarations.convertMethod(firstDecl.getStructure());

      const methodStructure = await this.#userCallbacks.maybeAddMethod(
        this.#targetClass,
        structure
      );
      if (!methodStructure)
        return null;

      TypeToClass.#assertNameMatch(fieldName, "methodStructure", methodStructure.name);
      this.#targetClass.addMethod(methodStructure);
      return fieldName;
    }

    if (ts.Node.isPropertySignature(firstDecl)) {
      const structures = SignaturesToDeclarations.convertProperty(firstDecl.getStructure());

      const userStructures = await this.#userCallbacks.maybeAddProperty(
        this.#targetClass,
        structures
      );
      if (!userStructures)
        return null;

      if ("property" in userStructures) {
        TypeToClass.#assertNameMatch(
          fieldName, "propertyStructure", userStructures.property.name
        );
        this.#targetClass.addProperty(userStructures.property);
      }
      else {
        if ("getter" in userStructures) {
          TypeToClass.#assertNameMatch(
            fieldName, "getterStructure", userStructures.getter.name
          );
        }
        if ("setter" in userStructures) {
          TypeToClass.#assertNameMatch(
            fieldName, "setterStructure", userStructures.setter.name
          );
        }

        if ("getter" in userStructures) {
          this.#targetClass.addGetAccessor(userStructures.getter);
        }
        if ("setter" in userStructures) {
          this.#targetClass.addSetAccessor(userStructures.setter);
        }
      }

      return fieldName;
    }

    throw new Error("unexpected declaration signature");
  }

  static #assertNameMatch(
    fieldName: string,
    logDescription: string,
    structureName: string
  ) : void
  {
    if (fieldName !== structureName) {
      throw new Error(`Name mismatch between field and ${logDescription}: "${fieldName}" versus "${structureName}"`);
    }
  }

  #importDeclarations = new WeakMap<ts.SourceFile, ts.ImportDeclaration>;

  /**
   * Add a type import for the target file.
   *
   * @param sourceFile - The source file.
   * @param typeName   - The type to import.
   */
  #addTypeImport(
    sourceFile: ts.SourceFile,
    typeName: string
  ) : void
  {
    // https://github.com/dsherret/ts-morph/issues/613#issuecomment-607860679

    const decl = this.#importDeclarations.get(sourceFile);
    if (!decl) {
      let moduleSpecifier = this.#destFile.getRelativePathAsModuleSpecifierTo(sourceFile);
      if (!moduleSpecifier.endsWith(".mjs"))
        moduleSpecifier += ".mjs";

      this.#importDeclarations.set(sourceFile,
        this.#destFile.addImportDeclaration({
          namedImports: [typeName],
          moduleSpecifier
        })
      );
    }
    else {
      decl.addNamedImport(typeName);
    }

    this.#destFile.fixMissingImports();
  }
}
