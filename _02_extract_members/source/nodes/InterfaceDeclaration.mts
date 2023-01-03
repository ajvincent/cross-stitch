import ts from "ts-morph";

export default function getInterfaceNodeArray(
  node: ts.InterfaceDeclaration
) : ts.InterfaceDeclaration[]
{
  const interfaceArray = node.getSymbolOrThrow().getDeclarations();
  if (!isInterfaceArray(interfaceArray))
    throw new Error("assertion failure: we should get only interface declarations");

  return interfaceArray;
}

function isInterfaceArray(nodes: ts.Node[]) : nodes is ts.InterfaceDeclaration[]
{
  return (
    (nodes.length > 1) &&
    nodes.every(node => ts.Node.isInterfaceDeclaration(node))
  );
}
