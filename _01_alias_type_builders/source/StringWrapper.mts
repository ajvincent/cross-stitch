import type { CodeBlockWriter } from "ts-morph";

import { PrinterKind } from "./PrinterKind.mjs";
import { TypePrinterClass } from "./TypePrinter.mjs";

export default class StringWrapper extends TypePrinterClass
{
  readonly printerKind = PrinterKind.StringWrapper;

  readonly #value: string;
  readonly #asQuoted: boolean;
  constructor(value: string, asQuoted: boolean)
  {
    super();
    this.#value = value;
    this.#asQuoted = asQuoted;
    Object.freeze(this);
  }

  readonly isReady = true;

  print(writer: CodeBlockWriter) : void
  {
    // No need to call assertReadyToPrint(): this.isReady is true.

    if (this.#asQuoted)
      writer.quote(this.#value);
    else
      writer.write(this.#value);
  }
}
Object.freeze(StringWrapper.prototype);
Object.freeze(StringWrapper);
