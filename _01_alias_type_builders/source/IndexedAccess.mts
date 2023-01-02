import { CodeBlockWriter } from "ts-morph";

import { PrinterKind } from "./PrinterKind.mjs";
import { TypeBranchClass } from "./TypeBranch.mjs";
import { TypePrinterClass } from "./TypePrinter.mjs";

export default class IndexedAccess
extends TypeBranchClass
{
  readonly printerKind = PrinterKind.IndexedAccess;

  readonly minTypeArgumentCount = 1;
  readonly maxTypeArgumentCount = 1;

  readonly #objectType: TypePrinterClass;

  /**
   * Representing an IndexedAccessType node in ts-morph.
   * @param objectType - The object type printer.
   */
  constructor(objectType: TypePrinterClass)
  {
    super();
    if (!objectType.isReady)
      throw new Error("object type is not ready");
    if (objectType.isAttached)
      throw new Error("object type is already attached");
    this.#objectType = objectType;
    objectType.markAttached();
  }

  print(writer: CodeBlockWriter): void
  {
    this.assertReadyToPrint();
    this.#objectType.print(writer);
    writer.write("[");
    this.forEachChildPrint(writer);
    writer.write("]");
  }
}
