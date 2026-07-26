import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import styles from "./Tooltip.module.css";
import type { TooltipProps } from "./Tooltip.types";

/**
 * A short, non-interactive hint shown on hover/focus of its trigger, built
 * on Radix Tooltip. Wraps its own `Provider`, so no app-level setup is
 * needed. Unlike most of this system's components, `Tooltip` has no single
 * root DOM node of its own to forward a ref to — its trigger is an
 * arbitrary child element and its content renders in a portal — so it
 * takes no `ref` prop, matching Radix's own `Tooltip.Root`.
 *
 * @example
 * ```tsx
 * <Tooltip content="Save your changes">
 *   <Button>Save</Button>
 * </Tooltip>
 * <Tooltip content="Delete" side="bottom">
 *   <IconButton icon={TrashIcon} aria-label="Delete" />
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 400,
  open,
  defaultOpen,
  onOpenChange,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            // Radix's `sideOffset` is a JS pixel number, not CSS — it can't
            // reference a custom property directly. 8 matches
            // `--dbm-space-2` (0.5rem), keeping the gap token-consistent
            // even though this one value can't be a literal var().
            sideOffset={8}
            className={styles.content}
          >
            {content}
            <TooltipPrimitive.Arrow className={styles.arrow} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
