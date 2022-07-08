import ts from "ts-morph";
/*
import CodeBlockWriter from "code-block-writer";
*/

type InterfaceOrTypeAlias = ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
export type FieldDeclaration = ts.MethodDeclaration | ts.PropertyDeclaration;

type TypeToClassCallback = (
  classNode: ts.ClassDeclaration,
  propertyName: string | symbol,
  propertyNode: FieldDeclaration,
  baseNode: InterfaceOrTypeAlias,
) => boolean;

export default class TypeToClass
{
  #destFile: ts.SourceFile;
  #targetClass: ts.ClassDeclaration;
  #callback: TypeToClassCallback;

  /**
   * @param destFile  - The destination file, which must be empty.
   * @param className - The name of the class to create.
   * @param callback  - The callback to define the contents of a field.
   */
  constructor(
    destFile: ts.SourceFile,
    className: string,
    callback: TypeToClassCallback,
  )
  {
    if (destFile.getStatements().length > 0)
      throw new Error("Destination file must be empty!");

    this.#destFile = destFile;
    this.#callback = callback;

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
  }

  /*
  #writer = new CodeBlockWriter({
    indentNumberOfSpaces: 2,
  });
  */

  /**
   * Add a type from a source file.  This will invoke the user's callback for members of that type.
   *
   * @param sourceFile - The source file.
   * @param typeName   - The type to extract.
   */
  addTypeAliasOrInterface(
    sourceFile: ts.SourceFile,
    typeName: string
  ) : void
  {
    const firstTypeNode = this.#extractFirstTypeNode(sourceFile, typeName);
    const type = firstTypeNode.getType();

    if (type.getUnionTypes().length)
      throw new Error("You cannot add a type which is a union of two or more types!  (How should I know which type to support?)");

    const properties = type.getProperties();
    if (properties.length === 0)
      throw new Error("No properties to add?");

    const acceptedProperties = new Set<string>;
    const allProperties = new Set<string>;

    properties.forEach(property => this.#addProperty(
      firstTypeNode,
      property,
      acceptedProperties,
      allProperties
    ));

    if (acceptedProperties.size === 0)
      throw new Error(`For type ${typeName}, no properties or methods were accepted!`);
    if (acceptedProperties.size === allProperties.size)
      this.#targetClass.addImplements(typeName);
    else {
      this.#targetClass.addImplements(`Pick<${typeName}, ${
        Array.from(acceptedProperties.values()).map(v => `"${v}"`).join(" | ")
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

  /**
   * Add a property, then call the user callback to see if we should keep it.
   *
   * @param firstTypeNode      - The type alias or first interface declaration node.
   * @param property           - The property symbol.
   * @param acceptedProperties - A list of accepted properties.
   * @param allProperties      - All candidate properties.
   *
   * @see {@link https://stackoverflow.com/questions/68531850/typescript-compiler-api-get-type-structure}
   */
  #addProperty(
    firstTypeNode: InterfaceOrTypeAlias,
    property: ts.Symbol,
    acceptedProperties: Set<string>,
    allProperties: Set<string>,
  ) : void
  {
    // Symbol keys appear at the end of the fully qualified name.
    const fullName = property.getFullyQualifiedName();
    const name = fullName.substring(fullName.lastIndexOf(".") + 1);

    this.#insertTextOfProperty(firstTypeNode, property, name);

    /** @see {@link https://ts-morph.com/manipulation/#strongwarningstrong} */
    this.#targetClass = this.#destFile.getClass(
      this.#targetClass.getName() as string
    ) as ts.ClassDeclaration;

    allProperties.add(name);
    const child = this.#targetClass.getMember(name);

    if (!ts.Node.isMethodDeclaration(child) && !ts.Node.isPropertyDeclaration(child))
      throw new Error("assertion failure: we should have a property or a method now");

    const result = this.#callback(this.#targetClass, name, child, firstTypeNode);

    this.#targetClass = this.#destFile.getClass(
      this.#targetClass.getName() as string
    ) as ts.ClassDeclaration;

    if (result) {
      acceptedProperties.add(name);
      this.#voidUnusedParameters(name);
    }
    else {
      child.remove();
    }
  }

  /**
   * Insert the initial text for a class field.
   *
   * @param firstTypeNode - The type alias or interface node.
   * @param field         - The symbol for the underlying field.
   * @param name          - The name of the field.
   *
   * @remarks This does an insertText() operation, so the callers must refresh the
   * class afterwards.
   */
  #insertTextOfProperty(
    firstTypeNode: InterfaceOrTypeAlias,
    field: ts.Symbol,
    name: string
  ) : void
  {
    const typeAtNode = field.getTypeAtLocation(firstTypeNode);

    let text = typeAtNode.getText(
      undefined,
      ts.TypeFormatFlags.NoTruncation |
      ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
    );

    let addBlock = false;
    if ((field.getFlags() & ts.SymbolFlags.Method)) {
      addBlock = true;
      // ts-morph, or more likely TypeScript itself, writes arrow function types, but specifies methods:
      // " => returnType" versus " : returnType".
      const signatures = typeAtNode.getCallSignatures();
      if (signatures.length > 1) {
        /* From the TypeScript Handbook
        https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads
        function len(s: string): number;
        function len(arr: any[]): number;
        function len(x: any) {
          return x.length;
        }

        I think that's what ts-morph is referring to...
        */

        throw new Error("TypeToClass in cross-stitch does not know how to fix method printouts with multiple call signatures.  Please file a bug.");
      }

      const returnType = signatures[0].getReturnType().getText();
      const beforeReturn = text.substring(0, text.length - returnType.length);
      text = name + beforeReturn.replace(/ => $/, " : ") + returnType;
    }
    else {
      text = name + ": " + text;
    }

    const pos = this.#targetClass.getEnd() - 1;
    this.#targetClass.insertText(
      pos,
      "    " + text + (
        addBlock ? "\n    {\n    }" : ""
      ) + "\n\n"
      /*
      this.#writer.writeLine(text).toString() + (
        addBlock ? this.#writer.block().toString() : ""
      )
      */
    );
  }

  /**
   * Ensure unused parameters pass eslint by adding void() statements.
   *
   * @param fieldName - The name of the field.
   */
  #voidUnusedParameters(
    fieldName: string
  ) : void
  {
    type MethodType = ts.MethodDeclaration | ts.SetAccessorDeclaration;
    let method: MethodType | undefined = this.#targetClass.getInstanceMethod(fieldName);
    if (!method)
      method = this.#targetClass.getSetAccessor(fieldName);
    if (!method)
      return;
  
    const found = new Set<string>;
    {
      const body = method.getBodyOrThrow();
      const descendantIdentifiers = body.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      descendantIdentifiers.forEach(id => found.add(id.getText()));
    }
  
    const parameters = method.getParameters().reverse();
    parameters.forEach(p => {
      const id = p.getName();
      if (!found.has(id)) {
        (method as MethodType).insertStatements(0, `void(${id});`);
      }
    });
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
