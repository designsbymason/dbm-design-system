import {
  ArrowSquareOutIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretDownIcon,
  ListIcon,
} from "@dbm-design-system/icons";
import { cx, mergeDefined } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { cloneElement, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties, ElementType, MouseEvent, ReactElement } from "react";
import { Badge } from "../../atoms/Badge";
import type { BadgeProps } from "../../atoms/Badge";
import { Collapse } from "../../atoms/Collapse";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Tooltip } from "../../atoms/Tooltip";
import type { TooltipSide } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Drawer } from "../Drawer";
import { Menu } from "../Menu";
import styles from "./Sidebar.module.css";
import {
  SidebarContext,
  SidebarLevelContext,
  SidebarMenuContext,
  SidebarPanelContext,
  SidebarStateContext,
  defaultLabels,
  useSidebar,
  useSidebarContext,
  useSidebarStateContext,
} from "./SidebarContext";
import type { SidebarContextValue, SidebarStateContextValue } from "./SidebarContext";
import type {
  SidebarCollapseBelow,
  SidebarContentProps,
  SidebarCurrentVariant,
  SidebarFooterProps,
  SidebarGroupProps,
  SidebarHeaderProps,
  SidebarItemProps,
  SidebarMenuButtonProps,
  SidebarNavProps,
  SidebarProps,
  SidebarProviderProps,
  SidebarSectionProps,
  SidebarSeparatorProps,
  SidebarSize,
  SidebarToggleProps,
} from "./Sidebar.types";
import { useSidebarState } from "./useSidebarState";

const EXTERNAL_HREF_PATTERN = /^(https?:)?\/\//i;

/** How many groups may nest before the development warning: deeper than this is a tree, and `Tree` is its own component. */
const MAX_GROUP_DEPTH = 3;

const sizeClass: Record<SidebarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const iconSizeFor: Record<SidebarSize, "sm" | "md"> = { xs: "sm", sm: "sm", md: "md", lg: "md" };

/** The external-link mark and a group's caret, one step below the item's own icon (`icon-size`: 12, 16, 20px), so it reads as a marker beside the label and not as a second icon. */
const externalIconSizeFor: Record<SidebarSize, "xs" | "sm"> = { xs: "xs", sm: "xs", md: "sm", lg: "sm" };

const currentVariantClass: Record<SidebarCurrentVariant, string | undefined> = {
  subtle: undefined,
  bar: styles.currentBar,
  solid: styles.currentSolid,
};

const collapseClass: Record<SidebarCollapseBelow, string | undefined> = {
  sm: styles.collapseSm,
  md: styles.collapseMd,
  lg: styles.collapseLg,
  xl: styles.collapseXl,
  "2xl": styles.collapse2xl,
  "3xl": styles.collapse3xl,
  never: undefined,
};

const toggleClass: Record<SidebarCollapseBelow, string | undefined> = {
  sm: styles.toggleSm,
  md: styles.toggleMd,
  lg: styles.toggleLg,
  xl: styles.toggleXl,
  "2xl": styles.toggle2xl,
  "3xl": styles.toggle3xl,
  never: undefined,
};

const menuButtonClass: Record<SidebarCollapseBelow, string | undefined> = {
  sm: styles.menuButtonSm,
  md: styles.menuButtonMd,
  lg: styles.menuButtonLg,
  xl: styles.menuButtonXl,
  "2xl": styles.menuButton2xl,
  "3xl": styles.menuButton3xl,
  never: styles.menuButtonNever,
};

// The widths the `collapseBelow` steps stand for, the literal values of the breakpoint tokens (a media query can't read a custom
// property). Used only to close the phone panel when the page grows past the step, so it doesn't sit over a sidebar that is back on the page.
const collapseQuery: Record<Exclude<SidebarCollapseBelow, "never">, string> = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
  "2xl": "(min-width: 96rem)",
  "3xl": "(min-width: 120rem)",
};

/** Whether a number of pixels or a CSS length was given, as the length to put in a style. */
function toLength(width: number | string): string {
  return typeof width === "number" ? `${width}px` : width;
}

/**
 * Whether an item has become the current one since it was drawn, and still is: true from the render in which `current` turns on until
 * it turns off, so a marker that grows in plays once and not for an item that was already current when it mounted (a first paint, or the
 * phone panel opening).
 */
function useBecameCurrent(current: boolean): boolean {
  const [previous, setPrevious] = useState(current);
  const [became, setBecame] = useState(false);
  if (previous !== current) {
    setPrevious(current);
    setBecame(current);
  }
  return became;
}

/** The side a rail's tooltip or flyout opens toward: away from the edge the sidebar sits against. */
function useOutwardSide(): Extract<TooltipSide, "left" | "right"> {
  const { side, dir } = useSidebarContext("Sidebar");
  return (side === "start") === (dir === "ltr") ? "right" : "left";
}

/**
 * A page's persistent navigation column: a header, grouped and nested links with a current-page marker, and a footer. It can collapse
 * to a rail of icons (`collapsed`, the `Sidebar.Toggle` button) and, below the `collapseBelow` width, leaves the page for a menu
 * button and a side panel (a `Drawer`), so a phone gets a list it can reach with a thumb and the first paint of a server-rendered
 * page is already right (the switch is a stylesheet's).
 *
 * A compound component, meaning it is made of named sub-parts you compose together: `Sidebar.Header`, `Sidebar.Content` (scrolls on its
 * own) holding `Sidebar.Nav`s, and `Sidebar.Footer`; in a `Sidebar.Nav`, `Sidebar.Section`s (a heading over a list), `Sidebar.Item`s,
 * `Sidebar.Group`s of items (expandable, up to three deep) and `Sidebar.Separator`s; `Sidebar.Toggle` (the rail button) and
 * `Sidebar.MenuButton` (opens the phone panel). It is a plain `<div>`; each `Sidebar.Nav` is a named `<nav>` holding a list, and the
 * current page is `aria-current="page"`, marked by `currentVariant` (`subtle`, `bar` or `solid`) and, with `rounded`, as a pill. Items
 * are ordinary tab stops, not a roving group: this is the disclosure-navigation pattern, not a toolbar or a tree.
 *
 * The same children are drawn on the page and in the phone panel, so give the items no `id`. In the rail an item shows its icon alone,
 * with its text in a tooltip and as its accessible name, and a group opens as a floating `Menu`. When the toggle or menu button sits
 * outside the sidebar (in a `Navbar`), wrap the page in `Sidebar.Provider`, and read the state in your own parts with `useSidebar()`.
 *
 * Does not cover a bar of links across the top (`Navbar`), a data hierarchy with selection (`Tree`), or a whole page layout (a
 * template).
 *
 * @example
 * ```tsx
 * <Sidebar>
 *   <Sidebar.Header>dbM</Sidebar.Header>
 *   <Sidebar.Content>
 *     <Sidebar.Nav>
 *       <Sidebar.Item href="/" icon={HouseIcon} current>Home</Sidebar.Item>
 *       <Sidebar.Group label="Reports" icon={ChartBarIcon}>
 *         <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
 *       </Sidebar.Group>
 *     </Sidebar.Nav>
 *   </Sidebar.Content>
 *   <Sidebar.Footer>
 *     <Sidebar.Toggle />
 *   </Sidebar.Footer>
 * </Sidebar>
 * ```
 */
const SidebarRoot = forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      children,
      variant = "outlined",
      size = "md",
      currentVariant = "subtle",
      rounded = false,
      width,
      side = "start",
      collapsed,
      defaultCollapsed,
      onCollapsedChange,
      collapseBelow: ownCollapseBelow,
      menuOpen,
      defaultMenuOpen,
      onMenuOpenChange,
      onMenuOpenChangeComplete,
      closeMenuOnNavigate = true,
      menuContainer,
      sticky = false,
      stickyOffset = 0,
      dir = "ltr",
      labels,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const parent = useContext(SidebarStateContext);
    const own = useSidebarState({ collapsed, defaultCollapsed, onCollapsedChange, menuOpen, defaultMenuOpen, onMenuOpenChange });
    // Inside a `Sidebar.Provider` the provider holds the state, so the buttons outside the sidebar act on the same one.
    const { state, changeMenu, menuButtonRef } = parent ?? own;
    const collapseBelow = ownCollapseBelow ?? parent?.collapseBelow ?? "md";
    const resolvedLabels = mergeDefined(parent?.labels ?? defaultLabels, labels);
    const railed = state.collapsed;
    const closeMenu = useCallback(() => changeMenu(false, { reason: "close" }), [changeMenu]);

    useEffect(() => {
      if (process.env.NODE_ENV === "production" || parent === null) return;
      if (
        collapsed !== undefined ||
        defaultCollapsed !== undefined ||
        onCollapsedChange !== undefined ||
        menuOpen !== undefined ||
        defaultMenuOpen !== undefined ||
        onMenuOpenChange !== undefined
      ) {
        console.warn(
          "Sidebar: it is inside a `Sidebar.Provider`, which holds the collapsed and open state, so `collapsed`, `defaultCollapsed`, `menuOpen`, `defaultMenuOpen` and their change handlers on the sidebar are ignored. Put them on the provider.",
        );
      }
    });

    // Past the width where the sidebar is back on the page, a panel left open would sit over a column already on show.
    const menuIsOpen = state.menuOpen;
    useEffect(() => {
      if (!menuIsOpen || collapseBelow === "never" || typeof window === "undefined" || !window.matchMedia) return undefined;
      const query = window.matchMedia(collapseQuery[collapseBelow]);
      const handleChange = (event: MediaQueryListEvent) => {
        if (event.matches) closeMenu();
      };
      query.addEventListener("change", handleChange);
      return () => query.removeEventListener("change", handleChange);
    }, [menuIsOpen, collapseBelow, closeMenu]);

    const stateValue = useMemo<SidebarStateContextValue>(
      () => ({ state, changeMenu, collapseBelow, labels: resolvedLabels, menuButtonRef, hasSidebar: true }),
      // `mergeDefined` returns a fresh object each render; its strings are what the value really depends on.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        state,
        changeMenu,
        collapseBelow,
        resolvedLabels.navigation,
        resolvedLabels.collapse,
        resolvedLabels.expand,
        resolvedLabels.menu,
        resolvedLabels.close,
        resolvedLabels.externalLink,
        menuButtonRef,
      ],
    );

    const contextValue = useMemo<SidebarContextValue>(
      () => ({ size, currentVariant, rounded, side, dir, railed, closeMenuOnNavigate, menuContainer, closeMenu }),
      [size, currentVariant, rounded, side, dir, railed, closeMenuOnNavigate, menuContainer, closeMenu],
    );
    // The panel is never a rail, whatever the page's sidebar is.
    const panelContextValue = useMemo<SidebarContextValue>(() => ({ ...contextValue, railed: false }), [contextValue]);

    const rootStyle = {
      ...(width !== undefined ? { "--sidebar-width": toLength(width) } : {}),
      ...(sticky ? { "--sidebar-sticky-offset": `var(--dbm-space-${stickyOffset})` } : {}),
      ...style,
    } as CSSProperties;

    const panelWidth = width !== undefined ? toLength(width) : "var(--dbm-sidebar-width)";

    // The phone panel hands focus back to the menu button that opened it, wherever that button is; it is not the Drawer's own trigger.
    const returnFocus = (event: Event) => {
      const button = menuButtonRef.current;
      if (button?.isConnected) {
        event.preventDefault();
        button.focus();
      }
    };

    return (
      <SidebarStateContext.Provider value={stateValue}>
        <SidebarContext.Provider value={contextValue}>
          <div
            {...props}
            ref={ref}
            dir={dir}
            data-variant={variant}
            data-side={side}
            data-collapsed={railed ? "" : undefined}
            className={cx(
              styles.root,
              sizeClass[size],
              variant === "outlined" && styles.outlined,
              variant === "filled" && styles.filled,
              variant === "ghost" && styles.ghost,
              railed && styles.rail,
              sticky && styles.sticky,
              collapseClass[collapseBelow],
              className,
            )}
            style={rootStyle}
          >
            {children}
          </div>
          {collapseBelow !== "never" && (
            <Drawer open={state.menuOpen} onOpenChange={changeMenu} onOpenChangeComplete={onMenuOpenChangeComplete}>
              <Drawer.Content
                side={side}
                size={panelWidth}
                dir={dir}
                container={menuContainer}
                labels={{ close: resolvedLabels.close }}
                aria-describedby={undefined}
                onCloseAutoFocus={returnFocus}
              >
                <Drawer.Header>
                  <Drawer.Title>{resolvedLabels.menu}</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body className={styles.panelBody}>
                  <SidebarContext.Provider value={panelContextValue}>
                    <SidebarPanelContext.Provider value>
                      <div className={cx(styles.panelRoot, sizeClass[size])}>{children}</div>
                    </SidebarPanelContext.Provider>
                  </SidebarContext.Provider>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer>
          )}
        </SidebarContext.Provider>
      </SidebarStateContext.Provider>
    );
  },
);
SidebarRoot.displayName = "Sidebar";

/**
 * Holds the sidebar's collapsed and open state for a page, so a `Sidebar.Toggle` or `Sidebar.MenuButton` outside the sidebar (in a
 * `Navbar`) acts on it. Optional: a `Sidebar` with no provider holds its own. Wrap the page shell in it, and read the state in your own
 * parts with `useSidebar()`.
 */
function SidebarProvider({ children, collapseBelow = "md", labels, ...stateProps }: SidebarProviderProps) {
  const { state, changeMenu, menuButtonRef } = useSidebarState(stateProps);
  const resolvedLabels = mergeDefined(defaultLabels, labels);
  const value = useMemo<SidebarStateContextValue>(
    () => ({ state, changeMenu, collapseBelow, labels: resolvedLabels, menuButtonRef, hasSidebar: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state,
      changeMenu,
      collapseBelow,
      resolvedLabels.navigation,
      resolvedLabels.collapse,
      resolvedLabels.expand,
      resolvedLabels.menu,
      resolvedLabels.close,
      resolvedLabels.externalLink,
      menuButtonRef,
    ],
  );
  return <SidebarStateContext.Provider value={value}>{children}</SidebarStateContext.Provider>;
}
SidebarProvider.displayName = "Sidebar.Provider";

/** The top of the sidebar: a brand, a workspace switcher. It stays in view above the scrolling content. */
const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.header, className)} />
));
SidebarHeader.displayName = "Sidebar.Header";

/**
 * The middle of the sidebar, which scrolls on its own when its navigation is taller than the room, so the header and footer stay in view.
 * It is the browser's own scrolling, not a scroll area with a part of its own: the items are the focusable things, so the region needs no
 * tab stop of its own, and a label can be cut with an ellipsis against the region's real width. In the phone panel the panel's body
 * scrolls instead.
 */
const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(({ className, ...props }, ref) => {
  const inPanel = useContext(SidebarPanelContext);
  return <div {...props} ref={ref} className={cx(styles.content, inPanel && styles.panelContent, className)} />;
});
SidebarContent.displayName = "Sidebar.Content";

/** The bottom of the sidebar, which stays in view below the scrolling content: an account menu, a help link, the toggle. */
const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.footer, className)} />
));
SidebarFooter.displayName = "Sidebar.Footer";

/**
 * A navigation: a named `<nav>` holding a list of `Sidebar.Item`s, `Sidebar.Group`s, `Sidebar.Section`s and `Sidebar.Separator`s. A
 * sidebar can hold several (a main one and a settings one); give each its own `aria-label` so they are told apart.
 */
const SidebarNav = forwardRef<HTMLElement, SidebarNavProps>(
  ({ children, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const { labels } = useSidebarStateContext("Sidebar.Nav");
    const name = ariaLabelledBy === undefined ? (ariaLabel ?? labels.navigation) : ariaLabel;
    return (
      <nav {...props} ref={ref} aria-label={name} aria-labelledby={ariaLabelledBy} className={cx(styles.nav, className)}>
        {/* `role="list"` and `role="listitem"` are redundant on paper; Safari with VoiceOver drops list semantics under `list-style: none`. */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
        <ul role="list" className={styles.list}>
          {children}
        </ul>
      </nav>
    );
  },
);
SidebarNav.displayName = "Sidebar.Nav";

/**
 * A heading over a list of items. In the rail the heading is hidden (it still names the list) and a line sets the section apart from the
 * one before it.
 */
const SidebarSection = forwardRef<HTMLLIElement, SidebarSectionProps>(({ label, children, className, ...props }, ref) => {
  const headingId = useId();
  return (
    // `role="listitem"` and `role="list"` are redundant on paper; see `Sidebar.Nav`.
    // eslint-disable-next-line jsx-a11y/no-redundant-roles
    <li {...props} ref={ref} role="listitem" className={cx(styles.section, className)}>
      <div id={headingId} className={styles.sectionLabel}>
        {label}
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul role="list" aria-labelledby={headingId} className={styles.list}>
        {children}
      </ul>
    </li>
  );
});
SidebarSection.displayName = "Sidebar.Section";

/** A line between two parts of a list. Decorative: it is not announced. */
const SidebarSeparator = forwardRef<HTMLLIElement, SidebarSeparatorProps>(({ className, ...props }, ref) => (
  <li {...props} ref={ref} aria-hidden="true" className={cx(styles.separator, className)} />
));
SidebarSeparator.displayName = "Sidebar.Separator";

/**
 * One item of the navigation: a link (`href`), or a button when it has none. `current` marks the page the reader is on
 * (`aria-current="page"`); `disabled` blocks the click and keeps the item in the tab order, as `Link` does; `asChild` puts the look on a
 * router's link. It takes an `icon` before its text (all the rail shows), a `badge` after it and an `external` mark (worked out from
 * `href`). In the rail its text moves to a tooltip and stays its accessible name. Inside a rail group's floating menu it is an item of
 * that menu.
 */
const SidebarItem = forwardRef<HTMLElement, SidebarItemProps>(
  (
    {
      current = false,
      disabled = false,
      asChild = false,
      icon,
      badge,
      external,
      href,
      target,
      rel,
      className,
      onClick,
      onClickCapture,
      children,
      ...props
    },
    ref,
  ) => {
    const { size, currentVariant, rounded, railed, closeMenuOnNavigate, closeMenu } = useSidebarContext("Sidebar.Item");
    const { labels } = useSidebarStateContext("Sidebar.Item");
    const inPanel = useContext(SidebarPanelContext);
    const closeFlyout = useContext(SidebarMenuContext);
    const inMenu = closeFlyout !== null;
    const tooltipSide = useOutwardSide();
    const grows = useBecameCurrent(current);
    const isLink = href !== undefined;
    const isExternal = !asChild && isLink && (external ?? EXTERNAL_HREF_PATTERN.test(href));
    // One of three elements chosen at run time; `ElementType` keeps the anchor and button attribute sets from fighting over `type`.
    const Component: ElementType = asChild ? Slot : isLink ? "a" : "button";
    const rail = railed && !inMenu;
    const label = typeof children === "string" || typeof children === "number" ? String(children) : null;

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (rail && !icon && !asChild && label === null) {
        console.warn("Sidebar.Item: in the rail an item with no `icon` and no plain-text label has nothing to show. Give every item an `icon`.");
      }
    });

    // Capture-phase, so it runs before a slotted child's own `onClick` (a router's navigation), as `Link`'s does.
    const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClickCapture?.(event as never);
    };

    // An item chosen in the phone panel closes it. `preventDefault` doesn't stop that: a router's link calls it to navigate without a page
    // load, which is exactly the link that should close the panel. Only a link does it, though: a button (an action) leaves the panel open.
    const handleClick = (event: MouseEvent<HTMLElement>) => {
      onClick?.(event as never);
      if (inPanel && closeMenuOnNavigate && (event.currentTarget as HTMLElement).matches("a[href]")) closeMenu();
      if (closeFlyout && event.defaultPrevented) closeFlyout();
    };

    const iconNode = icon ? (
      <Icon icon={icon} size={iconSizeFor[size]} className={styles.icon} />
    ) : rail && label !== null ? (
      <span aria-hidden="true" className={cx(styles.icon, styles.initial)}>
        {label.trim().charAt(0).toUpperCase()}
      </span>
    ) : null;

    const badgeNode =
      badge !== undefined && badge !== null ? (
        // A `Badge` passed as the badge is drawn as written (its tone, variant, `max`…), with the item's size filled in where it didn't say;
        // anything else is the content of the item's own badge (solid, brand; subtle on a current item drawn as a brand fill, where a solid
        // brand pill would vanish), so a pill is never inside a pill.
        isValidElement(badge) && badge.type === Badge ? (
          cloneElement(badge as ReactElement<BadgeProps>, {
            size: (badge as ReactElement<BadgeProps>).props.size ?? "xs",
            className: cx(rail ? styles.railBadge : styles.badge, (badge as ReactElement<BadgeProps>).props.className),
          })
        ) : (
          <Badge
            tone="brand"
            variant={current && currentVariant === "solid" ? "subtle" : "solid"}
            size="xs" className={rail ? styles.railBadge : styles.badge}>
            {badge}
          </Badge>
        )
      ) : null;

    const itemClass = cx(
      !inMenu && styles.item,
      !inMenu && rail && styles.railItem,
      !inMenu && rounded && styles.rounded,
      !inMenu && current && styles.current,
      !inMenu && current && currentVariantClass[currentVariant],
      !inMenu && current && grows && styles.currentGrow,
      inMenu && current && styles.menuCurrent,
      disabled && styles.disabled,
      className,
    );

    const element = (
      <Component
        {...props}
        {...(asChild
          ? {}
          : isLink
            ? { href, target: target ?? (isExternal ? "_blank" : undefined), rel: rel ?? (isExternal ? "noopener noreferrer" : undefined) }
            : { type: "button" })}
        ref={ref as never}
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled || undefined}
        onClick={handleClick}
        onClickCapture={handleClickCapture}
        className={itemClass}
      >
        {asChild ? (
          children
        ) : (
          <>
            {iconNode}
            <span className={cx(styles.label, rail && styles.hiddenText)}>{children}</span>
            {badgeNode}
            {isExternal && (
              <>
                {!rail && <Icon icon={ArrowSquareOutIcon} size={externalIconSizeFor[size]} className={styles.trailingIcon} />}
                <VisuallyHidden> {labels.externalLink}</VisuallyHidden>
              </>
            )}
          </>
        )}
      </Component>
    );

    // Inside a rail group's floating list the item is a menu item (arrow keys, typeahead, closing on choice) and not a list item.
    if (inMenu) {
      return (
        <Menu.Item asChild disabled={disabled}>
          {element}
        </Menu.Item>
      );
    }

    const tooltipContent = asChild ? props["aria-label"] : children;
    const withTooltip =
      rail && tooltipContent !== undefined && tooltipContent !== null ? (
        <Tooltip content={tooltipContent} side={tooltipSide}>
          {element}
        </Tooltip>
      ) : (
        element
      );

    return (
      // `role="listitem"` is redundant on paper; see `Sidebar.Nav`.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li role="listitem" className={styles.listItem}>
        {withTooltip}
      </li>
    );
  },
);
SidebarItem.displayName = "Sidebar.Item";

/**
 * An item that opens more items: a button with `aria-expanded` that shows its items indented beneath it, animated. Groups nest, up to
 * three deep. In the rail, where there is no room to expand, a top-level group is an icon button that opens a floating `Menu` of its items
 * (arrow keys, typeahead, `Escape`), a nested group in it a submenu. Give it a `label` and `Sidebar.Item` children; a group is a button
 * only, so a page that is also a parent is the group's first item.
 */
const SidebarGroup = forwardRef<HTMLButtonElement, SidebarGroupProps>(
  (
    {
      label,
      icon,
      current = false,
      open: openProp,
      defaultOpen,
      onOpenChange,
      disabled = false,
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { size, currentVariant, rounded, railed, dir, menuContainer } = useSidebarContext("Sidebar.Group");
    const level = useContext(SidebarLevelContext);
    const closeFlyout = useContext(SidebarMenuContext);
    const tooltipSide = useOutwardSide();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? current);
    const [flyoutOpen, setFlyoutOpen] = useState(false);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : uncontrolledOpen;
    const grows = useBecameCurrent(current);
    const regionId = useId();
    const closeThisFlyout = useCallback(() => setFlyoutOpen(false), []);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (level >= MAX_GROUP_DEPTH) {
        console.warn(
          `Sidebar.Group: groups are nested more than ${MAX_GROUP_DEPTH} deep. A hierarchy that deep is a tree, not a list of links; flatten it or use a \`Tree\`.`,
        );
      }
    });

    // A group nested in a rail group's floating list is a submenu of it.
    if (closeFlyout !== null) {
      return (
        <Menu.Sub>
          <Menu.SubTrigger icon={icon} disabled={disabled} className={cx(current && styles.menuCurrent, className)}>
            {label}
          </Menu.SubTrigger>
          <Menu.SubContent container={menuContainer}>
            <SidebarLevelContext.Provider value={level + 1}>{children}</SidebarLevelContext.Provider>
          </Menu.SubContent>
        </Menu.Sub>
      );
    }

    const iconNode = icon ? (
      <Icon icon={icon} size={iconSizeFor[size]} className={styles.icon} />
    ) : railed ? (
      <span aria-hidden="true" className={cx(styles.icon, styles.initial)}>
        {typeof label === "string" ? label.trim().charAt(0).toUpperCase() : ""}
      </span>
    ) : null;

    const buttonClass = (marked: boolean) =>
      cx(
        styles.item,
        styles.groupButton,
        railed && styles.railItem,
        rounded && styles.rounded,
        marked && styles.current,
        marked && currentVariantClass[currentVariant],
        marked && grows && styles.currentGrow,
        className,
      );

    // The rail: an icon button that opens a floating list. The group's text is the list's title and the button's tooltip and name.
    if (railed) {
      return (
        // eslint-disable-next-line jsx-a11y/no-redundant-roles
        <li role="listitem" className={styles.listItem}>
          <Menu dir={dir} open={flyoutOpen} onOpenChange={setFlyoutOpen}>
            <Tooltip content={label} side={tooltipSide}>
              <Menu.Trigger asChild disabled={disabled}>
                <button {...props} ref={ref} type="button" disabled={disabled} className={buttonClass(current)}>
                  {iconNode}
                  <span className={cx(styles.label, styles.hiddenText)}>{label}</span>
                </button>
              </Menu.Trigger>
            </Tooltip>
            <Menu.Content side={tooltipSide} align="start" container={menuContainer}>
              <Menu.Label>{label}</Menu.Label>
              <SidebarMenuContext.Provider value={closeThisFlyout}>
                <SidebarLevelContext.Provider value={level + 1}>{children}</SidebarLevelContext.Provider>
              </SidebarMenuContext.Provider>
            </Menu.Content>
          </Menu>
        </li>
      );
    }

    // Expanded: a button that opens its items beneath it. The group that holds the current page marks its button only while it is shut, so
    // the page itself (the item inside) is the one thing marked once it is on show.
    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li role="listitem" className={cx(styles.listItem, styles.groupItem)}>
        <button
          {...props}
          ref={ref}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={regionId}
          className={buttonClass(current && !open)}
          onClick={(event) => {
            onClick?.(event);
            const next = !open;
            if (!isControlled) setUncontrolledOpen(next);
            onOpenChange?.(next);
          }}
        >
          {iconNode}
          <span className={styles.label}>{label}</span>
          <Icon icon={CaretDownIcon} size={externalIconSizeFor[size]} className={styles.caret} />
        </button>
        <Collapse asChild open={open}>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul role="list" id={regionId} className={cx(styles.list, styles.groupList)}>
            <SidebarLevelContext.Provider value={level + 1}>{children}</SidebarLevelContext.Provider>
          </ul>
        </Collapse>
      </li>
    );
  },
);
SidebarGroup.displayName = "Sidebar.Group";

/**
 * The button that collapses the sidebar to a rail and expands it again: an `IconButton` whose caret points toward the edge the
 * sidebar sits against while it is open. It is hidden below the `collapseBelow` width, where the sidebar is a panel and has no rail, and
 * in the panel itself. Put it in the header or the footer, or outside the sidebar inside a `Sidebar.Provider`.
 */
const SidebarToggle = forwardRef<HTMLButtonElement, SidebarToggleProps>(
  ({ variant = "ghost", tone = "neutral", size: ownSize, className, onClick, "aria-label": ariaLabel, ...props }, ref) => {
    const { state, labels, collapseBelow } = useSidebarStateContext("Sidebar.Toggle");
    const sidebar = useContext(SidebarContext);
    const inPanel = useContext(SidebarPanelContext);
    if (inPanel) return null;
    const side = sidebar?.side ?? "start";
    const dir = sidebar?.dir ?? "ltr";
    // The caret points toward the edge the sidebar sits against while it is open (to collapse it), and away from it while it is a rail.
    const towardEdgeIsLeft = (side === "start") === (dir === "ltr");
    const pointsLeft = state.collapsed ? !towardEdgeIsLeft : towardEdgeIsLeft;
    const name = ariaLabel ?? (state.collapsed ? labels.expand : labels.collapse);
    return (
      <IconButton
        {...props}
        ref={ref}
        icon={pointsLeft ? CaretLeftIcon : CaretRightIcon}
        variant={variant}
        tone={tone}
        size={ownSize ?? sidebar?.size ?? "md"}
        aria-label={name}
        tooltip
        tooltipSide={towardEdgeIsLeft ? "right" : "left"}
        className={cx(toggleClass[collapseBelow], sidebar !== null && styles.toggleBox, className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) state.toggleCollapsed();
        }}
      />
    );
  },
);
SidebarToggle.displayName = "Sidebar.Toggle";

/**
 * The button that opens the phone panel below the `collapseBelow` width, an `IconButton`; hidden from that width up, where the sidebar is on
 * the page. It sits outside the sidebar (in a `Navbar`, a page header) inside a `Sidebar.Provider`, and the panel gives focus back to it
 * when it closes.
 */
const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ icon = ListIcon, variant = "ghost", tone, size: ownSize, className, onClick, "aria-label": ariaLabel, ...props }, ref) => {
    const { state, labels, collapseBelow, menuButtonRef } = useSidebarStateContext("Sidebar.MenuButton");
    const sidebar = useContext(SidebarContext);
    return (
      <IconButton
        {...props}
        ref={(node) => {
          menuButtonRef.current = node ?? menuButtonRef.current;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        icon={icon}
        variant={variant}
        tone={tone}
        size={ownSize ?? sidebar?.size ?? "md"}
        aria-label={ariaLabel ?? labels.menu}
        aria-haspopup="dialog"
        aria-expanded={state.menuOpen}
        className={cx(menuButtonClass[collapseBelow], className)}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          menuButtonRef.current = event.currentTarget;
          state.setMenuOpen(true);
        }}
      />
    );
  },
);
SidebarMenuButton.displayName = "Sidebar.MenuButton";

type SidebarComponent = typeof SidebarRoot & {
  Provider: typeof SidebarProvider;
  Header: typeof SidebarHeader;
  Content: typeof SidebarContent;
  Footer: typeof SidebarFooter;
  Nav: typeof SidebarNav;
  Section: typeof SidebarSection;
  Item: typeof SidebarItem;
  Group: typeof SidebarGroup;
  Separator: typeof SidebarSeparator;
  Toggle: typeof SidebarToggle;
  MenuButton: typeof SidebarMenuButton;
};

export const Sidebar: SidebarComponent = Object.assign(SidebarRoot, {
  Provider: SidebarProvider,
  Header: SidebarHeader,
  Content: SidebarContent,
  Footer: SidebarFooter,
  Nav: SidebarNav,
  Section: SidebarSection,
  Item: SidebarItem,
  Group: SidebarGroup,
  Separator: SidebarSeparator,
  Toggle: SidebarToggle,
  MenuButton: SidebarMenuButton,
});

export { useSidebar };
