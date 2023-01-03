/* This is useful for auto-complete where you have a union of types, and you
want to see what the properties of the union are.
*/
export type ResolveTypeUnion<T> = Pick<T, keyof T>;

/** When you want to see the keys of an item. */
export type ResolveKeys<T> = Exclude<keyof T, never>;
