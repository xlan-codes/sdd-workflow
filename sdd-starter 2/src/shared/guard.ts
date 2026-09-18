/** Tiny utilities — cross-context, pure, dependency-free. */

/** Runtime invariant with type narrowing; throws on violation. */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invariant violation: ${message}`);
}

/** Exhaustiveness guard for discriminated unions (compile-time safety net). */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
