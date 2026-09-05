import { cx } from "@dbm-design-system/primitives";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { forwardRef, useRef } from "react";
import styles from "./Collapse.module.css";
import type { CollapseProps } from "./Collapse.types";

/**
 * A simple animated expand/collapse region built on Radix Collapsible —
 * the building block `Accordion` composes for each of its items. With
 * `trigger`, it's a self-contained disclosure; without it, `open` can be
 * driven entirely externally (what `Accordion` does with its own trigger
 * UI). `ref` forwards to the root element.
 *
 * @example
 * ```tsx
 * <Collapse trigger={<Button>Toggle details</Button>}>
 *   <Text>Hidden content revealed on toggle.</Text>
 * </Collapse>
 * <Collapse open={isOpen}>
 *   <Text>Driven by external state, no built-in trigger.</Text>
 * </Collapse>
 * <Collapse orientation="horizontal" open={isOpen}>
 *   <Sidebar />
 * </Collapse>
 * <Collapse asChild open={isOpen}>
 *   <li>A collapsible list item, no extra wrapper <div>.</li>
 * </Collapse>
 * ```
 */
export const Collapse = forwardRef<HTMLDivElement, CollapseProps>(
  (
    {
      open,
      defaultOpen,
      onOpenChange,
      disabled = false,
      trigger,
      orientation = "vertical",
      asChild = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const hasWarnedDisabledNoTriggerRef = useRef(false);
    const hasWarnedAsChildWithTriggerRef = useRef(false);

    if (process.env.NODE_ENV !== "production") {
      if (disabled && !trigger && !hasWarnedDisabledNoTriggerRef.current) {
        hasWarnedDisabledNoTriggerRef.current = true;
        console.warn(
          "Collapse: `disabled` has no effect without a `trigger` — there's no built-in interactive element for it to disable. If `open` is driven externally, disable it at that external control instead.",
        );
      }
      if (asChild && trigger && !hasWarnedAsChildWithTriggerRef.current) {
        hasWarnedAsChildWithTriggerRef.current = true;
        console.warn(
          "Collapse: `asChild` and `trigger` can't be combined — the root element would need two children (the trigger and the content region) where Radix `Slot` requires exactly one. `trigger` wins; `asChild` is ignored.",
        );
      }
    }

    // Only actually applied without `trigger` (see the warning above) —
    // with one, Root would have two children (the Trigger wrapper and the
    // Content region), and Slot requires exactly one.
    const effectiveAsChild = asChild && !trigger;

    // With a trigger, Root's two children (the Trigger button and the
    // Content region) are both inline-level by default (Button itself is
    // `display: inline-flex`; `.horizontal` content is `inline-block`) —
    // normal block flow lays inline-level children out in a row only until
    // they run out of horizontal space, then wraps the overflow onto a new
    // line exactly like text would. For `orientation="vertical"` this never
    // matters (Content there is a plain block box, which always starts its
    // own line regardless), but for `orientation="horizontal"` the content
    // region's own animated width grows from 0 up to its full measured
    // width — confirmed live: it fits beside the trigger while still
    // narrow, then wraps onto a line below it partway through the *same*
    // expand animation the instant the combined width no longer fits,
    // reading as the whole thing suddenly flipping from a horizontal to a
    // vertical layout. Forcing a row-flex layout on Root exactly in this
    // combination guarantees the two children never wrap onto separate
    // lines — the content region instead overflows the container's own
    // width where necessary, which is the correct trade-off for a
    // sidebar-style reveal (it pushes outward, it doesn't reflow).
    const rootLayoutHorizontal = orientation === "horizontal" && !!trigger;

    // `asChild` propagates to *both* Root and Content, not just Root —
    // Root's own `asChild` alone would only merge Root's own wrapper away
    // and onto Content's element, leaving Content's own `<div>` still
    // wrapping the real child underneath it (confirmed live: the rendered
    // output was `<div (root+content props)><section>…</section></div>`,
    // not the bare `<section>` a consumer asking for "no wrapper" would
    // expect). Chaining `asChild` through both is a well-established Radix
    // pattern for exactly this — each layer's `Slot` merges its own props
    // onto its single child in turn, so the *user's* own element ends up
    // as the one real DOM node carrying every layer's props/classes.
    const content = (
      <CollapsiblePrimitive.Content
        asChild={effectiveAsChild}
        className={cx(
          styles.content,
          orientation === "horizontal" ? styles.horizontal : styles.vertical,
        )}
      >
        {children}
      </CollapsiblePrimitive.Content>
    );

    return (
      <CollapsiblePrimitive.Root
        ref={ref}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        disabled={disabled}
        asChild={effectiveAsChild}
        className={cx(
          styles.root,
          rootLayoutHorizontal && styles.rootRow,
          className,
        )}
        {...props}
      >
        {/*
         * Deliberately not `{trigger && <Trigger .../>}{content}` as two
         * sibling expressions — JSX collects those into a real children
         * *array* (`[false, content]` when `trigger` is absent, since
         * `&&` on a falsy `trigger` still leaves a literal `false` in that
         * array). Radix's own `Slot` (what `asChild` uses under the hood)
         * calls `React.Children.only`, which throws on anything but a
         * true single element — an array of length 2 fails that check
         * even though one of the two entries is `false` and renders as
         * nothing (confirmed live: `effectiveAsChild` mode crashed with
         * "Expected a single React element child" every time, not just
         * when combined with `trigger`, until this was written as one
         * ternary expression instead of two adjacent ones).
         */}
        {trigger ? (
          <>
            <CollapsiblePrimitive.Trigger asChild>
              {trigger}
            </CollapsiblePrimitive.Trigger>
            {content}
          </>
        ) : (
          content
        )}
      </CollapsiblePrimitive.Root>
    );
  },
);

Collapse.displayName = "Collapse";
