import { CodeBlockWriter } from "ts-morph";

import { TypeBranchClass } from "./TypeBranch.mjs";
import { PrinterKind } from "./PrinterKind.mjs";

export default class Union
extends TypeBranchClass
{
  readonly printerKind = PrinterKind.Union;

  readonly minTypeArgumentCount = 2;
  readonly maxTypeArgumentCount = undefined;

  print(writer: CodeBlockWriter): void
  {
    this.assertReadyToPrint();
    writer.write("(");
    this.forEachChildPrint(writer, " | ");
    writer.write(")");
  }
}
