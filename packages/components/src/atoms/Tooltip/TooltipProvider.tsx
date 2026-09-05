import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { TooltipProviderPresenceContext } from "./TooltipProviderContext";
import type { TooltipProviderProps } from "./TooltipProvider.types";

/**
 * Wraps a subtree so every `Tooltip` inside it shares one hover-delay/
 * skip-delay timing instead of each managing its own in isolation.
 * Optional — a standalone `Tooltip` already works with zero setup; this
 * only matters once a page has more than one and moving between them
 * should feel instant after the first, not re-delay every time (see
 * `skipDelayDuration`). Place it once, as high as makes sense for the
 * tooltips that should share timing — typically near the app root,
 * alongside `ThemeProvider`.
 *
 * @example
 * ```tsx
 * <TooltipProvider>
 *   <Toolbar>
 *     <Tooltip content="Bold">
 *       <IconButton icon={BoldIcon} aria-label="Bold" />
 *     </Tooltip>
 *     <Tooltip content="Italic">
 *       <IconButton icon={ItalicIcon} aria-label="Italic" />
 *     </Tooltip>
 *   </Toolbar>
 * </TooltipProvider>
 * ```
 */
export function TooltipProvider({
  children,
  delayDuration = 400,
  skipDelayDuration = 300,
  disableHoverableContent = false,
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
    >
      <TooltipProviderPresenceContext.Provider value={true}>
        {children}
      </TooltipProviderPresenceContext.Provider>
    </TooltipPrimitive.Provider>
  );
}
