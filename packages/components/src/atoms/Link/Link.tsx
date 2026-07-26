import { ArrowSquareOutIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";
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
 * @example
 * ```tsx
 * <Link href="/docs">Docs</Link>
 * <Link href="https://example.com">External</Link>
 * <Link href="/nav-item" underline="none">Nav item</Link>
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

    return (
      <Component
        ref={ref}
        href={href}
        className={cx(styles.root, underlineClass[underline], className)}
        target={target ?? (isExternal ? "_blank" : undefined)}
        rel={rel ?? (isExternal ? "noopener noreferrer" : undefined)}
        {...props}
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
