// The code shown under each story's "Show code" button on Sidebar's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open phone panel inside its Docs frame, the `menuContainer` it is given), which can't
// be pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { SidebarCollapseBelow, SidebarCurrentVariant, SidebarSide, SidebarSize, SidebarVariant } from "./Sidebar.types";

const header = `  <Sidebar.Header>dbM Cloud</Sidebar.Header>`;

const nav = `  <Sidebar.Content>
    <Sidebar.Nav>
      <Sidebar.Item href="/" icon={HouseIcon} current>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/inbox" icon={TrayIcon} badge="12">
        Inbox
      </Sidebar.Item>
      <Sidebar.Group label="Reports" icon={ChartBarIcon}>
        <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
        <Sidebar.Item href="/reports/costs">Costs</Sidebar.Item>
      </Sidebar.Group>
      <Sidebar.Item href="/team" icon={UsersIcon}>
        Team
      </Sidebar.Item>
    </Sidebar.Nav>
  </Sidebar.Content>`;

const footer = `  <Sidebar.Footer>
    <Sidebar.Toggle />
  </Sidebar.Footer>`;

const sidebar = (attributes: string, inner = `${header}\n${nav}\n${footer}`) =>
  `{/* HouseIcon, TrayIcon, ChartBarIcon and UsersIcon come from @dbm-design-system/icons */}
<Sidebar${attributes ? ` ${attributes}` : ""}>
${inner}
</Sidebar>`;

export const sidebarSnippets = {
  variants: `{/* variant: "outlined" (default) | "filled" | "ghost". outlined draws a line along the edge the sidebar does not sit against;
    filled is the same surface with no line; ghost has nothing of its own, so the items sit on the page. */}
${sidebar('variant="filled"')}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" sets the height of an item, its icon and its text. The collapsed rail is one item wide. */}
${sidebar('size="lg"')}`,

  currentVariants: `{/* currentVariant: "subtle" (default) | "bar" | "solid". aria-current="page" is set whichever it is; rounded makes each item a pill. */}
${sidebar('currentVariant="solid" rounded')}`,

  rail: `{/* The Sidebar.Toggle in the footer collapses it to a rail of icons and back. defaultCollapsed starts it as a rail, or hold the
    state yourself: const [collapsed, setCollapsed] = useState(false); */}
${sidebar("collapsed={collapsed} onCollapsedChange={setCollapsed}")}`,

  sections: `{/* A Sidebar.Section is a heading over a list, and Sidebar.Separator a line between parts of one. In the rail the headings are hidden and a line sets the sections apart. */}
<Sidebar>
  <Sidebar.Content>
    <Sidebar.Nav aria-label="Workspace">
      <Sidebar.Section label="Workspace">
        <Sidebar.Item href="/" icon={HouseIcon} current>
          Home
        </Sidebar.Item>
        <Sidebar.Item href="/team" icon={UsersIcon}>
          Team
        </Sidebar.Item>
      </Sidebar.Section>
      <Sidebar.Section label="Admin">
        <Sidebar.Item href="/settings" icon={GearIcon}>
          Settings
        </Sidebar.Item>
      </Sidebar.Section>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  groups: `{/* A Sidebar.Group opens its items beneath it, animated, and nests up to three deep. current starts it open and marks its button while it is shut.
    In the rail a top-level group is an icon button that opens a floating menu, and a nested group a submenu. */}
<Sidebar>
  <Sidebar.Content>
    <Sidebar.Nav>
      <Sidebar.Group label="Reports" icon={ChartBarIcon} current>
        <Sidebar.Item href="/reports/sales" current>
          Sales
        </Sidebar.Item>
        <Sidebar.Group label="Regional">
          <Sidebar.Item href="/reports/emea">EMEA</Sidebar.Item>
          <Sidebar.Item href="/reports/apac">APAC</Sidebar.Item>
        </Sidebar.Group>
      </Sidebar.Group>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  items: `{/* An item with an href is a link; without one it is a button (an action). badge is a count or a Badge you pass; an http(s) address is external
    (a new tab, a trailing icon, a hidden cue). disabled keeps it focusable, as Link does. */}
<Sidebar.Nav>
  <Sidebar.Item href="/" icon={HouseIcon} current>
    Home
  </Sidebar.Item>
  <Sidebar.Item href="/inbox" icon={TrayIcon} badge="12">
    Inbox
  </Sidebar.Item>
  <Sidebar.Item icon={PlusIcon}>New project</Sidebar.Item>
  <Sidebar.Item href="https://example.com/docs" icon={BookOpenIcon}>
    Documentation
  </Sidebar.Item>
  <Sidebar.Item href="/billing" icon={ReceiptIcon} disabled>
    Billing
  </Sidebar.Item>
  {/* asChild puts the look on your router's link: put its component where the <a> is (here a plain anchor). */}
  <Sidebar.Item asChild icon={UsersIcon}>
    <a href="/team">Team</a>
  </Sidebar.Item>
</Sidebar.Nav>`,

  side: `{/* side: "start" (default) | "end". The line moves to the inner edge and the phone panel slides in from that side. In right-to-left text start is the right. */}
${sidebar('side="end"')}

{/* dir="rtl": the sidebar sits at the right, indents and arrows mirror, and side="start" is the right edge. */}
${sidebar('dir="rtl" labels={{ collapse: "طي الشريط الجانبي", expand: "توسيع الشريط الجانبي", menu: "القائمة", navigation: "الرئيسية", close: "إغلاق" }}')}`,

  panel: `{/* Below collapseBelow ("md" = 768px) the sidebar leaves the page and a Sidebar.MenuButton opens it in a side panel. The same children are drawn
    in both, so give the items no id. The panel is never a rail. A button of your own can open it with useSidebar().setMenuOpen(true). */}
<Sidebar.Provider collapseBelow="md">
  <header>
    <Sidebar.MenuButton />
  </header>
${sidebar("")}
</Sidebar.Provider>`,

  pageShell: `{/* A Sidebar.Provider holds the state for the page, so a Sidebar.Toggle or Sidebar.MenuButton outside the sidebar (here in the page header) acts on it. */}
<Sidebar.Provider>
  <header>
    <Sidebar.MenuButton />
    <Sidebar.Toggle />
  </header>
  <div style={{ display: "flex" }}>
${sidebar("sticky")}
    <main id="main">Page content</main>
  </div>
</Sidebar.Provider>`,

  yourOwnParts: `{/* const { collapsed } = useSidebar(); reads the state from inside a Sidebar or a Sidebar.Provider, so the header can draw the brand's mark alone in the rail. */}
<Sidebar.Header>
  <Avatar name="dbM" shape="square" size="sm" />
  {!collapsed && "dbM Cloud"}
</Sidebar.Header>`,

  controlledPanel: `{/* const [open, setOpen] = useState(false); and the reason for the last change: const [reason, setReason] = useState(""); */}
${sidebar("menuOpen={open} onMenuOpenChange={(next, details) => { setOpen(next); setReason(details.reason); }}")}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SidebarPlaygroundSnippetArgs {
  variant?: SidebarVariant;
  size?: SidebarSize;
  currentVariant?: SidebarCurrentVariant;
  rounded?: boolean;
  width?: string;
  side?: SidebarSide;
  defaultCollapsed?: boolean;
  collapseBelow?: SidebarCollapseBelow;
  defaultMenuOpen?: boolean;
  closeMenuOnNavigate?: boolean;
  sticky?: boolean;
  stickyOffset?: number;
  dir?: "ltr" | "rtl";
  id?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, in the order the
 * controls and the Properties table list them, around a small real sidebar. `stickyOffset` is written only while the sidebar is
 * `sticky`, since it does nothing otherwise.
 */
export function sidebarPlaygroundSnippet(args: SidebarPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "outlined") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.currentVariant && args.currentVariant !== "subtle") attributes.push(`currentVariant="${args.currentVariant}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.width) attributes.push(`width=${quote(args.width)}`);
  if (args.side && args.side !== "start") attributes.push(`side="${args.side}"`);
  if (args.defaultCollapsed) attributes.push("defaultCollapsed");
  if (args.collapseBelow && args.collapseBelow !== "md") attributes.push(`collapseBelow="${args.collapseBelow}"`);
  if (args.defaultMenuOpen) attributes.push("defaultMenuOpen");
  if (args.closeMenuOnNavigate === false) attributes.push("closeMenuOnNavigate={false}");
  if (args.sticky) {
    attributes.push("sticky");
    if (args.stickyOffset) attributes.push(`stickyOffset={${args.stickyOffset}}`);
  }
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args.id) attributes.push(`id=${quote(args.id)}`);
  return sidebar(attributes.join(" "));
}
