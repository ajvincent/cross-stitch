import { CodeBlockWriter } from "ts-morph";

import { TypeBranchClass } from "./TypeBranch.mjs";
import { PrinterKind } from "./PrinterKind.mjs";

export default class Intersection
extends TypeBranchClass
{
  readonly printerKind = PrinterKind.Intersection;

  readonly minTypeArgumentCount = 2;
  readonly maxTypeArgumentCount = undefined;

  print(writer: CodeBlockWriter): void
  {
    this.assertReadyToPrint();
    writer.write("(");
    this.forEachChildPrint(writer, " & ");
    writer.write(")");
  }
}
