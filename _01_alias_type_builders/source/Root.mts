import { CodeBlockWriter } from "ts-morph";

import { TypeBranchClass } from "./TypeBranch.mjs";
import { PrinterKind } from "./PrinterKind.mjs";

/**
 * @remarks
 *
 * This class is a distinct root type for passing into TypeToClass.
 *
 * I keep going back and forth on whether this class is really necessary.
 */
export default class Root
extends TypeBranchClass
{
  readonly printerKind = PrinterKind.Root;

  readonly minTypeArgumentCount = 1;
  readonly maxTypeArgumentCount = 1;

  print(writer: CodeBlockWriter): void
  {
    this.assertReadyToPrint();
    this.forEachChildPrint(writer);
  }
}
