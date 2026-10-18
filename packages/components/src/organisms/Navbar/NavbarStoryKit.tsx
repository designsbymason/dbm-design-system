import { BellIcon, BookOpenIcon, ShoppingCartIcon, UserCircleIcon } from "@dbm-design-system/icons";
import { useState } from "react";
import type { MouseEvent, ReactNode, RefObject } from "react";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { Text } from "../../atoms/Text";
import { SearchInput } from "../../molecules/SearchInput";
import { Menu } from "../Menu";
import { Navbar } from "./Navbar";
import type { NavbarProps } from "./Navbar.types";

export { DrawerStage as NavbarStage, DrawerViewModeContext as NavbarViewModeContext } from "../Drawer/DrawerStoryKit";

/** Stops a demo link from navigating: a story's link goes nowhere, so it must not load another page. */
export function preventNavigation(event: MouseEvent) {
  event.preventDefault();
}

/**
 * What a demo bar's links share so that choosing one moves the "current" mark to it instead of leaving the page, the way a
 * router would: each link is `current` while it is the chosen one, and a click records it and keeps the browser where it is.
 */
export function useDemoCurrent(initial: string) {
  const [chosen, setChosen] = useState(initial);
  const anchor = (id: string) => ({
    href: `#${id}`,
    onClick: (event: MouseEvent) => {
      event.preventDefault();
      setChosen(id);
    },
  });
  return {
    isCurrent: (id: string) => chosen === id,
    /** The props of a `Navbar.Link`. */
    link: (id: string) => ({ ...anchor(id), current: chosen === id }),
    /** The props of an `<a>` a `Navbar.Link asChild` draws on, which has no `current` of its own. */
    anchor,
  };
}

/** The bar every gallery story draws, so the stories differ only in what they set on it. */
export function DemoNavbar({
  menuContainer,
  actions = "button",
  withGroup = false,
  skipLink = false,
  extras = false,
  linksAlign,
  linksLabel,
  ...props
}: NavbarProps & {
  /**
   * What the end of the bar holds: one button, a search field and an account menu, or (`"responsive"`) a button that leaves
   * the bar below the widest step and comes back at the foot of the menu panel.
   */
  actions?: "button" | "rich" | "responsive" | "none";
  /** Puts a skip link first in the bar. */
  skipLink?: boolean;
  /** Gives the links an icon, a count and an external destination, to show those. */
  extras?: boolean;
  /** Where the links sit between the brand and the actions. */
  linksAlign?: "start" | "center" | "end";
  /** Adds a "Resources" group of links after the plain ones: a dropdown in the bar, an expandable group in the panel. */
  withGroup?: boolean;
  /** Names this bar's navigation, for a gallery of several bars where the default name would repeat. */
  linksLabel?: string;
}) {
  const demo = useDemoCurrent("products");
  return (
    <Navbar menuContainer={menuContainer} {...props}>
      {skipLink && <Navbar.SkipLink href="#main" onClick={preventNavigation} />}
      <Navbar.Brand href="#" onClick={preventNavigation}>
        dbM
      </Navbar.Brand>
      <Navbar.Links aria-label={linksLabel} align={linksAlign}>
        <Navbar.Link {...demo.link("products")}>Products</Navbar.Link>
        <Navbar.Link {...demo.link("pricing")} badge={extras ? "New" : undefined}>
          Pricing
        </Navbar.Link>
        <Navbar.Link {...demo.link("docs")} icon={extras ? BookOpenIcon : undefined}>
          Docs
        </Navbar.Link>
        {extras && (
          <>
            <Navbar.Link {...demo.link("inbox")} icon={BellIcon} badge="3">
              Inbox
            </Navbar.Link>
            <Navbar.Link href="https://example.com" onClick={preventNavigation}>
              Status
            </Navbar.Link>
          </>
        )}
        <Navbar.Link href="#beta" disabled>
          Beta
        </Navbar.Link>
        {withGroup && (
          <Navbar.Group label="Resources" current={["blog", "guides", "changelog"].some(demo.isCurrent)}>
            <Navbar.Link {...demo.link("blog")}>Blog</Navbar.Link>
            <Navbar.Link {...demo.link("guides")}>Guides</Navbar.Link>
            <Navbar.Link {...demo.link("changelog")}>Changelog</Navbar.Link>
          </Navbar.Group>
        )}
      </Navbar.Links>
      {actions === "button" && (
        <Navbar.Actions>
          <Button size="sm">Sign in</Button>
        </Navbar.Actions>
      )}
      {actions === "responsive" && (
        <Navbar.Actions>
          <Navbar.Action>
            <SearchInput aria-label="Search" size="sm" />
          </Navbar.Action>
          <Navbar.Action hideBelow="3xl">
            <Button size="sm">Sign in</Button>
          </Navbar.Action>
        </Navbar.Actions>
      )}
      {/* the bar looks for the panel actions among its children and rows to draw the panel's footer, so keep it out of another component */}
      {actions === "responsive" && (
        <Navbar.PanelActions>
          <Button>Sign in</Button>
        </Navbar.PanelActions>
      )}
      {actions === "rich" && (
        <Navbar.Actions>
          <SearchInput aria-label="Search" size="sm" />
          <Menu>
            <Menu.Trigger asChild>
              <IconButton icon={UserCircleIcon} aria-label="Account" variant="ghost" size="md" />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item>Profile</Menu.Item>
              <Menu.Item>Sign out</Menu.Item>
            </Menu.Content>
          </Menu>
        </Navbar.Actions>
      )}
    </Navbar>
  );
}

/**
 * One bar of a gallery of several. A page has one banner landmark, so each bar sits in a named `<section>`, which makes its
 * `<header>` an ordinary region and not a second banner (the rule `Navbar`'s Docs page gives for a page with more than one).
 */
export function GalleryBar({ name, children }: { name: string; children: ReactNode }) {
  return <section aria-label={name}>{children}</section>;
}

/**
 * A multi-row header: a courtesy strip (which scrolls away when the bar is sticky), the row with the logo, the search field and the
 * account and cart buttons, and a row of categories. The sets of links are named so each landmark has its own name.
 */
export function DemoRowsNavbar({
  menuContainer,
  searchCollapseBelow,
  ...props
}: NavbarProps & {
  /** Where the search field gives way to a button, as `Navbar.Search`'s `collapseBelow`. */
  searchCollapseBelow?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "never";
}) {
  const demo = useDemoCurrent("women");
  return (
    <Navbar menuContainer={menuContainer} {...props}>
      <Navbar.Row size="xs" variant="filled" sticky={false}>
        <Navbar.Links aria-label="Help" quiet align="end">
          <Navbar.Link {...demo.link("help")}>Help</Navbar.Link>
          <Navbar.Link {...demo.link("orders")}>Track an order</Navbar.Link>
          <Navbar.Link {...demo.link("stores")}>Find a store</Navbar.Link>
        </Navbar.Links>
      </Navbar.Row>
      <Navbar.Row variant="ghost">
        <Navbar.Brand href="#" onClick={preventNavigation}>
          dbM
        </Navbar.Brand>
        <Navbar.Search collapseBelow={searchCollapseBelow} placeholder="Search products" />
        <Navbar.Actions>
          <IconButton icon={UserCircleIcon} aria-label="Account" variant="ghost" size="md" />
          <IconButton icon={ShoppingCartIcon} aria-label="Cart, 2 items" variant="ghost" size="md" />
        </Navbar.Actions>
      </Navbar.Row>
      <Navbar.Row variant="outlined">
        <Navbar.Links aria-label="Categories">
          <Navbar.Link {...demo.link("women")}>Women</Navbar.Link>
          <Navbar.Link {...demo.link("men")}>Men</Navbar.Link>
          <Navbar.Link {...demo.link("kids")}>Kids</Navbar.Link>
          <Navbar.Link {...demo.link("sale")}>Sale</Navbar.Link>
        </Navbar.Links>
      </Navbar.Row>
    </Navbar>
  );
}

/** The router-link bar: plain anchors stand in for a router's link, and choosing one moves the current mark. */
export function RouterDemoNavbar({ menuContainer }: { menuContainer?: HTMLElement | null }) {
  const demo = useDemoCurrent("products");
  return (
    <Navbar menuContainer={menuContainer}>
      <Navbar.Brand asChild>
        <a href="#home" onClick={preventNavigation}>
          dbM
        </a>
      </Navbar.Brand>
      <Navbar.Links>
        <Navbar.Link asChild current={demo.isCurrent("products")}>
          <a {...demo.anchor("products")}>Products</a>
        </Navbar.Link>
        <Navbar.Link asChild current={demo.isCurrent("pricing")}>
          <a {...demo.anchor("pricing")}>Pricing</a>
        </Navbar.Link>
      </Navbar.Links>
    </Navbar>
  );
}

/** A scrolling box under a sticky bar, to see it stick: the bar names the box with `scrollContainerRef`. */
export function StickyDemo({
  boxRef,
  hero = false,
  children,
}: {
  boxRef: RefObject<HTMLDivElement | null>;
  /** Puts a tinted hero block behind the bar's starting place, to show a transparent bar over something. */
  hero?: boolean;
  children: (ref: RefObject<HTMLDivElement | null>) => ReactNode;
}) {
  return (
    <div
      ref={boxRef}
      style={{
        blockSize: "20rem",
        overflow: "auto",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
      }}
    >
      {children(boxRef)}
      {hero && (
        <div
          style={{
            blockSize: "10rem",
            marginBlockStart: "calc(-1 * var(--dbm-space-16))",
            paddingBlockStart: "var(--dbm-space-16)",
            background: "var(--dbm-bg-brand-subtle)",
          }}
        />
      )}
      <div style={{ padding: "var(--dbm-space-6)", display: "grid", gap: "var(--dbm-space-4)" }}>
        {Array.from({ length: 12 }, (_, index) => (
          <Text key={index}>
            Scroll this box. The bar above stays at its top, and gains a shadow once the page has moved under it (paragraph{" "}
            {index + 1}).
          </Text>
        ))}
      </div>
    </div>
  );
}
