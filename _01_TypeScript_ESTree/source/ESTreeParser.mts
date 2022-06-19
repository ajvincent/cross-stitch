/**
 * Move along, nothing to see here.
 */

import TSESTree, {
  AST, TSESTreeOptions
} from "@typescript-eslint/typescript-estree";

const DEFAULT_PARSE_OPTIONS: TSESTreeOptions = {
  errorOnUnknownASTType: false,
  loc: true,
  range: true
};

export default function ESTreeParser(
  contents: string,
  parseOptionsOverride: Partial<TSESTreeOptions> = {},
) : AST<TSESTreeOptions>
{
  const options = {};
  Object.assign(options, DEFAULT_PARSE_OPTIONS);
  Object.assign(options, parseOptionsOverride);

  return TSESTree.parse(
    contents,
    options
  );
}
