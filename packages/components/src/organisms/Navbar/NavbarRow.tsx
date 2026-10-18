import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useContext, useMemo } from "react";
import { Container } from "../../atoms/Container";
import styles from "./Navbar.module.css";
import type { NavbarRowProps, NavbarSize } from "./Navbar.types";
import { NavbarRowContext, NavbarRowIndexContext, useNavbarContext } from "./NavbarContext";

export const rowSizeClass: Record<NavbarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: undefined,
  lg: styles.sizeLg,
};

/**
 * One band of the bar: a courtesy strip, the row with the logo and the search field, a row of categories. Every row starts from the
 * bar's `variant`, `size` and `contained` and can set its own; `sticky={false}` lets a leading row scroll away while the rest of a
 * sticky bar stays. All the rows are inside the one `<header>`, so the page has one banner however many bands the header has.
 *
 * Without any rows the bar draws its parts as one row, so a single-row bar needs none of this.
 */
export const NavbarRow = forwardRef<HTMLDivElement, NavbarRowProps>(
  ({ variant, size, contained, sticky = true, className, children, ...props }, ref) => {
    const bar = useNavbarContext("Navbar.Row");
    const index = useContext(NavbarRowIndexContext);
    const rowVariant = variant ?? bar.variant;
    const rowSize = size ?? bar.size;
    const rowContained = contained ?? bar.contained;
    const rowContext = useMemo(() => ({ size: rowSize }), [rowSize]);
    const content = (
      <>
        {children}
        {bar.menuButtonRow === index && bar.autoMenuButton}
      </>
    );

    return (
      <NavbarRowContext.Provider value={rowContext}>
        <div
          {...props}
          ref={ref}
          data-scroll-away={sticky ? undefined : ""}
          className={cx(styles.row, styles[rowVariant], rowSizeClass[rowSize], className)}
        >
          {rowContained ? (
            <Container className={styles.inner}>{content}</Container>
          ) : (
            <div className={cx(styles.inner, styles.plainInner)}>{content}</div>
          )}
        </div>
      </NavbarRowContext.Provider>
    );
  },
);
NavbarRow.displayName = "Navbar.Row";
