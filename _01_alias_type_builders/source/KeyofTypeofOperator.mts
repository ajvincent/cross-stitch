import { CodeBlockWriter } from "ts-morph";

import { PrinterKind } from "./PrinterKind.mjs";
import { TypeBranchClass } from "./TypeBranch.mjs";

export default class KeyofTypeofOperator
extends TypeBranchClass
{
  readonly printerKind = PrinterKind.KeyofTypeof;

  readonly minTypeArgumentCount = 1;
  readonly maxTypeArgumentCount = 1;

  readonly #isKeyOf: boolean;
  readonly #isTypeOf: boolean;

  constructor(isKeyOf: boolean, isTypeOf: boolean)
  {
    super();

    if (!isKeyOf && !isTypeOf)
      throw new Error("You must set isKeyOf or isTypeOf");

    this.#isKeyOf = isKeyOf
    this.#isTypeOf = isTypeOf;
  }

  print(writer: CodeBlockWriter): void
  {
    this.assertReadyToPrint();

    if (this.#isKeyOf)
      writer.write("keyof ");
    if (this.#isTypeOf)
      writer.write("typeof ");

    this.forEachChildPrint(writer);
  }
}
