import { CodeBlockWriter } from "ts-morph";
import { PrinterKind } from "../source/PrinterKind.mjs";
import { TypePrinterClass } from "../source/TypePrinter.mjs";

describe("TypePrinterClass", () => {
  class Vanilla extends TypePrinterClass
  {
    readonly printerKind = PrinterKind.SPECS_ONLY;

    isReady: boolean;
  
    constructor() {
      super();
      this.isReady = false;
    }

    print(writer: CodeBlockWriter) : void
    {
      void(writer);
    }
  }

  let printer: Vanilla;
  beforeEach(() => printer = new Vanilla);

  it("initially reports isAttached as false", () => {
    expect(printer.isAttached).toBe(false);
  });

  it("rejects marking attached unless the printer is ready", () => {
    expect(
      () => printer.markAttached()
    ).toThrowError("This type builder is not ready!");

    printer.isReady = true;
    expect(printer.isAttached).toBe(false);

    printer.markAttached();
    expect(printer.isAttached).toBe(true);
  });
});
