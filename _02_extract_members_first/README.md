# ExtractMembers

We need to navigate the AST of nodes from `ts-morph` to construct our members list for `TypeToClass` to iterate over.

Now, at first glance this seems very much like reinventing the wheel... and it really is, because the following code should work:

```typescript
TypeLiteral.getType().getProperties();
```

Unfortunately, [ECMAScript symbol keys don't show up in the properties list](https://github.com/dsherret/ts-morph/issues/1365).  So, because there's so many different ways a symbol key can appear in the AST... I have to cover as many of those possibilities as I can.  Which means reinventing the wheel as far as
generating signatures for properties, methods, etc.

This is likely to be buggy.  Which is why I have to write lots of tests.  I will _gladly_ throw away all this code if someone shows me a way to fix the missing-symbol-keys problem.
