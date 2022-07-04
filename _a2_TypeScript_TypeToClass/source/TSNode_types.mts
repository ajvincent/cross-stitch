import TSESTree from "@typescript-eslint/typescript-estree";

type TSTypeAliasDeclaration = TSESTree.TSESTree.TSTypeAliasDeclaration;
type TSInterfaceDeclaration = TSESTree.TSESTree.TSInterfaceDeclaration;

export type TSTypeOrInterfaceDeclaration
  = TSTypeAliasDeclaration | TSInterfaceDeclaration;
