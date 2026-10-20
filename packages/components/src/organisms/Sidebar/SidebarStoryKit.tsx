import {
  BookOpenIcon,
  ChartBarIcon,
  FolderSimpleIcon,
  GearIcon,
  HouseIcon,
  TrayIcon,
  UsersIcon,
} from "@dbm-design-system/icons";
import { useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Avatar } from "../../atoms/Avatar";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Sidebar, useSidebar } from "./Sidebar";
import type { SidebarProps } from "./Sidebar.types";

export { DrawerStage as SidebarStage, DrawerViewModeContext as SidebarViewModeContext } from "../Drawer/DrawerStoryKit";

/**
 * What a demo sidebar's items share so that choosing one moves the "current" mark to it instead of leaving the page, the way a router
 * would: each item is `current` while it is the chosen one, and a click records it and keeps the browser where it is.
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
    /** The props of a `Sidebar.Item`. */
    item: (id: string) => ({ ...anchor(id), current: chosen === id }),
    /** True while the chosen item is inside the given ones, so a group can say it holds the current page. */
    holds: (...ids: string[]) => ids.includes(chosen),
    /** The props of an `<a>` a `Sidebar.Item asChild` draws on, which has no `current` of its own. */
    anchor,
  };
}

/** The brand a demo header draws: smaller in the rail, where there is room for the mark only. */
export function DemoBrand() {
  const { collapsed } = useSidebar();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--dbm-space-2)", fontWeight: "var(--dbm-font-weight-bold)" }}>
      <Avatar name="dbM" shape="square" size="sm" colorful />
      {!collapsed && <span>dbM Cloud</span>}
    </span>
  );
}

/** The account a demo footer draws: the avatar alone in the rail. */
export function DemoAccount() {
  const { collapsed } = useSidebar();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--dbm-space-2)", minInlineSize: 0 }}>
      <Avatar name="Mason Reed" size="sm" />
      {!collapsed && (
        <Text size="sm" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Mason Reed
        </Text>
      )}
    </span>
  );
}

/**
 * The sidebar every gallery story draws, so the stories differ only in what they set on it. It has the three bands, two sections, plain
 * items, a badge, an external link, a group and a group nested in one.
 */
export function DemoSidebar({
  initial = "home",
  toggle = true,
  footer = true,
  header = true,
  sections = true,
  navLabel,
  ...props
}: SidebarProps & {
  /** The id of the item that starts as the current page. */
  initial?: string;
  /** Whether the footer holds the collapse button. */
  toggle?: boolean;
  /** Whether there is a footer at all. */
  footer?: boolean;
  /** Whether there is a header at all. */
  header?: boolean;
  /** Whether the items are in sections (with headings) or one plain list. */
  sections?: boolean;
  /** The navigation's name. */
  navLabel?: string;
}) {
  const demo = useDemoCurrent(initial);
  const workspace = (
    <>
      <Sidebar.Item icon={HouseIcon} {...demo.item("home")}>
        Home
      </Sidebar.Item>
      <Sidebar.Item icon={TrayIcon} badge="12" {...demo.item("inbox")}>
        Inbox
      </Sidebar.Item>
      <Sidebar.Group label="Projects" icon={FolderSimpleIcon} current={demo.holds("active", "archived")}>
        <Sidebar.Item {...demo.item("active")}>Active</Sidebar.Item>
        <Sidebar.Item {...demo.item("archived")}>Archived</Sidebar.Item>
      </Sidebar.Group>
      <Sidebar.Group label="Reports" icon={ChartBarIcon} current={demo.holds("sales", "emea", "apac")}>
        <Sidebar.Item {...demo.item("sales")}>Sales</Sidebar.Item>
        <Sidebar.Group label="Regional" current={demo.holds("emea", "apac")}>
          <Sidebar.Item {...demo.item("emea")}>EMEA</Sidebar.Item>
          <Sidebar.Item {...demo.item("apac")}>APAC</Sidebar.Item>
        </Sidebar.Group>
      </Sidebar.Group>
      <Sidebar.Item icon={UsersIcon} {...demo.item("team")}>
        Team
      </Sidebar.Item>
    </>
  );
  const settings = (
    <>
      <Sidebar.Item icon={GearIcon} {...demo.item("settings")}>
        Settings
      </Sidebar.Item>
      <Sidebar.Item icon={BookOpenIcon} href="https://example.com/docs" onClick={(event) => event.preventDefault()}>
        Documentation
      </Sidebar.Item>
    </>
  );
  return (
    <Sidebar {...props}>
      {header && (
        <Sidebar.Header>
          <DemoBrand />
        </Sidebar.Header>
      )}
      <Sidebar.Content>
        <Sidebar.Nav aria-label={navLabel}>
          {sections ? (
            <>
              <Sidebar.Section label="Workspace">{workspace}</Sidebar.Section>
              <Sidebar.Section label="Admin">{settings}</Sidebar.Section>
            </>
          ) : (
            <>
              {workspace}
              <Sidebar.Separator />
              {settings}
            </>
          )}
        </Sidebar.Nav>
      </Sidebar.Content>
      {footer && (
        <Sidebar.Footer style={{ justifyContent: "space-between" }}>
          <DemoAccount />
          {toggle && <Sidebar.Toggle />}
        </Sidebar.Footer>
      )}
    </Sidebar>
  );
}

const frameStyle: CSSProperties = {
  display: "flex",
  inlineSize: "100%",
  overflow: "hidden",
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-lg)",
  background: "var(--dbm-bg-canvas)",
};

/**
 * A box shaped like a page: the sidebar at one edge and a placeholder for the content beside it, a fixed height so the sidebar's own
 * scrolling shows. The content area is the page's, so it grows as the sidebar shrinks to a rail.
 */
export function SidebarFrame({
  children,
  height = "32rem",
  contentLabel = "Page content",
  reverse = false,
  dir,
}: {
  children: ReactNode;
  height?: string;
  contentLabel?: string;
  /** Puts the sidebar at the end of the frame, for a `side="end"` demo. */
  reverse?: boolean;
  /** The frame's reading direction, so a right-to-left page puts its start edge on the right. */
  dir?: "ltr" | "rtl";
}) {
  return (
    <div dir={dir} style={{ ...frameStyle, blockSize: height, flexDirection: reverse ? "row-reverse" : "row" }}>
      {children}
      <div style={{ flex: "1 1 auto", minInlineSize: 0, padding: "var(--dbm-space-6)" }}>
        <Text color="secondary">{contentLabel}</Text>
      </div>
    </div>
  );
}

/** A demo page header with the button that opens the phone panel, below the step where the sidebar leaves the page. */
export function DemoTopBar({ children }: { children?: ReactNode }) {
  const { setMenuOpen } = useSidebar();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--dbm-space-3)",
        padding: "var(--dbm-space-2) var(--dbm-space-4)",
        borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
        background: "var(--dbm-bg-surface)",
      }}
    >
      <Sidebar.MenuButton />
      {children}
      <Button size="sm" variant="secondary" onClick={() => setMenuOpen(true)} style={{ marginInlineStart: "auto" }}>
        Open the panel
      </Button>
    </div>
  );
}

/** Stops a demo link from navigating: a story's link goes nowhere, so it must not load another page. */
export function preventNavigation(event: MouseEvent) {
  event.preventDefault();
}
