// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;

export type PropertyKey = string | symbol;

// A key for derived classes to use.  A symbol to prevent conflicts with existing types.
export const INVOKE_SYMBOL = Symbol("protected invoke");

