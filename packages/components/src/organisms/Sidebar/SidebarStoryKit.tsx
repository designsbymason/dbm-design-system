import {
  BookOpenIcon,
  ChartBarIcon,
  FolderSimpleIcon,
  GearIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  TrayIcon,
  UsersIcon,
} from "@dbm-design-system/icons";
import { useCallback, useState, useSyncExternalStore } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Avatar } from "../../atoms/Avatar";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { SearchInput } from "../../molecules/SearchInput";
import { Sidebar, useSidebar } from "./Sidebar";
import type { SidebarProps } from "./Sidebar.types";

import { DrawerStage } from "../Drawer/DrawerStoryKit";

export { DrawerViewModeContext as SidebarViewModeContext } from "../Drawer/DrawerStoryKit";

/**
 * The dashed box a demo is drawn in (`DrawerStage`, which keeps an open phone panel inside it), with its one child stretched to fill the
 * box in both directions, so a sidebar is as tall as the box whatever height the box takes.
 */
export function SidebarStage({
  children,
  minBlockSize,
}: {
  children: (container: HTMLElement | null) => ReactNode;
  minBlockSize?: string;
}) {
  return (
    <DrawerStage minBlockSize={minBlockSize}>
      {(container) => (
        <div style={{ alignSelf: "stretch", justifySelf: "stretch", display: "grid", gridTemplateRows: "minmax(0, 1fr)", minInlineSize: 0 }}>
          {children(container)}
        </div>
      )}
    </DrawerStage>
  );
}

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
      <Avatar name="John Doe" size="sm" />
      {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>John Doe</span>}
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
 * A box shaped like a page: the sidebar at one edge and a placeholder for the content beside it, at least `height` tall (so the sidebar's own
 * scrolling shows) and as tall as the demo box when that is taller. The content area is the page's, so it grows as the sidebar shrinks to a rail.
 */
export function SidebarFrame({
  children,
  height = "32rem",
  contentLabel = "Page content",
  reverse = false,
  dir,
  fixed = false,
}: {
  children: ReactNode;
  height?: string;
  contentLabel?: string;
  /** Puts the sidebar at the end of the frame, for a `side="end"` demo. */
  reverse?: boolean;
  /** The frame's reading direction, so a right-to-left page puts its start edge on the right. */
  dir?: "ltr" | "rtl";
  /** Holds the frame at exactly `height`, so a sidebar taller than it scrolls inside it instead of growing it. */
  fixed?: boolean;
}) {
  return (
    <div dir={dir} style={{ ...frameStyle, ...(fixed ? { blockSize: height } : { minBlockSize: height }), flexDirection: reverse ? "row-reverse" : "row" }}>
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

/**
 * A collapsed state that survives a reload: the value is kept in `localStorage` and read through `useSyncExternalStore`, so the server's markup and
 * the first client render agree and the saved value follows. A store that is unavailable or full is ignored, leaving the sidebar working for the
 * visit. This is the "Remember the collapsed state" recipe.
 */
const savedCollapsed = new Map<string, boolean>();
const collapsedListeners = new Set<() => void>();

function subscribeToCollapsed(notify: () => void) {
  collapsedListeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    collapsedListeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

export function useRememberedCollapsed(storageKey: string, fallback = false) {
  // The server (and the first client render) draw `fallback`; the saved value is read right after, so the markup agrees.
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    () => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved !== null) return saved === "true";
      } catch {
        // Storage is blocked (a private window, a policy): use what this visit has chosen.
      }
      return savedCollapsed.get(storageKey) ?? fallback;
    },
    () => fallback,
  );

  const change = useCallback(
    (next: boolean) => {
      savedCollapsed.set(storageKey, next);
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // Not saved: the sidebar still changes for this visit.
      }
      collapsedListeners.forEach((notify) => notify());
    },
    [storageKey],
  );

  return [collapsed, change] as const;
}

const filterTree = [
  { label: "Projects", icon: FolderSimpleIcon, items: ["Active", "Archived", "Templates"] },
  { label: "Reports", icon: ChartBarIcon, items: ["Sales", "Costs", "Forecast"] },
];
const filterLinks = [
  { label: "Home", icon: HouseIcon },
  { label: "Inbox", icon: TrayIcon },
  { label: "Team", icon: UsersIcon },
];

function FilterBody() {
  const { collapsed, setCollapsed } = useSidebar();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(needle);
  const links = filterLinks.filter((link) => matches(link.label));
  // A group whose own name matches shows all its items; otherwise it shows the ones that match, and nothing when none do.
  const groups = filterTree
    .map((group) => ({ ...group, shown: matches(group.label) ? group.items : group.items.filter(matches) }))
    .filter((group) => group.shown.length > 0);
  const count = links.length + groups.reduce((total, group) => total + group.shown.length, 0);
  return (
    <>
      <Sidebar.Header>
        {collapsed ? (
          <Sidebar.Item icon={MagnifyingGlassIcon} onClick={() => setCollapsed(false)}>
            Search
          </Sidebar.Item>
        ) : (
          <SearchInput
            size="sm"
            aria-label="Filter navigation"
            placeholder="Filter…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
          />
        )}
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Nav aria-label="Filtered navigation">
          {links.map((link) => (
            <Sidebar.Item key={link.label} icon={link.icon} href={`#${link.label.toLowerCase()}`} onClick={preventNavigation}>
              {link.label}
            </Sidebar.Item>
          ))}
          {groups.map((group) => (
            <Sidebar.Group key={group.label} label={group.label} icon={group.icon} open={needle ? true : undefined}>
              {group.shown.map((item) => (
                <Sidebar.Item key={item} href={`#${item.toLowerCase()}`} onClick={preventNavigation}>
                  {item}
                </Sidebar.Item>
              ))}
            </Sidebar.Group>
          ))}
          {needle && count === 0 && (
            <li style={{ padding: "var(--dbm-space-2)", color: "var(--dbm-text-secondary)", listStyle: "none" }}>Nothing matches “{query.trim()}”.</li>
          )}
        </Sidebar.Nav>
        <VisuallyHidden role="status">{needle ? `${count} ${count === 1 ? "match" : "matches"}` : ""}</VisuallyHidden>
      </Sidebar.Content>
      <Sidebar.Footer style={{ justifyContent: "space-between" }}>
        <DemoAccount />
        <Sidebar.Toggle />
      </Sidebar.Footer>
    </>
  );
}

/** A sidebar with a filter box at the top that narrows the navigation as you type, and opens the groups that still have a match. */
export function FilterableSidebar(props: SidebarProps) {
  return (
    <Sidebar {...props}>
      <FilterBody />
    </Sidebar>
  );
}
