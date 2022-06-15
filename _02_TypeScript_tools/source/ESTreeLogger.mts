import { Node as TSNode } from "@typescript-eslint/types/dist/generated/ast-spec.js";
import ESTreeBase from "./ESTreeBase.mjs";

export class ESTreeLogger extends ESTreeBase
{
  #console: Console;
  #counter = 0;

  constructor(pathToFile: string, c: Console = console) {
    super(pathToFile);
    this.#console = c;
  }

  unregisteredEnter(node: TSNode): boolean
  {
    this.#console.log(`${"  ".repeat(this.#counter)}enter ${node.type}`);
    this.#counter++;
    return true;
  }

  unregisteredLeave(node: TSNode): void
  {
    this.#counter--;
    this.#console.log(`${"  ".repeat(this.#counter)}leave ${node.type}`);
  }
}
