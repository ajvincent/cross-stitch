import ts from "ts-morph";
import {
  type getChildNodeList,
} from "./childLists.mjs";

const getUnknownNodes: getChildNodeList<ts.TypeNode> = (node) => {
  return {
    fieldNodes: [],
    unresolvedTypeNodes: [node],
    indexSignatures: [],
    mappedTypes: [],
    constructorSignatures: [],
    callSignatures: [],
  };
}

export default getUnknownNodes;
