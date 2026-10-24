import { MagnifyingGlassIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import { forwardRef, useContext, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { IconButton } from "../../atoms/IconButton";
import { SearchInput } from "../../molecules/SearchInput";
import { Drawer } from "../Drawer";
import styles from "./Navbar.module.css";
import type { NavbarSearchProps } from "./Navbar.types";
import { NavbarRowContext, useNavbarContext } from "./NavbarContext";

const collapseClass: Record<NonNullable<NavbarSearchProps["collapseBelow"]>, string | undefined> = {
  sm: styles.searchCollapseSm,
  md: styles.searchCollapseMd,
  lg: styles.searchCollapseLg,
  xl: styles.searchCollapseXl,
  "2xl": styles.searchCollapse2xl,
  "3xl": styles.searchCollapse3xl,
  never: undefined,
};

/**
 * The bar's search field: a `role="search"` landmark around a `SearchInput` that takes the room between its neighbours (never
 * narrower or wider than the `navbar.search-*` tokens). Below `collapseBelow` the field leaves the bar for a search button, which
 * opens it in a sheet from the top of the screen, so a phone isn't left with a squeezed field and the tab order stays the one the
 * bar is written in. It takes the field's own props (`onSearch`, `debounceMs`, `value`...): the bar's field and the sheet's are two
 * inputs, so pass `value` and `onChange` to keep them in step.
 */
export const NavbarSearch = forwardRef<HTMLDivElement, NavbarSearchProps>(
  (
    {
      collapseBelow = "md",
      closeOnSubmit = true,
      column: _column,
      size,
      buttonVariant = "ghost",
      buttonTone,
      buttonSize,
      "aria-label": ariaLabel,
      id,
      className,
      style,
      "data-testid": testId,
      onKeyDown,
      ...inputProps
    },
    ref,
  ) => {
    const { labels, dir, menuContainer } = useNavbarContext("Navbar.Search");
    const row = useContext(NavbarRowContext);
    const fieldSize = size ?? row?.size ?? "md";
    const name = ariaLabel ?? labels.search;
    const [open, setOpen] = useState(false);
    const sheetField = useRef<HTMLInputElement | null>(null);

    const closeOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (closeOnSubmit && event.key === "Enter") setOpen(false);
    };

    return (
      <div
        ref={ref}
        role="search"
        aria-label={name}
        data-testid={testId}
        className={cx(styles.search, collapseClass[collapseBelow], className)}
        style={style}
      >
        <SearchInput {...inputProps} id={id} size={fieldSize} aria-label={name} onKeyDown={onKeyDown} className={styles.searchField} />
        {collapseBelow !== "never" && (
          <Drawer open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
              <IconButton
                icon={MagnifyingGlassIcon}
                variant={buttonVariant}
                tone={buttonTone}
                size={buttonSize ?? fieldSize}
                aria-label={name}
                className={styles.searchButton}
              />
            </Drawer.Trigger>
            <Drawer.Content
              side="top"
              size="xs"
              showHandle={false}
              dir={dir}
              container={menuContainer}
              labels={{ close: labels.close }}
              initialFocus={sheetField}
              aria-describedby={undefined}
            >
              <Drawer.Header>
                <Drawer.Title size="lg">{name}</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <div role="search" aria-label={name}>
                  <SearchInput
                    {...inputProps}
                    ref={sheetField}
                    size="md"
                    aria-label={name}
                    onKeyDown={closeOnEnter}
                    className={styles.sheetField}
                  />
                </div>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer>
        )}
      </div>
    );
  },
);
NavbarSearch.displayName = "Navbar.Search";
