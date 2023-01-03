import type { CodeBlockWriter } from "ts-morph";

import { PrinterKind } from "./PrinterKind.mjs";
import { TypePrinterClass } from "./TypePrinter.mjs";

export default class Identifier extends TypePrinterClass
{
  readonly printerKind = PrinterKind.Identifier;

  readonly #value: string;
  constructor(value: string)
  {
    super();
    this.#value = value;
  }

  readonly isReady = true;

  print(writer: CodeBlockWriter) : void
  {
    // No need to call assertReadyToPrint(): this.isReady is true.
    writer.write(this.#value);
  }
}
Object.freeze(Identifier.prototype);
Object.freeze(Identifier);
