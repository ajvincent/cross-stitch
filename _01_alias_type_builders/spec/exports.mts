import { CodeBlockWriter } from "ts-morph";

import {
  Intersection,
  Root,
  Union,
} from "../source/exports.mjs";

const WriterOptions = Object.freeze({
  indentNumberOfSpaces: 2,
});

describe("AliasTypeBuilders, exports:", () => {
  let writer: CodeBlockWriter;
  beforeEach(() => {
    writer = new CodeBlockWriter(WriterOptions);
  });

  it("Intersection prints at least two types, enclosed in parentheses and joined by ampersands", () => {
    const printer = new Intersection;
    printer.addLiteral("foo");
    printer.addLiteral("bar");

    printer.print(writer);
    expect(writer.toString()).toBe(`(foo & bar)`);
  });

  it("Root asserts it is ready to print before printing a value", () => {
    const printer = new Root;
    expect(
      () => printer.print(writer)
    ).toThrowError("This type builder is not ready!");
  });

  it("Union prints at least two types, enclosed in parentheses and joined by ampersands", () => {
    const printer = new Union;
    printer.addLiteral("foo");
    printer.addLiteral("bar");

    printer.print(writer);
    expect(writer.toString()).toBe(`(foo | bar)`);
  });
});
