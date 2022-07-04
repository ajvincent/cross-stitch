import ts from "ts-morph";

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
    this.#targetClass = destFile.addClass({
      name: className,
      isDefaultExport: true,
      isExported: true,
    });
    this.#callback = callback;

    destFile.insertStatements(0, `
/* This is generated code.  Do not edit directly.
   Instead, edit the types this file imports.
*/
    `.trim());
  }

  /**
   * Add a type from a source file.  This will invoke the user's callback for members of that type.
   *
   * @param sourceFile - The source file.
   * @param typeName   - The type to extract.
   */
  addType(
    sourceFile: ts.SourceFile,
    typeName: string
  ) : void
  {
    const typeNodes = this.#extractTypeNodes(sourceFile, typeName);

    const acceptedProperties = new Set<string>;
    const allProperties = new Set<string>;
  
    typeNodes.forEach(
      typeNode => this.#processTypeNode(
        typeNode,
        acceptedProperties,
        allProperties
      )
    );

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
  #extractTypeNodes(
    sourceFile: ts.SourceFile,
    typeName: string,
  ) : InterfaceOrTypeAlias[]
  {
    let firstBaseNode: InterfaceOrTypeAlias | undefined;
    firstBaseNode = sourceFile.getTypeAlias(typeName);
    if (firstBaseNode)
      return [firstBaseNode];
  
    firstBaseNode = sourceFile.getInterface(typeName);
  
    if (!firstBaseNode)
      throw new Error(`No interface or type alias found for type name "${typeName}"!`);
  
    const symbol = firstBaseNode.getType().getSymbolOrThrow();
    const nodes = symbol.getDeclarations();
    if (!nodes.every(
      d => ts.Node.isInterfaceDeclaration(d) || ts.Node.isTypeAliasDeclaration(d)
    ))
      throw new Error("Unexpected declaration");
  
    const declarations = nodes as InterfaceOrTypeAlias[];
    if (!declarations.every(baseNode => baseNode.isExported()))
      throw new Error("Base nodes must be exported for the destination file to import it!");
  
    return declarations;
  }

  /**
   * Iterate over the fields of a type alias or interface.
   *
   * @param typeNode           - The type alias or interface.
   * @param acceptedProperties - A running total of accepted property names.
   * @param allProperties      - A running total of all found property names.
   */
  #processTypeNode(
    typeNode: InterfaceOrTypeAlias,
    acceptedProperties: Set<string>,
    allProperties: Set<string>
  ) : void
  {
    const resolvedNode = this.#resolveToPropertiesNode(typeNode);
  
    const resolvedTypeNode = ts.Node.isTypeAliasDeclaration(resolvedNode)
      ? resolvedNode.getTypeNodeOrThrow()
      : resolvedNode;

    resolvedTypeNode.forEachChild(child => this.#addProperty(
      typeNode, child, acceptedProperties, allProperties,
    ));
  
    if (resolvedNode !== typeNode)
      resolvedNode.remove();
  }

  /**
   * Get a fully-resolved interface or type alias node from ts-morph.
   *
   * @param typeNode - The original type node.
   * @returns The equivalent type node.
   */
  #resolveToPropertiesNode(
    typeNode: InterfaceOrTypeAlias,
  ) : InterfaceOrTypeAlias
  {
    const structure = typeNode.getStructure();
    if (ts.Structure.isInterface(structure))
    {
      if (structure.methods?.length || structure.properties?.length)
        return typeNode;
      throw new Error("unexpected interface without methods or properties");
    }
  
    const kids = typeNode.getChildren();
    if (kids.some(kid => ts.Node.isMethodSignature(kid) || ts.Node.isPropertySignature(kid)))
      return typeNode;
  
    const typeText = typeNode.getType().getText(typeNode);
    const FakeTypeAlias: ts.TypeAliasDeclaration = this.#destFile.addTypeAlias({
      name: "__FakeType__",
      type: typeText
    });
  
    return FakeTypeAlias;
  }

  /**
   * Add a field to the target class and invoke the user's callback.
   *
   * @param typeNode           - The type node we're iterating over.
   * @param child              - The current child of the type node.
   * @param acceptedProperties - A running total of accepted property names.
   * @param allProperties      - A running total of all found property names.
   * @returns 
   */
  #addProperty(
    typeNode: InterfaceOrTypeAlias,
    child: ts.Node,
    acceptedProperties: Set<string>,
    allProperties: Set<string>,
  ) : void
  {
    const isMethod   = ts.Node.isMethodSignature(child);
    const isProperty = ts.Node.isPropertySignature(child);
    if (!isMethod && !isProperty) {
      return;
    }
  
    // XXX ajvincent test the symbol case!
    const name = child.getName();
    allProperties.add(name);
  
    let propertyNode: FieldDeclaration

    if (isMethod) {
      const childStructure = child.getStructure();
      propertyNode = this.#targetClass.addMethod({
        name,
        parameters: childStructure.parameters,
        typeParameters: childStructure.typeParameters,
        returnType: childStructure.returnType,
      });
    }
    else {
      const childStructure = child.getStructure();
      propertyNode = this.#targetClass.addProperty({
        name,
        type: childStructure.type
      });
    }

    if (this.#callback(this.#targetClass, name, propertyNode, typeNode)) {
      acceptedProperties.add(name);
      this.#voidUnusedParameters(name);
    }
    else {
      propertyNode.remove();
    }
  }

  /**
   * Ensure unused parameters pass eslint by adding void() statements.
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
  }
}
