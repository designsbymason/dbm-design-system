import { createContext } from "react";
import type { CheckboxSize } from "./Checkbox.types";

/**
 * Internal coordination signal — the size `CheckboxGroup` wants its
 * `Checkbox` children to inherit when they don't set their own `size`
 * explicitly. `undefined` (the default) means no inherited size is being
 * provided, either because there's no `CheckboxGroup` ancestor at all, or
 * because the group itself didn't set a `size`. Not part of either
 * component's public API, not exported from the package barrel.
 *
 * Mirrors `Radio`'s own `RadioGroupSizeContext` exactly — kept as its own
 * context, separate from `CheckboxGroupContext` (the real value/coordination
 * state), for the same reason: an additive, independently-scoped channel
 * rather than folding an orthogonal concern into the main context.
 */
export const CheckboxGroupSizeContext = createContext<
  CheckboxSize | undefined
>(undefined);
