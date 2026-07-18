import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { forwardRef } from "react";
import styles from "./Link.module.css";
import type { LinkProps } from "./Link.types";

const EXTERNAL_HREF_PATTERN = /^(https?:)?\/\//i;

/**
 * A styled anchor with automatic external-link affordances (new tab,
 * `rel="noopener noreferrer"`, a trailing icon) and `asChild` support for
 * composing with routers (e.g. `<Link asChild><RouterLink to="/x" /></Link>`).
 *
 * @example
 * ```tsx
 * <Link href="/docs">Docs</Link>
 * <Link href="https://example.com">External</Link>
 * <Link asChild href="/docs"><RouterLink to="/docs">Docs</RouterLink></Link>
 * ```
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, external, asChild = false, className, children, target, rel, ...props }, ref) => {
    const isExternal = external ?? EXTERNAL_HREF_PATTERN.test(href);
    const Component = asChild ? Slot : "a";

    return (
      <Component
        ref={ref}
        href={href}
        className={cx(styles.root, className)}
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
              <ArrowSquareOutIcon aria-hidden="true" className={styles.icon} size="1em" />
            )}
          </>
        )}
      </Component>
    );
  },
);

Link.displayName = "Link";
