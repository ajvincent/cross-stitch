# TypeScript parsing and traversal utilities

For parsing, I rely on [`"@typescript-eslint/typescript-estree"`](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/typescript-estree) to build an abstract syntax tree (AST).  [ESTreeParser.mts](source/ESTreeParser.mts) populates this.

Traversal is actually less complicated.  There are three parts to an in-order traversal: an enter trap, a visit-children-recursively step, and a leave trap.  Enter and leave are a pair:  you must call leave if you call enter.  This leads to four possibilites for each node we visit, which I define as an enum I call [`Decision`](source/DecideEnumTraversal.mts).

| Enter and leave | Visit children                 | Decision            |
|-----------------|--------------------------------|---------------------|
| Yes             | If the enter trap returns true | Accept              |
| Yes             | No                             | RejectChildren      |
| Yes             | If the enter trap returns true | RejectGrandchildren |
|                 | but exclude grandchildren      |                     |
| No              | Yes                            | Skip                |
| No              | No                             | Reject              |

Each AST node has a `type` property, which is a an element of a `AST_NODE_TYPES` enum, and a string.  These properties mean we can decide _before traversal begins_ what node types we _might_ want to call the enter/leave traps on, and which types we want to visit children of.  This is the purpose of the [`DecideEnumTraversal`](source/DecideEnumTraversal.mts) class and its `static buildTypeDecider()` method.

The actual traversal I implement via the [`ESTreeTraversal`](source/ESTreeTraversal.mts) class.  Its constructor requires an AST from `ESTreeParser` and a `DecideEnumTraversal` which has a decision on all its node types.  It drives a traversal pass via its public `traverseEnterAndLeave` method, which takes an object implementing two methods:

```typescript
export interface ESTreeEnterLeave
{
  enter(n: TSNode) : boolean;
  leave(n: TSNode) : void;
}
```

For all enter/leave traps, I recommend basing implementations on [`ESTreeEnterLeaveBase`](source/ESTreeEnterLeaveBase.mts) or [`ESTreeErrorUnregistered`](source/ESTreeErrorUnregistered.mts).  

`ESTreeEnterLeaveBase` exports a base class with two abstract methods, `unregisterEnter()` and `unregisterLeave()`, which - after the filtering by `DecideEnumTraversal` I intend for unimplemented types - you can use to _catch_ nodes you didn't implement traps for.  This is why `enter()` and `leave()` for subclasses of `ESTreeEnterLeaveBase` should `return super.enter(n)` and `return super.leave(n)` if they haven't returned something else first.

`ESTreeErrorUnregistered` implements `ESTreeEnterLeaveBase` with a post-traversal method, `analyze(): void`, which lets you check for node types you missed (and throws for them).

`ESTreeNodeToScope` provides a function, `mapNodesToScopes()`, to get a `WeakMap<TSNode, Scope>` for every node in an AST.

There are two utilities this module provides for convenience:

- [`ESTreeLogger`](source/ESTreeLogger.mts) provides a way to log the structure of the AST to the console.
- [`IsIdentifier`](source/IsIdentifier.mts) provides a simple test for whether a string is an identifier.
