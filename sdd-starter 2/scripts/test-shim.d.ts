/**
 * Minimal test globals so `npm run typecheck:noinstall` works with ZERO
 * dependencies installed (no @types/jest yet). Never included by tsconfig.json.
 */
declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare const expect: (actual: unknown) => {
  toEqual(expected: unknown): void;
  toThrow(expected?: unknown): void;
};
