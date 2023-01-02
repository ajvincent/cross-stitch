import { CodeBlockWriter } from "ts-morph";

import {
  IndexedAccess,
  Intersection,
  Root,
  StringWrapper,
  TypeArgumented,
  Union,
} from "../exports.mjs";

const WriterOptions = Object.freeze({
  indentNumberOfSpaces: 2,
});

describe("AliasTypeBuilders, exports:", () => {
  let writer: CodeBlockWriter;
  beforeEach(() => {
    writer = new CodeBlockWriter(WriterOptions);
  });

  describe("IndexedAccess", () => {
    it("prints the object type, an opening square bracket, the index type and a closing square bracket", () => {
      const objectType = new StringWrapper("foo", false);
      const printer = new IndexedAccess(objectType);

      expect(objectType.isAttached).toBe(true);

      printer.addLiteral("bar");

      printer.print(writer);
      expect(writer.toString()).toBe(`foo[bar]`);
    });

    it("requires the object type be ready", () => {
      const objectType = new Intersection;
      expect(
        () => new IndexedAccess(objectType)
      ).toThrowError("object type is not ready");
    });

    it("requires the object type not be attached", () => {
      const objectType = new StringWrapper("foo", false);
      objectType.markAttached();

      expect(
        () => new IndexedAccess(objectType)
      ).toThrowError("object type is already attached");
    });
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

  describe("StringWrapper", () => {
    it("can write ordinary literals", () => {
      const foo = new StringWrapper(`foo`, false);
      foo.print(writer);
      expect(writer.toString()).toBe(`foo`);
  
      expect(foo.isAttached).toBe(false);
    });
  
    it("can write ordinary strings", () => {
      const foo = new StringWrapper(`foo`, true);
      foo.print(writer);
      expect(writer.toString()).toBe(`"foo"`);
  
      expect(foo.isAttached).toBe(false);
    });
  
    it("can write strings with quotes", () => {
      const foo = new StringWrapper(`"foo"`, true);
      foo.print(writer);
      expect(writer.toString()).toBe(`"\\"foo\\""`);
  
      expect(foo.isAttached).toBe(false);
    });
  });

  describe("TypeArguments", () => {
    it("prints the object type, a less-than sign, the child types joined by commas, and a greater-than sigh", () => {
      const objectType = new StringWrapper("foo", false);
      const printer = new TypeArgumented(objectType);

      expect(objectType.isAttached).toBe(true);

      printer.addLiteral("bar");
      printer.addLiteral("wop");

      printer.print(writer);
      expect(writer.toString()).toBe(`foo<bar, wop>`);
    });

    it("requires the object type be ready", () => {
      const objectType = new Intersection;
      expect(
        () => new TypeArgumented(objectType)
      ).toThrowError("object type is not ready");
    });

    it("requires the object type not be attached", () => {
      const objectType = new StringWrapper("foo", false);
      objectType.markAttached();

      expect(
        () => new TypeArgumented(objectType)
      ).toThrowError("object type is already attached");
    });
  });

  it("Union prints at least two types, enclosed in parentheses and joined by ampersands", () => {
    const printer = new Union;
    printer.addLiteral("foo");
    printer.addLiteral("bar");

    printer.print(writer);
    expect(writer.toString()).toBe(`(foo | bar)`);
  });
});
