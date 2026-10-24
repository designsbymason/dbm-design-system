import { cx } from "@dbm-system/utils";
import { forwardRef, useContext, useMemo } from "react";
import type { CSSProperties } from "react";
import { Container } from "../../atoms/Container";
import styles from "./Navbar.module.css";
import type { NavbarColumn, NavbarRowProps, NavbarSize } from "./Navbar.types";
import { groupByColumn } from "./NavbarColumns";
import { NavbarRowContext, NavbarRowIndexContext, useNavbarContext } from "./NavbarContext";

export const rowSizeClass: Record<NavbarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: undefined,
  lg: styles.sizeLg,
};

const columnsClass: Record<NonNullable<NavbarRowProps["columnsBelow"]>, string | undefined> = {
  sm: styles.columnsSm,
  md: styles.columnsMd,
  lg: styles.columnsLg,
  xl: styles.columnsXl,
  "2xl": styles.columns2xl,
  "3xl": styles.columns3xl,
};

const columnGroupClass: Record<NavbarColumn, string | undefined> = {
  start: styles.columnStart,
  center: styles.columnCenter,
  end: styles.columnEnd,
};

/**
 * One band of the bar: a courtesy strip, the row with the logo and the search field, a row of categories. Every row starts from the
 * bar's `variant`, `size` and `contained` and can set its own; `sticky={false}` lets a leading row scroll away while the rest of a
 * sticky bar stays. All the rows are inside the one `<header>`, so the page has one banner however many bands the header has.
 *
 * Without any rows the bar draws its parts as one row, so a single-row bar needs none of this.
 */
export const NavbarRow = forwardRef<HTMLDivElement, NavbarRowProps>(
  ({ variant, size, linkSize, contained, columns, columnsBelow = "md", sticky = true, className, children, ...props }, ref) => {
    const bar = useNavbarContext("Navbar.Row");
    const index = useContext(NavbarRowIndexContext);
    const rowVariant = variant ?? bar.variant;
    const rowSize = size ?? bar.size;
    const rowContained = contained ?? bar.contained;
    const rowLinkSize = linkSize ?? bar.linkSize;
    const rowContext = useMemo(() => ({ size: rowSize, linkSize: rowLinkSize }), [rowSize, rowLinkSize]);
    const autoMenuButton = bar.menuButtonRow === index ? bar.autoMenuButton : null;
    const content =
      columns === undefined ? (
        <>
          {children}
          {autoMenuButton}
        </>
      ) : (
        groupByColumn(children, autoMenuButton).map((group) => (
          <div key={group.column} className={cx(styles.column, columnGroupClass[group.column])}>
            {group.items}
          </div>
        ))
      );
    const innerClass = columns === undefined ? undefined : columnsClass[columnsBelow];
    const innerStyle: CSSProperties | undefined =
      columns === undefined || columns === "balanced" ? undefined : ({ "--navbar-columns": columns } as CSSProperties);

    return (
      <NavbarRowContext.Provider value={rowContext}>
        <div
          {...props}
          ref={ref}
          data-scroll-away={sticky ? undefined : ""}
          className={cx(styles.row, styles[rowVariant], rowSizeClass[rowSize], className)}
        >
          {rowContained ? (
            <Container className={cx(styles.inner, innerClass)} style={innerStyle}>
              {content}
            </Container>
          ) : (
            <div className={cx(styles.inner, styles.plainInner, innerClass)} style={innerStyle}>
              {content}
            </div>
          )}
        </div>
      </NavbarRowContext.Provider>
    );
  },
);
NavbarRow.displayName = "Navbar.Row";
