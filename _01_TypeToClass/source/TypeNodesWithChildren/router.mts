import ts from "ts-morph";
import {
  type getChildNodeList,
} from "./childLists.mjs";

import TypeLiteralChildLists from "./TypeLiteral.mjs";
import TypeReferenceChildLists from "./TypeReference.mjs";
import UnknownTypeNodeLists from "./UnknownTypeNode.mjs";

const getChildLists: getChildNodeList<ts.TypeNode> = (node) => {
  if (ts.Node.isTypeLiteral(node))
    return TypeLiteralChildLists(node);
  if (ts.Node.isTypeReference(node))
    return TypeReferenceChildLists(node);

  return UnknownTypeNodeLists(node);
};
export default getChildLists;
