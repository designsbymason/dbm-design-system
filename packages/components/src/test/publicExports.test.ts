import * as primitives from "@dbm-design-system/primitives";
import { describe, expect, it } from "vitest";
import * as library from "../index";

// What a consumer who installs only `@dbm-design-system/components` can import from it.
describe("the components package's entry", () => {
  it("re-exports usePersistentDismiss, the same function the primitives package defines", () => {
    expect(library.usePersistentDismiss).toBe(primitives.usePersistentDismiss);
  });
});
