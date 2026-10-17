import { CaretDownIcon, ListIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import type { MouseEvent } from "react";
import { Affix } from "../../atoms/Affix";
import { Container } from "../../atoms/Container";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Drawer } from "../Drawer";
import { Menu } from "../Menu";
import type { DrawerOpenChangeDetails } from "../Drawer";
import styles from "./Navbar.module.css";
import type {
  NavbarActionsProps,
  NavbarBrandProps,
  NavbarCollapseBelow,
  NavbarCurrentVariant,
  NavbarGroupProps,
  NavbarLabels,
  NavbarLinkProps,
  NavbarLinksProps,
  NavbarMenuButtonProps,
  NavbarProps,
  NavbarSize,
} from "./Navbar.types";

const defaultLabels: NavbarLabels = { menu: "Menu", navigation: "Main", close: "Close" };

const collapseClass: Record<NavbarCollapseBelow, string | undefined> = {
  sm: styles.collapseSm,
  md: styles.collapseMd,
  lg: styles.collapseLg,
  xl: styles.collapseXl,
  "2xl": styles.collapse2xl,
  "3xl": styles.collapse3xl,
  never: styles.collapseNever,
};

const sizeClass: Record<NavbarSize, string | undefined> = {
  sm: styles.sizeSm,
  md: undefined,
  lg: styles.sizeLg,
};

const currentVariantClass: Record<NavbarCurrentVariant, string | undefined> = {
  subtle: undefined,
  underline: styles.currentUnderline,
  solid: styles.currentSolid,
};

// The widths the `collapseBelow` steps stand for, the literal values of the breakpoint tokens (a media query can't read a
// custom property). Used only to close the menu panel when the page grows past the step, so it doesn't sit over a bar
// that already shows the links.
const collapseQuery: Record<Exclude<NavbarCollapseBelow, "never">, string> = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
  "2xl": "(min-width: 96rem)",
  "3xl": "(min-width: 120rem)",
};

interface NavbarContextValue {
  labels: NavbarLabels;
  size: NavbarSize;
  closeMenuOnNavigate: boolean;
  currentVariant: NavbarCurrentVariant;
  rounded: boolean;
  menuSide: NonNullable<NavbarProps["menuSide"]>;
  dir: NonNullable<NavbarProps["dir"]>;
  menuContainer: HTMLElement | null | undefined;
  /** Closes the phone menu from inside it (a link chosen). */
  closeMenu: () => void;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

/** True for the links drawn in the menu panel, which close it when chosen. */
const NavbarPanelContext = createContext(false);

/**
 * Set inside the floating list a `Navbar.Group` opens in the bar, where its links are menu items and not list items; the value
 * closes that list. `Menu` closes itself when an item is chosen, but not when the item's own click handler called
 * `preventDefault` (the way a router's link does), so a link closes it by hand then.
 */
const NavbarMenuContext = createContext<(() => void) | null>(null);

/**
 * Whether a link has become the current one since it was drawn, and still is: true from the render in which `current` turns
 * on until it turns off, so a marker that grows in plays once, isn't cut short by an unrelated re-render, and doesn't play
 * for a link that was already current when it mounted (a first paint, or the menu panel opening). The previous value is held in
 * state and compared while rendering, the pattern React gives for state derived from a prop.
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

function useNavbarContext(part: string): NavbarContextValue {
  const context = useContext(NavbarContext);
  if (context === null) {
    throw new Error(`${part} must be used inside <Navbar>.`);
  }
  return context;
}

/**
 * The application header: a named banner at the top of the page holding the brand, the primary navigation and a place for
 * the actions that belong to the whole app (search, an account menu, a call to action). Below the `collapseBelow` width
 * the navigation leaves the bar and is offered in a `Drawer` behind a menu button, so a phone gets a list it can reach
 * with a thumb and the first paint of a server-rendered page is already right (the switch is a stylesheet's).
 *
 * A compound component, meaning it is made of named sub-parts you compose together: `Navbar.Brand`, `Navbar.Links` with
 * `Navbar.Link` items, `Navbar.Actions`, and `Navbar.MenuButton` (drawn for you when `Navbar.Links` is present, unless you
 * place one yourself). It is a `<header>`; `Navbar.Links` is a named `<nav>` holding a list, and the current page is
 * `aria-current="page"`. Links are ordinary tab stops, not a roving group: this is the disclosure-navigation pattern, not a
 * toolbar.
 *
 * The same `Navbar.Link` items are drawn in the bar and in the menu panel, so give them no `id`. A link that opens a list of
 * actions or pages is a `Menu` whose trigger is a `Navbar.Link`; a mega-menu of panels is `NavigationMenu`.
 *
 * Does not cover a persistent navigation column (`Sidebar`), a bar of editing actions (`Toolbar`), or a whole page layout (a
 * template).
 *
 * @example
 * ```tsx
 * <Navbar sticky>
 *   <Navbar.Brand href="/">dbM</Navbar.Brand>
 *   <Navbar.Links>
 *     <Navbar.Link href="/products" current>Products</Navbar.Link>
 *     <Navbar.Link href="/pricing">Pricing</Navbar.Link>
 *   </Navbar.Links>
 *   <Navbar.Actions>
 *     <Button size="sm">Sign in</Button>
 *   </Navbar.Actions>
 * </Navbar>
 * ```
 */
const NavbarRoot = forwardRef<HTMLElement, NavbarProps>(
  (
    {
      children,
      variant = "outlined",
      currentVariant = "underline",
      rounded = false,
      size = "md",
      collapseBelow = "md",
      menuOpen,
      defaultMenuOpen = false,
      onMenuOpenChange,
      menuSide = "start",
      menuContainer,
      closeMenuOnNavigate = true,
      contained = false,
      sticky = false,
      stickyOffset = 0,
      scrollContainerRef,
      dir = "ltr",
      labels,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const resolvedLabels = mergeDefined(defaultLabels, labels);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultMenuOpen);
    const isControlled = menuOpen !== undefined;
    const open = isControlled ? menuOpen : uncontrolledOpen;

    const changeMenu = useCallback(
      (next: boolean, details: DrawerOpenChangeDetails) => {
        if (!isControlled) setUncontrolledOpen(next);
        onMenuOpenChange?.(next, details);
      },
      [isControlled, onMenuOpenChange],
    );

    const closeMenu = useCallback(() => changeMenu(false, { reason: "close" }), [changeMenu]);

    // Past the width where the links are in the bar again, a menu panel left open would sit over links already on show.
    useEffect(() => {
      if (!open || collapseBelow === "never" || typeof window === "undefined" || !window.matchMedia) return undefined;
      const query = window.matchMedia(collapseQuery[collapseBelow]);
      const handleChange = (event: MediaQueryListEvent) => {
        if (event.matches) closeMenu();
      };
      query.addEventListener("change", handleChange);
      return () => query.removeEventListener("change", handleChange);
    }, [open, collapseBelow, closeMenu]);

    const parts = Children.toArray(children);
    const hasLinks = parts.some((child) => isValidElement(child) && child.type === NavbarLinks);
    const hasMenuButton = parts.some((child) => isValidElement(child) && child.type === NavbarMenuButton);
    const showAutomaticMenuButton = hasLinks && !hasMenuButton && collapseBelow !== "never";

    const contextValue = useMemo<NavbarContextValue>(
      () => ({ labels: resolvedLabels, size, closeMenuOnNavigate, currentVariant, rounded, menuSide, menuContainer, dir, closeMenu }),
      // `mergeDefined` returns a fresh object each render; its three strings are what the value really depends on.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [resolvedLabels.menu, resolvedLabels.navigation, resolvedLabels.close, size, closeMenuOnNavigate, currentVariant, rounded, menuSide, menuContainer, dir, closeMenu],
    );

    const content = (
      <>
        {children}
        {showAutomaticMenuButton && <NavbarMenuButton />}
      </>
    );

    const header = (
      <header
        {...props}
        ref={ref}
        dir={dir}
        data-variant={variant}
        data-size={size}
        className={cx(
          styles.root,
          styles[variant],
          sizeClass[size],
          collapseClass[collapseBelow],
          sticky && styles.sticky,
          className,
        )}
        style={style}
      >
        {contained ? (
          <Container className={styles.inner}>{content}</Container>
        ) : (
          <div className={cx(styles.inner, styles.plainInner)}>{content}</div>
        )}
      </header>
    );

    return (
      <NavbarContext.Provider value={contextValue}>
        <Drawer open={open} onOpenChange={changeMenu}>
          {sticky ? (
            <Affix asChild offset={stickyOffset} scrollContainerRef={scrollContainerRef}>
              {header}
            </Affix>
          ) : (
            header
          )}
        </Drawer>
      </NavbarContext.Provider>
    );
  },
);
NavbarRoot.displayName = "Navbar";

/**
 * The brand: a logo and a name, linking home. With an `href` it is an `<a>`; without one a plain `<div>`; `asChild` puts
 * the brand's look on a router link.
 */
const NavbarBrand = forwardRef<HTMLElement, NavbarBrandProps>(
  ({ href, asChild = false, className, children, ...props }, ref) => {
    const Component = asChild ? Slot : href !== undefined ? "a" : "div";
    return (
      <Component
        {...props}
        {...(href !== undefined ? { href } : {})}
        ref={ref as never}
        className={cx(styles.brand, className)}
      >
        {children}
      </Component>
    );
  },
);
NavbarBrand.displayName = "Navbar.Brand";

/**
 * The primary navigation: a `<nav>` holding a list of `Navbar.Link`s. Drawn in the bar at and above the `collapseBelow`
 * width, and, below it, as the body of the menu panel the menu button opens. Its children are drawn in both places.
 */
const NavbarLinks = forwardRef<HTMLElement, NavbarLinksProps>(
  ({ children, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const { labels, menuSide, menuContainer, dir } = useNavbarContext("Navbar.Links");
    const name = ariaLabelledBy === undefined ? (ariaLabel ?? labels.navigation) : ariaLabel;

    return (
      <>
        <nav
          {...props}
          ref={ref}
          aria-label={name}
          aria-labelledby={ariaLabelledBy}
          className={cx(styles.links, className)}
        >
          {/* `role="list"` and `role="listitem"` are redundant on paper; Safari with VoiceOver drops list semantics under `list-style: none`. */}
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul role="list" className={styles.list}>
            {children}
          </ul>
        </nav>
        <Drawer.Content side={menuSide} size="sm" dir={dir} container={menuContainer} labels={{ close: labels.close }} aria-describedby={undefined}>
          <Drawer.Header>
            <Drawer.Title>{labels.menu}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <nav aria-label={name} aria-labelledby={ariaLabelledBy} className={styles.panelNav}>
              {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
              <ul role="list" className={cx(styles.list, styles.panelList)}>
                <NavbarPanelContext.Provider value>{children}</NavbarPanelContext.Provider>
              </ul>
            </nav>
          </Drawer.Body>
        </Drawer.Content>
      </>
    );
  },
);
NavbarLinks.displayName = "Navbar.Links";

/**
 * One link of the navigation. `current` marks the page the reader is on (`aria-current="page"`); `disabled` blocks the click
 * and keeps the link in the tab order, as `Link` does; `asChild` puts the look on a router's link.
 */
const NavbarLink = forwardRef<HTMLAnchorElement, NavbarLinkProps>(
  ({ current = false, disabled = false, asChild = false, className, onClick, onClickCapture, children, ...props }, ref) => {
    const { closeMenuOnNavigate, closeMenu, currentVariant, rounded } = useNavbarContext("Navbar.Link");
    const inPanel = useContext(NavbarPanelContext);
    const closeGroupMenu = useContext(NavbarMenuContext);
    const inMenu = closeGroupMenu !== null;
    const grows = useBecameCurrent(current);
    const Component = asChild ? Slot : "a";

    // Capture-phase, so it runs before a slotted child's own `onClick` (a router's navigation), as `Link`'s does.
    const handleClickCapture = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClickCapture?.(event);
    };

    // A link chosen in the menu panel closes it. `preventDefault` doesn't stop that: a router's link calls it to navigate
    // without a page load, which is exactly the link that should close the panel. Only a link does it, though: a button
    // drawn with this look (a dropdown's trigger, an `asChild` button) leaves the panel open. A disabled link never gets here.
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (inPanel && closeMenuOnNavigate && (event.currentTarget as HTMLElement).matches("a[href]")) closeMenu();
      if (closeGroupMenu && event.defaultPrevented) closeGroupMenu();
    };

    const link = (
      <Component
        {...props}
        ref={ref}
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled || undefined}
        onClick={handleClick}
        onClickCapture={handleClickCapture}
        className={cx(
          !inMenu && styles.link,
          !inMenu && rounded && styles.rounded,
          !inMenu && current && styles.current,
          !inMenu && current && currentVariantClass[currentVariant],
          !inMenu && current && grows && styles.currentGrow,
          disabled && styles.disabled, className)}
      >
        {children}
      </Component>
    );

    // In a group's floating list the link is a menu item (arrow keys, typeahead, closing on choice) and not a list item.
    if (inMenu) {
      return (
        <Menu.Item asChild disabled={disabled}>
          {link}
        </Menu.Item>
      );
    }

    return (
      // `role="listitem"` is redundant on paper; see `Navbar.Links`.
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li role="listitem" className={styles.item}>
        {link}
      </li>
    );
  },
);
NavbarLink.displayName = "Navbar.Link";

/**
 * A link that opens more links. In the bar it is a button that opens a floating `Menu` of its `Navbar.Link`s (arrow keys,
 * typeahead, `Escape`); in the menu panel on a phone, where a floating list is awkward, it is an expandable group, a button
 * with `aria-expanded` that shows its links indented beneath it. Give it a `label` and `Navbar.Link` children; it is
 * not for a wide panel of grouped links, which is `NavigationMenu`.
 */
const NavbarGroup = forwardRef<HTMLButtonElement, NavbarGroupProps>(
  ({ label, current = false, disabled = false, defaultOpen, align = "start", className, children, ...props }, ref) => {
    const { dir, currentVariant, rounded } = useNavbarContext("Navbar.Group");
    const inPanel = useContext(NavbarPanelContext);
    const [open, setOpen] = useState(defaultOpen ?? current);
    const [menuOpen, setMenuOpen] = useState(false);
    const grows = useBecameCurrent(current);
    const closeGroupMenu = useCallback(() => setMenuOpen(false), []);
    const regionId = useId();
    const trigger = (
      <>
        {label}
        <Icon icon={CaretDownIcon} size="xs" className={styles.caret} />
      </>
    );
    const triggerClass = cx(
      styles.link,
      styles.groupTrigger,
      rounded && styles.rounded,
      current && styles.current,
      current && currentVariantClass[currentVariant],
      current && grows && styles.currentGrow,
      className,
    );

    if (inPanel) {
      return (
        // `role="listitem"` is redundant on paper; see `Navbar.Links`.
        // eslint-disable-next-line jsx-a11y/no-redundant-roles
        <li role="listitem" className={cx(styles.item, styles.groupItem)}>
          <button
            {...props}
            ref={ref}
            type="button"
            disabled={disabled}
            aria-expanded={open}
            aria-controls={regionId}
            className={triggerClass}
            onClick={() => setOpen((previous) => !previous)}
          >
            {trigger}
          </button>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul role="list" id={regionId} hidden={!open} className={cx(styles.list, styles.groupList)}>
            {children}
          </ul>
        </li>
      );
    }

    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <li role="listitem" className={styles.item}>
        <Menu dir={dir} open={menuOpen} onOpenChange={setMenuOpen}>
          <Menu.Trigger asChild disabled={disabled}>
            <button {...props} ref={ref} type="button" disabled={disabled} className={triggerClass}>
              {trigger}
            </button>
          </Menu.Trigger>
          <Menu.Content align={align}>
            <NavbarMenuContext.Provider value={closeGroupMenu}>{children}</NavbarMenuContext.Provider>
          </Menu.Content>
        </Menu>
      </li>
    );
  },
);
NavbarGroup.displayName = "Navbar.Group";

/** The bar's end: whatever belongs to the whole app, pushed to the far edge. */
const NavbarActions = forwardRef<HTMLDivElement, NavbarActionsProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.actions, className)} />
));
NavbarActions.displayName = "Navbar.Actions";

/**
 * The button that opens the menu panel below the `collapseBelow` width, an `IconButton` that is the panel's `Drawer`
 * trigger. Drawn for you at the bar's end when `Navbar.Links` is present; place one yourself to put it elsewhere or give it
 * another icon.
 */
const NavbarMenuButton = forwardRef<HTMLButtonElement, NavbarMenuButtonProps>(
  ({ icon = ListIcon, className, "aria-label": ariaLabel, ...props }, ref) => {
    const { labels, size } = useNavbarContext("Navbar.MenuButton");
    return (
      <Drawer.Trigger asChild>
        <IconButton
          {...props}
          ref={ref}
          icon={icon}
          variant="ghost"
          size={size}
          aria-label={ariaLabel ?? labels.menu}
          className={cx(styles.menuButton, className)}
        />
      </Drawer.Trigger>
    );
  },
);
NavbarMenuButton.displayName = "Navbar.MenuButton";

type NavbarComponent = typeof NavbarRoot & {
  Brand: typeof NavbarBrand;
  Links: typeof NavbarLinks;
  Link: typeof NavbarLink;
  Group: typeof NavbarGroup;
  Actions: typeof NavbarActions;
  MenuButton: typeof NavbarMenuButton;
};

export const Navbar: NavbarComponent = Object.assign(NavbarRoot, {
  Brand: NavbarBrand,
  Links: NavbarLinks,
  Link: NavbarLink,
  Group: NavbarGroup,
  Actions: NavbarActions,
  MenuButton: NavbarMenuButton,
});
