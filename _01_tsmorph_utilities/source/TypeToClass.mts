import ts from "ts-morph";

type TypeToClassCallback = (
  classNode: ts.ClassDeclaration,
  propertyName: string | symbol,
  propertyNode: ts.MethodDeclaration | ts.PropertyDeclaration,
  baseNode: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
) => boolean;

function resolveToPropertiesNode(
  destFile: ts.SourceFile,
  baseNode: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
) : ts.InterfaceDeclaration | ts.TypeAliasDeclaration
{
  const structure = baseNode.getStructure();
  if (ts.Structure.isInterface(structure))
  {
    if (structure.methods?.length || structure.properties?.length)
      return baseNode;
    throw new Error("unexpected interface without methods or properties");
  }

  const kids = baseNode.getChildren();
  if (kids.some(kid => ts.Node.isMethodSignature(kid) || ts.Node.isPropertySignature(kid)))
    return baseNode;

  const typeText = baseNode.getType().getText(baseNode);
  const FakeTypeAlias: ts.TypeAliasDeclaration = destFile.addTypeAlias({
    name: "__FakeType__",
    type: typeText
  });

  return FakeTypeAlias;
}

function voidUnusedParameters(
  targetClass: ts.ClassDeclaration,
  propertyName: string
) : void
{
  const method = targetClass.getInstanceMethod(propertyName);
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
      method.insertStatements(0, `void(${id});`);
    }
  });
}

export default async function TypeToClass(
  className: string,
  destFile: ts.SourceFile,
  baseNodes: (ts.InterfaceDeclaration | ts.TypeAliasDeclaration)[],
  callback: TypeToClassCallback,
) : Promise<ts.ClassDeclaration>
{
  if (!baseNodes.every(baseNode => baseNode.isExported()))
    throw new Error("Base nodes must be exported for the destination file to import it!");

  if (destFile.getStatements().length > 0)
    throw new Error("Destination file must be empty!");

  const targetClass = destFile.addClass({
    name: className,
    isDefaultExport: true,
    isExported: true,
  });

  baseNodes.forEach(baseNode => {
    const resolvedNode = resolveToPropertiesNode(destFile, baseNode);

    const acceptedProperties = new Set<string>;
    const allProperties = new Set<string>;

    const resolvedTypeNode = ts.Node.isTypeAliasDeclaration(resolvedNode) ? resolvedNode.getTypeNodeOrThrow() : resolvedNode;
    resolvedTypeNode.forEachChild(child => {
      const isMethod = ts.Node.isMethodSignature(child);
      const isProperty = ts.Node.isPropertySignature(child);
      if (!isMethod && !isProperty) {
        return;
      }

      // XXX ajvincent test the symbol case!
      const name = child.getName();
      allProperties.add(name);

      let propertyNode: ts.MethodDeclaration | ts.PropertyDeclaration
      if (isMethod) {
        const childStructure = child.getStructure();
        propertyNode = targetClass.addMethod({
          name,
          parameters: childStructure.parameters,
          typeParameters: childStructure.typeParameters,
          returnType: childStructure.returnType,
        });
      }
      else {
        propertyNode = targetClass.addProperty({
          name
        });
      }

      if (callback(targetClass, name, propertyNode, baseNode)) {
        acceptedProperties.add(name);
        voidUnusedParameters(targetClass, name);
      }
      else {
        propertyNode.remove();
      }
    });

    if (acceptedProperties.size === 0)
      throw new Error(`For type ${baseNode.getName()}, no properties or methods were accepted!`);
    if (acceptedProperties.size === allProperties.size)
      targetClass.addImplements(baseNode.getName());
    else {
      targetClass.addImplements(`Pick<${baseNode.getName()}, ${
        Array.from(acceptedProperties.values()).map(v => `"${v}"`).join(" | ")
      }>`);
    }

    if (resolvedNode !== baseNode)
      resolvedNode.remove();
  });

  destFile.fixMissingImports();

  destFile.insertStatements(0, `
/* This is generated code.  Do not edit directly.
   Instead, edit the types this file imports.
*/
`.trim());
  await destFile.save();

  return targetClass;
}
