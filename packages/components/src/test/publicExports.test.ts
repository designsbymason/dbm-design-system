import * as primitives from "@dbm-design-system/primitives";
import type * as primitiveTypes from "@dbm-design-system/primitives";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as library from "../index";
import type { Breakpoint, Responsive, SpaceValue } from "../index";

// What a consumer who installs only `@dbm-design-system/components` can import from it.
describe("the components package's entry", () => {
  it("re-exports usePersistentDismiss, the same function the primitives package defines", () => {
    expect(library.usePersistentDismiss).toBe(primitives.usePersistentDismiss);
  });

  // Checked by the typechecker (`tsc`), not at runtime: the entry names the very types `primitives` defines.
  it("re-exports the helper types that components' public props use", () => {
    expectTypeOf<Breakpoint>().toEqualTypeOf<primitiveTypes.Breakpoint>();
    expectTypeOf<SpaceValue>().toEqualTypeOf<primitiveTypes.SpaceValue>();
    expectTypeOf<Responsive<number>>().toEqualTypeOf<primitiveTypes.Responsive<number>>();
  });
});
