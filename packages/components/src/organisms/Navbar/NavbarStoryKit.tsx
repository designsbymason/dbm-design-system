import { UserCircleIcon } from "@dbm-design-system/icons";
import type { ReactNode, RefObject } from "react";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { Text } from "../../atoms/Text";
import { SearchInput } from "../../molecules/SearchInput";
import { Menu } from "../Menu";
import { Navbar } from "./Navbar";
import type { NavbarProps } from "./Navbar.types";

export { DrawerStage as NavbarStage, DrawerViewModeContext as NavbarViewModeContext } from "../Drawer/DrawerStoryKit";

/** The bar every gallery story draws, so the stories differ only in what they set on it. */
export function DemoNavbar({
  menuContainer,
  actions = "button",
  linksLabel,
  ...props
}: NavbarProps & {
  /** What the end of the bar holds: one button, or a search field and an account menu. */
  actions?: "button" | "rich" | "none";
  /** Names this bar's navigation, for a gallery of several bars where the default name would repeat. */
  linksLabel?: string;
}) {
  return (
    <Navbar menuContainer={menuContainer} {...props}>
      <Navbar.Brand href="#">Acme</Navbar.Brand>
      <Navbar.Links aria-label={linksLabel}>
        <Navbar.Link href="#products" current>
          Products
        </Navbar.Link>
        <Navbar.Link href="#pricing">Pricing</Navbar.Link>
        <Navbar.Link href="#docs">Docs</Navbar.Link>
        <Navbar.Link href="#beta" disabled>
          Beta
        </Navbar.Link>
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
