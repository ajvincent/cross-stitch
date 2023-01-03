import ts from "ts-morph";
import type { InterfaceOrTypeAlias } from "../utilities.mjs";
import type { Identifier } from "../../../_01_alias_type_builders/exports.mjs";

export function getAliasOrInterfacesById(
  sourceFile: ts.SourceFile,
  ref: Identifier
) : InterfaceOrTypeAlias
{
  let node: InterfaceOrTypeAlias | undefined;
  const id = ref.value;

  node = sourceFile.getTypeAlias(id);
  if (!node)
    node = sourceFile.getInterface(id);

  if (!node)
    throw new Error(`No interface or type alias found for type name "${id}"!`);

  if (!node.isExported())
    throw new Error("Base node must be exported for the destination file to import it!");

  return node;
}
