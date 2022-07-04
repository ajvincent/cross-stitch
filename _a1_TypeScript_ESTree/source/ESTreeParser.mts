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
  range: true,
  sourceType: "module",
  ecmaVersion: "latest",
};

export type ParseForESLintResult = ReturnType<typeof parseForESLint>;

export default function ESTreeParser(
  contents: string,
  parseOptionsOverride: Partial<ParserOptions> = {}
) : ParseForESLintResult
{
  const options = {};
  Object.assign(options, DEFAULT_PARSE_OPTIONS);
  Object.assign(options, parseOptionsOverride);

  return parseForESLint(
    contents,
    options
  );
}
