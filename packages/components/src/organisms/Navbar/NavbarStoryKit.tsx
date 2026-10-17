import { UserCircleIcon } from "@dbm-design-system/icons";
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
  linksLabel,
  ...props
}: NavbarProps & {
  /** What the end of the bar holds: one button, or a search field and an account menu. */
  actions?: "button" | "rich" | "none";
  /** Adds a "Resources" group of links after the plain ones: a dropdown in the bar, an expandable group in the panel. */
  withGroup?: boolean;
  /** Names this bar's navigation, for a gallery of several bars where the default name would repeat. */
  linksLabel?: string;
}) {
  const demo = useDemoCurrent("products");
  return (
    <Navbar menuContainer={menuContainer} {...props}>
      <Navbar.Brand href="#" onClick={preventNavigation}>
        dbM
      </Navbar.Brand>
      <Navbar.Links aria-label={linksLabel}>
        <Navbar.Link {...demo.link("products")}>Products</Navbar.Link>
        <Navbar.Link {...demo.link("pricing")}>Pricing</Navbar.Link>
        <Navbar.Link {...demo.link("docs")}>Docs</Navbar.Link>
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
  children,
}: {
  boxRef: RefObject<HTMLDivElement | null>;
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
