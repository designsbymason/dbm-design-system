import { createContext } from "react";
import type { RadioSize } from "./Radio.types";

/**
 * Internal coordination signal — the size `RadioGroup` wants its `Radio`
 * children to inherit when they don't set their own `size` explicitly.
 * `undefined` (the default) means no inherited size is being provided,
 * either because there's no `RadioGroup` ancestor at all, or because the
 * group itself didn't set a `size`. Not part of either component's public
 * API, not exported from the package barrel.
 *
 * Kept as its own context, separate from `RadioGroupContext` (the plain
 * "am I grouped at all" signal) — a new, additive coordination channel
 * rather than changing that one's existing, already-tested boolean
 * contract.
 */
export const RadioGroupSizeContext = createContext<RadioSize | undefined>(
  undefined,
);
