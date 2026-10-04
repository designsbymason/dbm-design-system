import { createContext, useContext } from "react";

/**
 * What `FieldGroup` tells its `FieldGroup.Item`s about the grid they sit in: how many columns it has right now
 * (already resolved against the current breakpoint), or `null` when the group is not a grid. Private to this
 * folder — `Item` reads it to clamp its `span`, and nothing outside needs it.
 */
const FieldGroupLayoutContext = createContext<number | null>(null);

export const FieldGroupLayoutProvider = FieldGroupLayoutContext.Provider;

export function useFieldGroupColumns(): number | null {
  return useContext(FieldGroupLayoutContext);
}
