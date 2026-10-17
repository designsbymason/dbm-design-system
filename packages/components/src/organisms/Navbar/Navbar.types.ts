import type { Breakpoint, SpaceValue } from "@dbm-design-system/primitives";
import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type {
  AnchorHTMLAttributes,
  ComponentPropsWithoutRef,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from "react";
import type { DrawerOpenChangeDetails, DrawerSide } from "../Drawer";
import type { MenuAlign } from "../Menu";

/** The bar's height step: its block size is the height of an `IconButton` of the same step plus a little room. */
export type NavbarSize = "sm" | "md" | "lg";

/**
 * How the bar itself is drawn: `outlined` (a surface with a line under it), `filled` (a tinted surface) or `ghost`
 * (nothing of its own, the content sits on the page). The same names `Card` and `EmptyState` use for their `variant`.
 */
export type NavbarVariant = "outlined" | "filled" | "ghost";

/**
 * The width below which the primary links leave the bar for a menu button: a breakpoint step (`"md"` is 768px), or
 * `"never"` to keep the links in the bar at every width. `"base"` is not an option, since it would mean never.
 */
export type NavbarCollapseBelow = Exclude<Breakpoint, "base"> | "never";

/** The reading direction. Not read from the page: pass `"rtl"` on a right-to-left page. */
export type NavbarDirection = "ltr" | "rtl";

/** What closed (or opened) the phone menu — the same reasons `Drawer` reports. */
export type NavbarMenuChangeDetails = DrawerOpenChangeDetails;

/** The text `Navbar` supplies itself, translatable through the `labels` prop. Nothing here needs a number. */
export interface NavbarLabels {
  /** The accessible name of the menu button, and the title of the menu that opens. @default 'Menu' */
  menu: string;
  /** The name of the `<nav>` that holds the primary links, when `Navbar.Links` is not given an `aria-label`. @default 'Main' */
  navigation: string;
  /** The accessible name of the menu panel's close button. @default 'Close' */
  close: string;
}

export interface NavbarProps extends Omit<ComponentPropsWithoutRef<"header">, "dir" | "children"> {
  /**
   * The bar's contents, in reading order: `Navbar.Brand`, `Navbar.Links`, `Navbar.Actions`, and optionally
   * `Navbar.MenuButton` to place the phone menu's button yourself. Parts are found among the direct children; a part
   * wrapped in a fragment or another component still draws, but isn't noticed for the automatic menu button.
   */
  children?: ReactNode;
  /**
   * How the bar is drawn — see {@link NavbarVariant}.
   * @default 'outlined'
   */
  variant?: NavbarVariant;
  /**
   * The bar's height, on a three-step scale. Each step is as tall as an `IconButton` of the same step plus room above and
   * below, so a button in the bar never touches its edges.
   * @default 'md'
   */
  size?: NavbarSize;
  /**
   * The width below which `Navbar.Links` leaves the bar and is offered in a menu behind a button — see
   * {@link NavbarCollapseBelow}. The choice is a stylesheet's, not JavaScript's, so the first paint on a server-rendered
   * page is already right.
   * @default 'md'
   */
  collapseBelow?: NavbarCollapseBelow;
  /** The controlled open state of the phone menu. Omit (with `defaultMenuOpen`) to let the bar manage it. */
  menuOpen?: boolean;
  /**
   * The initial open state of the phone menu for uncontrolled usage — ignored once `menuOpen` is provided.
   * @default false
   */
  defaultMenuOpen?: boolean;
  /**
   * Called with the new open state of the phone menu whenever it changes, with the reason (a press on the button, Escape,
   * the scrim, the close button, or a link chosen).
   */
  onMenuOpenChange?: (open: boolean, details: NavbarMenuChangeDetails) => void;
  /**
   * Which edge the phone menu slides in from. `"start"` and `"end"` are logical, so they swap in right-to-left text.
   * @default 'start'
   */
  menuSide?: DrawerSide;
  /**
   * Closes the phone menu when a link in it is chosen, which is what a single-page app that doesn't reload needs. Turn it
   * off for a menu whose links open a submenu or stay put.
   * @default true
   */
  closeMenuOnNavigate?: boolean;
  /**
   * The element the menu panel is drawn into instead of the end of `document.body`: a shadow root, or a frame that should
   * hold the panel and its scrim. Leave it out for the usual page.
   */
  menuContainer?: HTMLElement | null;
  /**
   * Keeps the content to the page's reading width with `Container`, centred, instead of running edge to edge.
   * @default false
   */
  contained?: boolean;
  /**
   * Keeps the bar at the top of the page (or of `scrollContainerRef`) as the reader scrolls, with a surface behind it
   * and a shadow while it is stuck. Built on `Affix`, the same as `Toolbar`'s and `Alert`'s `sticky`.
   * @default false
   */
  sticky?: boolean;
  /**
   * How far from the top a sticky bar sticks, from the spacing token scale — for a page with a banner above it that is
   * also sticky. Has no effect without `sticky`.
   * @default 0
   */
  stickyOffset?: SpaceValue;
  /**
   * The scrollable container a sticky bar sticks within, if it isn't the page itself. Has no effect without `sticky`.
   * The same prop `Affix`, `BackToTop`, `Alert` and `Toolbar` take.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * The reading direction, passed to the bar and to the menu panel (which is drawn in a portal and would otherwise follow
   * the page). Not read from the page.
   * @default 'ltr'
   */
  dir?: NavbarDirection;
  /**
   * The text the bar supplies itself, with English defaults: the menu button's name, the navigation's name, and the menu
   * panel's close button.
   */
  labels?: Partial<NavbarLabels>;
  /** Names the banner landmark for assistive tech, for a page with more than one header (an article's, say). */
  "aria-label"?: string;
  /** The `id` of a visible element that names the banner landmark, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The `id` of a description for the bar. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes, on the `<header>` element. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarBrandProps extends HTMLAttributes<HTMLElement> {
  /**
   * Where the brand links to, usually the home page. With an `href` the brand is an `<a>`; without one (and without
   * `asChild`) it is a plain `<div>`.
   */
  href?: string;
  /**
   * Renders as a single provided child element (via Radix `Slot`) instead of the built-in `<a>`/`<div>`, to use a
   * router's link.
   * @default false
   */
  asChild?: boolean;
  /** The brand: a logo and a name. A logo that is an image needs its own `alt`. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
  /** Names the brand for assistive tech when its content is only a logo. */
  "aria-label"?: string;
}

export interface NavbarLinksProps extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  /**
   * `Navbar.Link` items. The same items are drawn in the bar and, below the `collapseBelow` width, in the menu panel, so
   * give them no `id`: an id would be on the page twice while the menu is open.
   */
  children?: ReactNode;
  /** Names the navigation landmark. Defaults to `labels.navigation` ("Main"). */
  "aria-label"?: string;
  /** The `id` of a visible element that names the navigation, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes, on the `<nav>` element. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /** The link's text, and an icon if it has one. */
  children?: ReactNode;
  /** Where the link goes. With `asChild`, put it on the child instead. */
  href?: string;
  /**
   * Marks the link as the page the reader is on: `aria-current="page"` and a tinted look. The caller decides which one it
   * is (from the router), so it stays correct on a server-rendered page.
   * @default false
   */
  current?: boolean;
  /**
   * Makes the link inert: `aria-disabled` plus a blocked click, and it stays in the tab order, as `Link` does.
   * @default false
   */
  disabled?: boolean;
  /**
   * Renders as a single provided child element (via Radix `Slot`) instead of the built-in `<a>`, to use a router's link.
   * @default false
   */
  asChild?: boolean;
  /** Standard DOM id. Avoid it inside `Navbar.Links`, whose items can be on the page twice. */
  id?: string;
  /** Additional CSS classes, on the link element. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
  /** Names the link when its content is only an icon. */
  "aria-label"?: string;
}

export interface NavbarGroupProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /** The group's name, shown on its button. */
  label: ReactNode;
  /** The group's `Navbar.Link`s. In the bar they are the items of a floating menu; in the phone panel they are listed under the button. */
  children?: ReactNode;
  /**
   * Gives the button the tinted look of the current page, for a group that holds it. The caller decides, from the router.
   * Also opens the group in the phone panel, unless `defaultOpen` says otherwise.
   * @default false
   */
  current?: boolean;
  /**
   * Whether the group starts expanded in the phone panel. Has no effect in the bar, where the group is a menu that opens on
   * a press.
   * @default current
   */
  defaultOpen?: boolean;
  /**
   * Makes the group's button inert, as a native `disabled` does: it leaves the tab order.
   * @default false
   */
  disabled?: boolean;
  /**
   * How the floating menu lines up with its button in the bar: `"start"`, `"center"` or `"end"` (logical, so `start` is the
   * right edge in right-to-left text).
   * @default 'start'
   */
  align?: MenuAlign;
  /** Names the button when `label` alone doesn't say it. */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes, on the group's button. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** What sits at the bar's end: a search field, icon buttons, a `Menu` for the account, a call to action. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface NavbarMenuButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /**
   * The icon, a component reference.
   * @default ListIcon
   */
  icon?: PhosphorIcon;
  /** The button's accessible name. Defaults to `labels.menu` ("Menu"). */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
