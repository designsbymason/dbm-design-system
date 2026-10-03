import { cx, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { forwardRef, useEffect } from "react";
import { OverlayArrow } from "../../internal/OverlayArrow/OverlayArrow";
import styles from "./HoverCard.module.css";
import type { HoverCardContentProps, HoverCardProps, HoverCardTriggerProps } from "./HoverCard.types";

/**
 * A rich preview that opens when the pointer rests on a trigger (or
 * keyboard focus lands on it) and closes when it leaves — a profile card on
 * a username, a summary on a link — built on Radix HoverCard. Unlike
 * `Popover`, nothing is clicked: the card is *supplementary*. It is for
 * sighted pointer and keyboard users only: it never opens on a touch screen,
 * and it is not reachable by a screen reader's own navigation (Radix takes
 * every focusable element inside it out of the tab order). So the trigger
 * must lead somewhere on its own (a real link), and the card must never be
 * the only way to reach anything. For content that has to be interactive or
 * dependable, use `Popover`; for a short plain-text hint, `Tooltip`.
 *
 * A compound component: compose `HoverCard.Trigger` and `HoverCard.Content`
 * inside `HoverCard` itself. `HoverCard` renders no DOM element of its own —
 * a plain context provider, matching Radix's own `HoverCard.Root` — so it
 * takes no `ref`/`className`/`style`/`id`/`data-testid`; those apply to
 * `HoverCard.Trigger` and `HoverCard.Content`, each of which forwards its ref.
 *
 * Does not expose Radix's `forceMount`, `sticky`, `arrowPadding` or
 * `updatePositionStrategy`, matching `Popover`'s own scope.
 *
 * @example
 * ```tsx
 * <HoverCard>
 *   <HoverCard.Trigger asChild>
 *     <Link href="/people/jane">@jane</Link>
 *   </HoverCard.Trigger>
 *   <HoverCard.Content>
 *     <Text weight="semibold">Jane Doe</Text>
 *     <Text size="sm">Design systems engineer.</Text>
 *   </HoverCard.Content>
 * </HoverCard>
 * ```
 */
function HoverCardRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
  openDelay = 300,
  closeDelay = 300,
}: HoverCardProps) {
  return (
    <HoverCardPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      openDelay={openDelay}
      closeDelay={closeDelay}
    >
      {children}
    </HoverCardPrimitive.Root>
  );
}

/**
 * The element the card is a preview of. Renders a native `<a>` by default
 * (Radix's own element) — pass `asChild` to use this system's `Link`
 * instead. Give it an `href`: an `<a>` without one is not focusable, so the
 * card could not be opened from the keyboard.
 */
const HoverCardTrigger = forwardRef<HTMLAnchorElement, HoverCardTriggerProps>(
  ({ asChild = false, className, href, tabIndex, onTouchStart, ...props }, ref) => {
    // `asChild` can't be checked: the child may already be focusable.
    const isUnreachable = !asChild && href === undefined && tabIndex === undefined;
    useEffect(() => {
      if (process.env.NODE_ENV === "production" || !isUnreachable) return;
      console.warn(
        "HoverCard.Trigger: an <a> with no `href` or `tabIndex` can't be focused, so a keyboard user could never open the card. Pass an `href` (the card previews where it leads), or use `asChild` with a focusable element.",
      );
    }, [isUnreachable]);

    return (
      <HoverCardPrimitive.Trigger
        ref={ref}
        asChild={asChild}
        className={asChild ? className : cx(styles.trigger, className)}
        href={href}
        tabIndex={tabIndex}
        onTouchStart={(event) => {
          onTouchStart?.(event);
          // Radix's trigger ends its own `onTouchStart` with `event.preventDefault()`,
          // but React listens for `touchstart` passively, so the browser ignores the
          // call and logs "Unable to preventDefault inside passive event listener" on
          // every touch (a tap still follows the link). Radix runs its handler only
          // while `event.defaultPrevented` is false, so marking the event handled
          // here skips it without ever calling `preventDefault()`. Nothing is lost:
          // the call never did anything, and a card never opens on touch.
          (event as { defaultPrevented: boolean }).defaultPrevented = true;
        }}
        {...props}
      />
    );
  },
);
HoverCardTrigger.displayName = "HoverCard.Trigger";

/**
 * The floating card itself — Radix renders it in a `Portal` appended to
 * `document.body` by default, outside the trigger's own tree. It has no
 * `role` and no accessible name: it is a preview, not a dialog.
 */
const HoverCardContent = forwardRef<HTMLDivElement, HoverCardContentProps>(
  (
    {
      side = "top",
      align = "center",
      sideOffset = 8,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      hideArrow = false,
      container,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    // Radix's `side` drives a real positioning computation, not a CSS
    // cascade, so a responsive map has to resolve to one value in JS first.
    const resolvedSide = useResolvedResponsiveValue(side, "top");

    return (
      <HoverCardPrimitive.Portal container={container}>
        <HoverCardPrimitive.Content
          ref={ref}
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          className={cx(styles.content, className)}
          {...props}
        >
          {children}
          {!hideArrow && (
            <HoverCardPrimitive.Arrow asChild>
              <OverlayArrow />
            </HoverCardPrimitive.Arrow>
          )}
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    );
  },
);
HoverCardContent.displayName = "HoverCard.Content";

type HoverCardComponent = typeof HoverCardRoot & {
  Trigger: typeof HoverCardTrigger;
  Content: typeof HoverCardContent;
};

export const HoverCard: HoverCardComponent = Object.assign(HoverCardRoot, {
  Trigger: HoverCardTrigger,
  Content: HoverCardContent,
});
