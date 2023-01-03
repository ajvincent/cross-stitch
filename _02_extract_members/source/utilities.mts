import ts from "ts-morph";

export type InterfaceOrTypeAlias =
  ts.InterfaceDeclaration |
  ts.TypeAliasDeclaration;
