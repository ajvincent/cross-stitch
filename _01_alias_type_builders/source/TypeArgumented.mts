import { CodeBlockWriter } from "ts-morph";

import { PrinterKind } from "./PrinterKind.mjs";
import { TypeBranchClass } from "./TypeBranch.mjs";
import { TypePrinterClass } from "./TypePrinter.mjs";

export default class TypeArgumented
extends TypeBranchClass
{
  readonly printerKind = PrinterKind.TypeArgumented;

  readonly minTypeArgumentCount = 1;
  readonly maxTypeArgumentCount = undefined;

  /** The object type printer. */
  readonly objectType: TypePrinterClass;

  /**
   * Representing type arguments on a type reference.
   * @param objectType - The object type printer.
   */
  constructor(objectType: TypePrinterClass)
  {
    super();
    if (!objectType.isReady)
      throw new Error("object type is not ready");
    if (objectType.isAttached)
      throw new Error("object type is already attached");
    this.objectType = objectType;
    objectType.markAttached();
  }

  print(writer: CodeBlockWriter): void
  {
    this.assertReadyToPrint();
    this.objectType.print(writer);
    writer.write("<");
    this.forEachChildPrint(writer, ", ");
    writer.write(">");
  }
}
