import { CodeBlockWriter } from "ts-morph";
import { PrinterKind } from "../source/PrinterKind.mjs";
import { TypeBranchClass } from "../source/TypeBranch.mjs";
import {
  Root,
  StringWrapper,
} from "../exports.mjs";

const WriterOptions = Object.freeze({
  indentNumberOfSpaces: 2,
});

describe("TypeBranchClass", () => {
  class Vanilla extends TypeBranchClass
  {
    readonly minTypeArgumentCount = 1;
    readonly maxTypeArgumentCount = 2;

    readonly printerKind = PrinterKind.SPECS_ONLY;

    print(writer: CodeBlockWriter) : void
    {
      this.assertReadyToPrint();
      this.forEachChildPrint(writer, " + ");
    }
  }

  let printer: Vanilla;
  let writer: CodeBlockWriter;
  beforeEach(() => {
    printer = new Vanilla;
    writer = new CodeBlockWriter(WriterOptions);
  });

  it("is not initially ready with a minimum type argument count greater than zero", () => {
    expect(printer.isReady).toBe(false);

    expect(
      () => printer.print(writer)
    ).toThrowError("This type builder is not ready!");
  });

  function writeString(value: string, asQuoted: boolean) : string
  {
    const specWriter = new CodeBlockWriter(WriterOptions);
    const stringPrinter = new StringWrapper(value, asQuoted);
    stringPrinter.print(specWriter);
    return specWriter.toString();
  }

  it("adds literals as the user provides them", () => {
    const expected = writeString("foo", false);
    printer.addLiteral("foo");

    expect(printer.isReady).toBe(true);
    expect(printer.typeArguments.length).toBe(1);
    expect(printer.typeArguments[0]).toBeInstanceOf(StringWrapper);
    expect(printer.typeArguments[0].isAttached).toBe(true);

    printer.print(writer);
    expect(writer.toString()).toBe(expected);
  });

  it("adds numbers as the user provides them", () => {
    const expected = writeString("15", false);
    printer.addNumeric(15);

    expect(printer.isReady).toBe(true);
    expect(printer.typeArguments.length).toBe(1);
    expect(printer.typeArguments[0]).toBeInstanceOf(StringWrapper);
    expect(printer.typeArguments[0].isAttached).toBe(true);

    printer.print(writer);
    expect(writer.toString()).toBe(expected);
  });

  it("adds strings as the user provides them", () => {
    const expected = writeString("foo", true);
    printer.addString("foo");

    expect(printer.isReady).toBe(true);
    expect(printer.typeArguments.length).toBe(1);
    expect(printer.typeArguments[0]).toBeInstanceOf(StringWrapper);
    expect(printer.typeArguments[0].isAttached).toBe(true);

    printer.print(writer);
    expect(writer.toString()).toBe(expected);
  });

  it("adds child type printers and marks them attached", () => {
    const childPrinter = new StringWrapper("foo", true);
    printer.addTypePrinter(childPrinter);

    expect(childPrinter.isAttached).toBe(true);
    expect(printer.typeArguments.length).toBe(1);
    expect(printer.typeArguments[0]).toBe(childPrinter);
  });

  it("rejects adding child type printers which are not ready", () => {
    const childPrinter = new Vanilla;

    expect(
      () => printer.addTypePrinter(childPrinter)
    ).toThrowError("printer is not ready to be attached");
  });

  it("rejects adding child type printers which are not ready", () => {
    const childPrinter = new Vanilla;
    childPrinter.addLiteral("foo");
    childPrinter.markAttached();

    expect(
      () => printer.addTypePrinter(childPrinter)
    ).toThrowError("printer is already attached");
  });

  it("rejects adding Root printers as children", () => {
    const childPrinter = new Root;
    expect(
      () => printer.addTypePrinter(childPrinter)
    ).toThrowError("Root printers may never be children of other printers");
  });

  it("rejects adding child type printers once the printer is attached", () => {
    printer.addString("foo");

    printer.markAttached();
    expect(
      () => printer.addString("bar")
    ).toThrowError("This printer is attached to another already and may not take additional children!");
  });

  it("allows multiple type arguments up to its maxTypeArgumentCount", () => {
    const expected = writeString("foo + bar", false);

    printer.addLiteral("foo");
    printer.addLiteral("bar");
    expect(printer.isReady).toBe(true);

    expect(printer.typeArguments.length).toBe(2);
    expect(printer.typeArguments[0]).toBeInstanceOf(StringWrapper);
    expect(printer.typeArguments[0].isAttached).toBe(true);
    expect(printer.typeArguments[1]).toBeInstanceOf(StringWrapper);
    expect(printer.typeArguments[1].isAttached).toBe(true);

    expect(
      () => printer.addLiteral("wop")
    ).toThrowError("Maximum type argument count reached!");

    expect(printer.isReady).toBe(true);
    expect(printer.typeArguments.length).toBe(2);

    printer.print(writer);
    expect(writer.toString()).toBe(expected);
  });
});
