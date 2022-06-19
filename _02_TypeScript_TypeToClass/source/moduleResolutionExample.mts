// https://nodejs.org/docs/latest-v16.x/api/module.html#modulecreaterequirefilename
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// https://nodejs.org/docs/latest-v16.x/api/modules.html#requireresolverequest-options
console.log(require.resolve("../fixtures/NumberStringType.mjs"));
console.log(require.resolve("@typescript-eslint/typescript-estree"));
