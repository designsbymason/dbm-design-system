import { createContext, useContext } from "react";
import type { FieldLabelSize } from "../atoms/FieldLabel";

/**
 * What a `FieldGroup` hands down to the `FormField`s (and nested `FieldGroup`s) inside it: the group's
 * `disabled` and `size`, as defaults a field's own props can still override. `null` outside a group, so a
 * `FormField` on its own is unchanged. Lives in `internal/` because two molecules share it and an atom is not
 * involved — it is not part of the public API.
 */
export interface FieldGroupSettings {
  disabled: boolean;
  size: FieldLabelSize | undefined;
}

const FieldGroupContext = createContext<FieldGroupSettings | null>(null);

export const FieldGroupProvider = FieldGroupContext.Provider;

export function useFieldGroup(): FieldGroupSettings | null {
  return useContext(FieldGroupContext);
}
