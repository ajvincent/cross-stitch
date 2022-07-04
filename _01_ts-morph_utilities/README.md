# ts-morph utilities

## TypeToClass Checklist

- [x] Type alias to literal
- [x] Interface split across two declarations
- [x] Multiple types on implementation
- [x] Partial type implementation
- [x] Imported & re-exported type
- [x] Properties of a type as "not implemented" getter
- [ ] Properties of a type in a constructor
- [ ] Intersection of a referenced type
- [ ] Never key in type
- [ ] Union of a referenced type (should be illegal)
- [ ] Union in arguments of a method (should be legal)
- [ ] Parameterized type
- [ ] Mapped type
- [ ] Conditional type
- [ ] Symbol key in type
- [ ] Discriminated union type (map + conditional)
