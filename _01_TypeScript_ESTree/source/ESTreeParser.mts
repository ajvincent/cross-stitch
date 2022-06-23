/**
 * Move along, nothing to see here.
 */

/* XXX ajvincent
npm install "@typescript-eslint/parser" to get the scope manager for free.

return parser.parseForESLint(code, options) will return
{ ast, scopeManager }
 */
import {
  parseForESLint,
  ParserOptions,
} from "@typescript-eslint/parser";

const DEFAULT_PARSE_OPTIONS: ParserOptions = {
  errorOnUnknownASTType: false,
  loc: true,
  range: true
};

export type ASTAndScopeManager = Pick<ReturnType<typeof parseForESLint>, "ast" | "scopeManager">

export default function ESTreeParser(
  contents: string,
  parseOptionsOverride: Partial<ParserOptions> = {}
) : ASTAndScopeManager
{
  const options = {};
  Object.assign(options, DEFAULT_PARSE_OPTIONS);
  Object.assign(options, parseOptionsOverride);

  const {ast, scopeManager} = parseForESLint(
    contents,
    options
  );
  return {ast, scopeManager};
}
