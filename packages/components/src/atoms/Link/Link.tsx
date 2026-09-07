import { ArrowSquareOutIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import type { MouseEvent } from "react";
import { Icon } from "../Icon";
import { VisuallyHidden } from "../VisuallyHidden";
import styles from "./Link.module.css";
import type { LinkProps, LinkUnderline } from "./Link.types";

const EXTERNAL_HREF_PATTERN = /^(https?:)?\/\//i;

const underlineClass: Record<LinkUnderline, string | undefined> = {
  always: styles.underlineAlways,
  hover: styles.underlineHover,
  none: styles.underlineNone,
};

/**
 * A styled anchor with automatic external-link affordances (new tab,
 * `rel="noopener noreferrer"`, a trailing icon, and a visually-hidden
 * "(opens in a new tab)" cue for screen reader users) and `asChild` support
 * for composing with routers (e.g. `<Link asChild><RouterLink to="/x" /></Link>`).
 *
 * `underline` defaults to `"always"` — links inline within body text need
 * to stay distinguishable from surrounding text by more than color alone
 * for keyboard/touch users, who never trigger `:hover`. Use `"none"` (or
 * `"hover"`) for links with no surrounding flowing text to confuse them
 * with, e.g. navigation.
 *
 * `disabled` uses `aria-disabled` plus a click-handler guard rather than a
 * native `disabled` attribute — `<a>` has no such attribute regardless of
 * `asChild` (unlike `Button`, which can rely on a real `<button>` in its
 * own default, non-`asChild` case). The link stays focusable and its
 * `href` stays present, matching WAI-ARIA APG guidance for `aria-disabled`
 * (unlike native `disabled`, which removes an element from the tab order).
 *
 * @example
 * ```tsx
 * <Link href="/docs">Docs</Link>
 * <Link href="https://example.com">External</Link>
 * <Link href="/nav-item" underline="none">Nav item</Link>
 * <Link href="/docs" disabled>Unavailable right now</Link>
 * <Link asChild href="/docs"><RouterLink to="/docs">Docs</RouterLink></Link>
 * ```
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      external,
      underline = "always",
      asChild = false,
      disabled = false,
      className,
      children,
      target,
      rel,
      ...props
    },
    ref,
  ) => {
    const isExternal = external ?? EXTERNAL_HREF_PATTERN.test(href);
    const Component = asChild ? Slot : "a";

    // Capture-phase, not `onClick` — this must run and call
    // `preventDefault`/`stopPropagation` *before* any bubble-phase handler
    // gets a chance to run, including a caller's own `onClick` (plain mode)
    // and, critically, a `Slot`-composed child's own `onClick` in `asChild`
    // mode. Radix `Slot` composes bubble-phase `onClick` handlers with the
    // slotted child's own handler running *first*, then Link's — so a
    // bubble-phase guard here would only block Link's own default
    // navigation, not any side effect the child's own click handler (e.g. a
    // router's navigation call) already ran before Link's guard got a turn.
    // Verified empirically, not assumed: a bubble-phase `onClick` guard let
    // a slotted child's own `onClick` fire even with `disabled` set; a
    // capture-phase one blocks it, confirmed for both the `Slot`-composed
    // case and a plain `onClick` on the same native element.
    const handleClickCapture = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    return (
      <Component
        {...props}
        // Applied last (after `...props`) so none of these can be silently
        // overridden by a same-named prop the caller passes — including
        // `aria-disabled`, which TypeScript's JSX checker permits on any
        // component regardless of whether it's declared in its prop type
        // (the same ordering rule already fixed on Button/Skeleton/
        // ProgressBar/etc. — see `05-component-api-conventions.md` §3).
        ref={ref}
        href={href}
        target={target ?? (isExternal ? "_blank" : undefined)}
        rel={rel ?? (isExternal ? "noopener noreferrer" : undefined)}
        aria-disabled={disabled || undefined}
        onClickCapture={handleClickCapture}
        className={cx(styles.root, underlineClass[underline], disabled && styles.disabled, className)}
      >
        {asChild ? (
          children
        ) : (
          <>
            {children}
            {isExternal && (
              <>
                <Icon icon={ArrowSquareOutIcon} size="xs" className={styles.icon} />
                <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
              </>
            )}
          </>
        )}
      </Component>
    );
  },
);

Link.displayName = "Link";
