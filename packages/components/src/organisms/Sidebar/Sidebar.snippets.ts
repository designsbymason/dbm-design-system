// The code shown under each story's "Show code" button on Sidebar's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open phone panel inside its Docs frame, the `menuContainer` it is given), which can't
// be pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { SidebarCollapseBelow, SidebarCurrentVariant, SidebarSide, SidebarSize, SidebarVariant } from "./Sidebar.types";

const iconsNote = `{/* The icons (HouseIcon, TrayIcon, FolderSimpleIcon, ChartBarIcon, UsersIcon, GearIcon, BookOpenIcon) come from @dbm-design-system/icons */}`;

const indent = (code: string, spaces: number) =>
  code
    .split("\n")
    .map((line) => (line ? " ".repeat(spaces) + line : line))
    .join("\n");

/** What the demo sidebar draws, so a snippet shows what its story shows: the header, two sections of items and groups, and the footer. */
interface DemoOptions {
  /** The item that is the current page. */
  current?: "home" | "sales" | "emea";
  /** Whether the footer holds the collapse button, or there is no footer at all. */
  footer?: "toggle" | "account" | "none";
}

const demoBody = ({ current = "home", footer = "toggle" }: DemoOptions = {}) => {
  const home = current === "home" ? " current" : "";
  const sales = current === "sales" ? " current" : "";
  const emea = current === "emea" ? " current" : "";
  const holdsSales = current === "sales" || current === "emea" ? " current" : "";
  const holdsRegional = current === "emea" ? " current" : "";
  const parts = [
    `<Sidebar.Header>
  <Avatar name="dbM" shape="square" size="sm" colorful />
  dbM Cloud
</Sidebar.Header>`,
    `<Sidebar.Content>
  <Sidebar.Nav>
    <Sidebar.Section label="Workspace">
      <Sidebar.Item href="/" icon={HouseIcon}${home}>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/inbox" icon={TrayIcon} badge="12">
        Inbox
      </Sidebar.Item>
      <Sidebar.Group label="Projects" icon={FolderSimpleIcon}>
        <Sidebar.Item href="/projects/active">Active</Sidebar.Item>
        <Sidebar.Item href="/projects/archived">Archived</Sidebar.Item>
      </Sidebar.Group>
      <Sidebar.Group label="Reports" icon={ChartBarIcon}${holdsSales}>
        <Sidebar.Item href="/reports/sales"${sales}>
          Sales
        </Sidebar.Item>
        <Sidebar.Group label="Regional"${holdsRegional}>
          <Sidebar.Item href="/reports/emea"${emea}>
            EMEA
          </Sidebar.Item>
          <Sidebar.Item href="/reports/apac">APAC</Sidebar.Item>
        </Sidebar.Group>
      </Sidebar.Group>
      <Sidebar.Item href="/team" icon={UsersIcon}>
        Team
      </Sidebar.Item>
    </Sidebar.Section>
    <Sidebar.Section label="Admin">
      <Sidebar.Item href="/settings" icon={GearIcon}>
        Settings
      </Sidebar.Item>
      <Sidebar.Item href="https://example.com/docs" icon={BookOpenIcon}>
        Documentation
      </Sidebar.Item>
    </Sidebar.Section>
  </Sidebar.Nav>
</Sidebar.Content>`,
  ];
  if (footer === "toggle") {
    parts.push(`<Sidebar.Footer>
  <Avatar name="John Doe" size="sm" />
  John Doe
  <Sidebar.Toggle />
</Sidebar.Footer>`);
  } else if (footer === "account") {
    parts.push(`<Sidebar.Footer>
  <Avatar name="John Doe" size="sm" />
  John Doe
</Sidebar.Footer>`);
  }
  return parts.map((part) => indent(part, 2)).join("\n");
};

/** The demo sidebar with the given attributes: what the Playground and the gallery stories draw. */
const sidebar = (attributes: string, options?: DemoOptions) =>
  `${iconsNote}
<Sidebar${attributes ? ` ${attributes}` : ""}>
${demoBody(options)}
</Sidebar>`;

export const sidebarSnippets = {
  variants: `{/* variant: "outlined" (default) | "filled" | "ghost". outlined draws a line along the edge the sidebar does not sit against;
    filled is the same surface with no line; ghost has nothing of its own, so the items sit on the page. */}
${sidebar('variant="filled"')}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" sets the height of an item, its icon and its text. The collapsed rail is one item wide. */}
${sidebar('size="lg"')}`,

  currentVariants: `{/* currentVariant: "subtle" (default) | "bar" | "solid". aria-current="page" is set whichever it is; rounded makes each item a pill.
    A group that holds the current page starts open and says so with current. */}
${sidebar('currentVariant="solid" rounded', { current: "sales" })}`,

  rail: `{/* The Sidebar.Toggle in the footer collapses it to a rail of icons and back. defaultCollapsed starts it as a rail; to hold the state
    yourself, pass collapsed and onCollapsedChange instead. */}
${sidebar("defaultCollapsed")}`,

  sections: `{/* A Sidebar.Section is a heading over a list, drawn in capitals, and Sidebar.Separator a plain line between parts of one. In the rail the
    headings are hidden and a line sets the sections apart. */}
${sidebar("")}

{/* One list and a separator, with no headings. */}
<Sidebar>
  <Sidebar.Content>
    <Sidebar.Nav aria-label="Plain navigation">
      <Sidebar.Item href="/" icon={HouseIcon} current>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/team" icon={UsersIcon}>
        Team
      </Sidebar.Item>
      <Sidebar.Separator />
      <Sidebar.Item href="/settings" icon={GearIcon}>
        Settings
      </Sidebar.Item>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  groups: `{/* A Sidebar.Group opens its items beneath it, animated, and nests up to three deep. current starts a group open and marks its button while it is shut.
    In the rail a top-level group is an icon button that opens a floating menu, and a nested group a submenu. */}
${sidebar("", { current: "emea", footer: "none" })}`,

  items: `{/* An item with an href is a link; without one it is a button (an action). badge is a count, or a Badge you pass, drawn as written (its tone, variant,
    size, className and style win over the built-in badge). An http(s) address is external (a new tab, a trailing icon, a hidden cue). disabled keeps it
    focusable, as Link does. asChild puts the look on your router's link: put its component where the <a> is (here a plain anchor); the item's icon and text are then the child's own. */}
<Sidebar.Nav>
  <Sidebar.Item href="/" icon={HouseIcon} current>
    A link, the current page
  </Sidebar.Item>
  <Sidebar.Item href="/inbox" icon={TrayIcon} badge="12">
    A link with a count
  </Sidebar.Item>
  <Sidebar.Item href="/alerts" icon={BellIcon} badge={<Badge tone="danger" variant="solid">3</Badge>}>
    A link with a Badge
  </Sidebar.Item>
  <Sidebar.Item icon={PlusIcon}>A button (an action)</Sidebar.Item>
  <Sidebar.Item href="https://example.com/docs" icon={BookOpenIcon}>
    An external link
  </Sidebar.Item>
  <Sidebar.Item href="/billing" icon={ReceiptIcon} disabled>
    A disabled link
  </Sidebar.Item>
  <Sidebar.Item asChild>
    <a href="/team">
      <Icon icon={UsersIcon} size="md" />
      A router's link (asChild)
    </a>
  </Sidebar.Item>
</Sidebar.Nav>`,

  actions: `{/* action is a control at the end of a row, beside the link and not inside it: an IconButton, or a Menu's trigger. It shows while the row
    is hovered or has focus (always on a touch screen and in the phone panel), and its buttons default to ghost, neutral and xs. Items, groups and
    sections take one; the rail draws none. */}
<Sidebar.Nav>
  <Sidebar.Section label="Projects" action={<IconButton icon={PlusIcon} aria-label="New project" />}>
    <Sidebar.Item
      href="/website"
      icon={FolderSimpleIcon}
      action={
        <Menu>
          <Menu.Trigger asChild>
            <IconButton icon={DotsThreeIcon} aria-label="More options for Website" />
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Rename</Menu.Item>
            <Menu.Item>Archive</Menu.Item>
          </Menu.Content>
        </Menu>
      }
    >
      Website
    </Sidebar.Item>
    <Sidebar.Item href="/mobile" icon={FolderSimpleIcon} badge="3" action={<IconButton icon={PlusIcon} aria-label="Add a task to Mobile app" />}>
      Mobile app
    </Sidebar.Item>
    <Sidebar.Group label="Reports" icon={ChartBarIcon} defaultOpen action={<IconButton icon={PlusIcon} aria-label="New report" />}>
      <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
    </Sidebar.Group>
  </Sidebar.Section>
</Sidebar.Nav>`,

  longLabels: `{/* A label longer than the room is cut with an ellipsis, and a tooltip shows all of it on hover and focus. A label that fits gets none. */}
<Sidebar width="13rem">
  <Sidebar.Content>
    <Sidebar.Nav aria-label="Long labels">
      <Sidebar.Item href="/planning" icon={FolderSimpleIcon} badge="12">
        Quarterly planning and budget review
      </Sidebar.Item>
      <Sidebar.Item href="/settings" icon={GearIcon}>
        Settings
      </Sidebar.Item>
      <Sidebar.Group label="Customer success and account management" icon={UsersIcon}>
        <Sidebar.Item href="/onboarding">Onboarding checklists for new enterprise accounts</Sidebar.Item>
      </Sidebar.Group>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  currentPath: `{/* currentPath is the page the reader is on, from your router (here a made-up usePathname()), so each item marks itself from its href with no
    current written on it, and a group that holds one is current too. An item's own current always wins; match="prefix" also matches the pages below
    it. Query strings, hashes and trailing slashes are ignored. */}
<Sidebar currentPath={usePathname()}>
  <Sidebar.Content>
    <Sidebar.Nav>
      <Sidebar.Item href="/" icon={HouseIcon}>
        Home
      </Sidebar.Item>
      <Sidebar.Item href="/projects" icon={FolderSimpleIcon} match="prefix">
        Projects (and below)
      </Sidebar.Item>
      <Sidebar.Group label="Reports" icon={ChartBarIcon}>
        <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
        <Sidebar.Item href="/reports/costs">Costs</Sidebar.Item>
      </Sidebar.Group>
    </Sidebar.Nav>
  </Sidebar.Content>
</Sidebar>`,

  side: `{/* side: "start" (default) | "end". The line moves to the inner edge and the phone panel slides in from that side. */}
${sidebar('side="end"')}

{/* dir="rtl": the sidebar sits at the right, indents and arrows mirror, and side="start" is the right edge. */}
${sidebar('dir="rtl" labels={{ collapse: "طي الشريط الجانبي", expand: "توسيع الشريط الجانبي", menu: "القائمة", navigation: "الرئيسية", close: "إغلاق" }}')}`,

  panel: `{/* Below collapseBelow ("md" = 768px) the sidebar leaves the page and a Sidebar.MenuButton opens it in a side panel. The same children are drawn
    in both, so give the items no id. The panel is never a rail. A button of your own can open it with useSidebar().setMenuOpen(true). This demo
    collapses below the widest step ("3xl") so the menu button shows on any window narrower than 1920px. */}
<Sidebar.Provider collapseBelow="3xl">
  <header>
    <Sidebar.MenuButton />
    <Button size="sm" variant="secondary" onClick={() => setMenuOpen(true)}>
      Open the panel
    </Button>
  </header>
${indent(sidebar(""), 2)}
</Sidebar.Provider>`,

  pageShell: `{/* A Sidebar.Provider holds the state for the page, so a Sidebar.Toggle or Sidebar.MenuButton outside the sidebar (here in the page header) acts on it.
    The sidebar has no toggle of its own here. */}
<Sidebar.Provider>
  <header>
    <Sidebar.MenuButton />
    <Sidebar.Toggle aria-label="Collapse or expand the sidebar" />
  </header>
  <div style={{ display: "flex" }}>
${indent(sidebar("", { footer: "account" }), 4)}
    <main id="main">Page content</main>
  </div>
</Sidebar.Provider>`,

  yourOwnParts: `{/* const { collapsed } = useSidebar(); reads the state from inside a Sidebar or a Sidebar.Provider, so the header can draw the brand's mark alone in the rail. */}
<Sidebar.Header>
  <Avatar name="dbM" shape="square" size="sm" />
  {!collapsed && "dbM Cloud"}
</Sidebar.Header>`,

  controlledPanel: `{/* const [collapsed, setCollapsed] = useState(false); and the reason the panel last changed: const [reason, setReason] = useState(""); */}
${sidebar("collapsed={collapsed} onCollapsedChange={setCollapsed} onMenuOpenChange={(open, details) => setReason(details.reason)}")}`,
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
