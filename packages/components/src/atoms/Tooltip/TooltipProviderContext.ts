import { createContext } from "react";

/**
 * Read by `Tooltip` to detect an ambient `TooltipProvider` somewhere above
 * it. When present, `Tooltip` skips wrapping its own isolated Radix
 * `Provider` and relies on the shared one instead — the only way
 * `TooltipProvider`'s `skipDelayDuration` can actually take effect across
 * separate `Tooltip` instances, since Radix's own skip-delay timing lives
 * on `Provider`, not `Root`. Defaults to `false` so a standalone `Tooltip`
 * (no `TooltipProvider` anywhere in the tree) keeps working with zero
 * setup, wrapping its own `Provider` as it always has.
 */
export const TooltipProviderPresenceContext = createContext(false);
