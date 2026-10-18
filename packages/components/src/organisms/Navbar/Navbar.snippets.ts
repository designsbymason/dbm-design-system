// The code shown under each story's "Show code" button on Navbar's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open menu panel inside its Docs frame, the `menuContainer` it is given), which can't
// be pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { NavbarCollapseBelow, NavbarCurrentVariant, NavbarSize, NavbarVariant } from "./Navbar.types";

const brand = `  <Navbar.Brand href="/">dbM</Navbar.Brand>`;

const links = `  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
    <Navbar.Link href="/pricing">Pricing</Navbar.Link>
    <Navbar.Link href="/docs">Docs</Navbar.Link>
    <Navbar.Link href="/beta" disabled>
      Beta
    </Navbar.Link>
  </Navbar.Links>`;

const actions = `  <Navbar.Actions>
    <Button size="sm">Sign in</Button>
  </Navbar.Actions>`;

const navbar = (attributes: string, inner = `${brand}\n${links}\n${actions}`) =>
  `<Navbar${attributes ? ` ${attributes}` : ""}>
${inner}
</Navbar>`;

export const navbarSnippets = {
  variants: `{/* variant: "outlined" (default) | "filled" | "ghost" */}
${navbar('variant="filled"')}`,

  currentVariants: `{/* currentVariant: "underline" (default) | "subtle" | "solid". One look for the whole bar, the phone panel included;
    aria-current="page" is set whichever it is. */}
${navbar('currentVariant="solid"')}`,

  responsiveActions: `{/* Navbar.Action hideBelow takes an action out of the bar below a width; Navbar.PanelActions is where it comes
    back, at the foot of the menu panel. PanelActions is drawn only in the panel; put it among the bar's children or in a row. This demo uses
    the widest step ("3xl") for both so it shows on any window narrower than 1920px; an app picks the step that suits it. */}
<Navbar collapseBelow="3xl">
  <Navbar.Brand href="/">dbM</Navbar.Brand>
  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
  </Navbar.Links>
  <Navbar.Actions>
    <Navbar.Action>
      <SearchInput aria-label="Search" size="sm" />
    </Navbar.Action>
    <Navbar.Action hideBelow="3xl">
      <Button size="sm">Sign in</Button>
    </Navbar.Action>
  </Navbar.Actions>
  <Navbar.PanelActions>
    <Button>Sign in</Button>
  </Navbar.PanelActions>
</Navbar>`,

  skipLink: `{/* Put the skip link first in the bar, and the bar first on the page. Its href names the main element's id, which needs
    tabIndex={-1} to receive focus. */}
<Navbar>
  <Navbar.SkipLink href="#main" />
  <Navbar.Brand href="/">dbM</Navbar.Brand>
  <Navbar.Links>
    <Navbar.Link href="/products">Products</Navbar.Link>
  </Navbar.Links>
</Navbar>
<main id="main" tabIndex={-1}>
  …
</main>`,

  linkExtras: `{/* icon goes before the text; badge after it, and is part of the link's name ("Inbox 3"); an href starting http(s):// or //
    is external (a new tab, a trailing icon and a hidden cue), or say it with external. */}
<Navbar.Links>
  <Navbar.Link href="/pricing" badge="New">
    Pricing
  </Navbar.Link>
  <Navbar.Link href="/docs" icon={BookOpenIcon}>
    Docs
  </Navbar.Link>
  <Navbar.Link href="/inbox" icon={BellIcon} badge="3">
    Inbox
  </Navbar.Link>
  <Navbar.Link href="https://status.example.com">Status</Navbar.Link>
</Navbar.Links>`,

  linksAlign: `{/* align: "start" (default, next to the brand) | "center" (in the room between the brand and the actions) | "end" */}
<Navbar>
  <Navbar.Brand href="/">dbM</Navbar.Brand>
  <Navbar.Links align="center">
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
    <Navbar.Link href="/pricing">Pricing</Navbar.Link>
  </Navbar.Links>
  <Navbar.Actions>
    <Button size="sm">Sign in</Button>
  </Navbar.Actions>
</Navbar>`,

  ghostSticky: `{/* A sticky ghost bar is transparent over the page until it is stuck, then takes a surface and a shadow. boxRef is the
    scrolling box, as in the sticky example; leave scrollContainerRef out to stick to the page. */}
<Navbar sticky variant="ghost" scrollContainerRef={boxRef}>
  <Navbar.Brand href="/">dbM</Navbar.Brand>
  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
  </Navbar.Links>
</Navbar>`,

  hideOnScroll: `{/* hideOnScroll slides a sticky bar away while the reader scrolls down and brings it back on a scroll up or near the top. It
    stays while anything in it has focus. boxRef is the scrolling box, as in the sticky example; leave scrollContainerRef out to follow
    the page's own scroll. */}
<Navbar sticky hideOnScroll scrollContainerRef={boxRef}>
  <Navbar.Brand href="/">dbM</Navbar.Brand>
  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
  </Navbar.Links>
</Navbar>`,

  rows: `{/* A multi-row header is still one <header>. Each Navbar.Row is a band, with its own variant, size and contained (they start from
    the bar's): here a thin strip (xs), a taller logo row (lg) and a row of links (sm), none of them current, as on a home page. The search field is centred in the room
    between the logo and the buttons (an auto margin on it, and the actions' own push to the end cancelled).
    Several Navbar.Links are allowed: give each its own aria-label, and quiet for a courtesy row's. On a phone (columns) the row is
    three columns: the menu and search buttons at the start, the logo in the centre, the other buttons at the end, so the logo stays
    central however many are on each side. Write the brand first (the page and a wide window read it first); the menu button is drawn
    first in its column wherever it is. Each icon button has a caption under it on a wide window: your own markup and CSS (IconButton has no visible label), a
    column with the caption hidden below the step the row goes into columns at (.caption { display: none } @media (min-width: 48rem)
    { .caption { display: block } }); the caption is aria-hidden as the button's own name says it, and has a negative margin-block-start (space-1) to sit close to the
    icon, with pointer-events: none. They are medium, neutral, tertiary icon buttons here (variant, tone and size on Navbar.MenuButton, buttonVariant, buttonTone and
    buttonSize on Navbar.Search, which keeps its field small). A style on Navbar.Links sets the text of all its links. */}
<Navbar>
  <Navbar.Row size="xs" variant="outlined" sticky={false}>
    <Navbar.Links aria-label="Help" quiet align="end">
      <Navbar.Link href="/help">Help</Navbar.Link>
      <Navbar.Link href="/orders">Track an order</Navbar.Link>
      <Navbar.Link href="/stores">Find a store</Navbar.Link>
    </Navbar.Links>
  </Navbar.Row>
  <Navbar.Row size="lg" variant="outlined" columns="balanced">
    <Navbar.Brand href="/">
      dbM
    </Navbar.Brand>
    <Navbar.Search size="sm" buttonVariant="tertiary" buttonTone="neutral" buttonSize="md" placeholder="Search products" style={{ marginInline: "auto" }} />
    <Navbar.Actions style={{ marginInlineStart: 0 }}>
      <span className="labelled">
        <IconButton icon={UserCircleIcon} aria-label="Account" variant="tertiary" tone="neutral" size="md" />
        <span className="caption" aria-hidden="true">Account</span>
      </span>
      <span className="labelled">
        <IconButton icon={ShoppingCartIcon} aria-label="Cart, 2 items" variant="tertiary" tone="neutral" size="md" />
        <span className="caption" aria-hidden="true">Cart</span>
      </span>
    </Navbar.Actions>
    <Navbar.MenuButton variant="tertiary" tone="neutral" size="md" />
  </Navbar.Row>
  <Navbar.Row size="sm" variant="outlined">
    <Navbar.Links
      aria-label="Categories"
      align="center"
      style={{ fontSize: "var(--dbm-font-size-sm)", fontWeight: "var(--dbm-font-weight-bold)", textTransform: "uppercase" }}
    >
      <Navbar.Link href="/women">Women</Navbar.Link>
      <Navbar.Link href="/men">Men</Navbar.Link>
      <Navbar.Link href="/kids">Kids</Navbar.Link>
      <Navbar.Link href="/sale">Sale</Navbar.Link>
    </Navbar.Links>
  </Navbar.Row>
</Navbar>`,

  columns: `{/* columns draws a row below columnsBelow ("md" unless set) as three columns: the menu and search buttons at the start, the logo in
    the centre, the other buttons at the end. "balanced" gives the sides equal room, so the logo is central however many are on each side
    (here one button at the start and two at the end). Each part is in the column it belongs in unless column says otherwise. The parts
    are in the page in the order written, grouped by column, so write the brand first. Above the step the row flows as without columns. */}
<Navbar>
  <Navbar.Row columns="balanced">
    <Navbar.Brand href="/">dbM</Navbar.Brand>
    <Navbar.Search aria-label="Search products" size="sm" buttonVariant="tertiary" />
    <Navbar.Actions>
      <IconButton icon={UserCircleIcon} aria-label="Account" variant="tertiary" size="sm" />
      <IconButton icon={ShoppingCartIcon} aria-label="Cart, 2 items" variant="tertiary" size="sm" />
    </Navbar.Actions>
  </Navbar.Row>
</Navbar>

{/* A track list sets the widths yourself, and column puts a part in another column than its own: the logo at the start, the field in the
    middle track, which takes the free room, the account button at the end. */}
<Navbar>
  <Navbar.Row columns="auto 1fr auto">
    <Navbar.Brand href="/" column="start">dbM</Navbar.Brand>
    <Navbar.Search aria-label="Search help" column="center" size="sm" collapseBelow="never" />
    <Navbar.Actions>
      <IconButton icon={UserCircleIcon} aria-label="Account" variant="tertiary" size="sm" />
    </Navbar.Actions>
  </Navbar.Row>
</Navbar>`,

  rowsPanel: `{/* Below the collapse width every set of links goes into the one menu panel, in the order written, with the quiet ones last and a
    line between sets; a row that held only links goes with them. This demo collapses below the widest step ("3xl") so the panel shows
    on any window narrower than 1920px; an app picks the step that suits its links. Put Navbar.MenuButton where you want it (here
    after the buttons, drawn first in its column with the search button beside it and the logo centred between them and the buttons); without one, the button goes at the
    end of the row with the brand. */}
<Navbar collapseBelow="3xl">
  <Navbar.Row size="xs" variant="outlined" sticky={false}>
    <Navbar.Links aria-label="Help" quiet align="end">
      <Navbar.Link href="/help">Help</Navbar.Link>
      <Navbar.Link href="/orders">Track an order</Navbar.Link>
      <Navbar.Link href="/stores">Find a store</Navbar.Link>
    </Navbar.Links>
  </Navbar.Row>
  <Navbar.Row size="lg" variant="outlined" columns="balanced" columnsBelow="3xl">
    <Navbar.Brand href="/">
      dbM
    </Navbar.Brand>
    <Navbar.Search size="sm" buttonVariant="tertiary" buttonTone="neutral" buttonSize="md" collapseBelow="3xl" style={{ marginInline: "auto" }} />
    <Navbar.Actions style={{ marginInlineStart: 0 }}>
      <span className="labelled">
        <IconButton icon={UserCircleIcon} aria-label="Account" variant="tertiary" tone="neutral" size="md" />
        <span className="caption" aria-hidden="true">Account</span>
      </span>
      <span className="labelled">
        <IconButton icon={ShoppingCartIcon} aria-label="Cart, 2 items" variant="tertiary" tone="neutral" size="md" />
        <span className="caption" aria-hidden="true">Cart</span>
      </span>
    </Navbar.Actions>
    <Navbar.MenuButton variant="tertiary" tone="neutral" size="md" />
  </Navbar.Row>
  <Navbar.Row size="sm" variant="outlined">
    <Navbar.Links
      aria-label="Categories"
      align="center"
      style={{ fontSize: "var(--dbm-font-size-sm)", fontWeight: "var(--dbm-font-weight-bold)", textTransform: "uppercase" }}
    >
      <Navbar.Link href="/women">Women</Navbar.Link>
      <Navbar.Link href="/men">Men</Navbar.Link>
      <Navbar.Link href="/kids">Kids</Navbar.Link>
      <Navbar.Link href="/sale">Sale</Navbar.Link>
    </Navbar.Links>
  </Navbar.Row>
</Navbar>`,

  search: `{/* Navbar.Search is a role="search" landmark around a SearchInput; it takes the room between its neighbours. Below collapseBelow
    ("md" by default) it is a button that opens the field in a sheet from the top, with a small heading and a field. This demo uses the
    widest step ("3xl"). buttonVariant is the button's look, to match the icon buttons beside it. The bar's field and the sheet's are two
    inputs, so pass value and onChange to keep them in step. */}
<Navbar>
  <Navbar.Brand href="/">dbM</Navbar.Brand>
  <Navbar.Search
    size="sm"
    buttonVariant="tertiary"
    collapseBelow="3xl"
    placeholder="Search products"
    onSearch={(query) => search(query)}
  />
</Navbar>`,

  rowsSticky: `{/* In a sticky bar, a leading row with sticky={false} scrolls away while the rest stays at the top. Only leading rows can: the bar
    sticks as one box. boxRef is the scrolling box, as in the sticky example. */}
<Navbar sticky scrollContainerRef={boxRef}>
  <Navbar.Row size="xs" variant="outlined" sticky={false}>
    <Navbar.Links aria-label="Help" quiet align="end">
      <Navbar.Link href="/help">Help</Navbar.Link>
      <Navbar.Link href="/orders">Track an order</Navbar.Link>
    </Navbar.Links>
  </Navbar.Row>
  <Navbar.Row size="lg" variant="outlined" columns="balanced">
    <Navbar.Brand href="/">
      dbM
    </Navbar.Brand>
    <Navbar.Search size="sm" buttonVariant="tertiary" buttonTone="neutral" buttonSize="md" style={{ marginInline: "auto" }} />
    <Navbar.Actions style={{ marginInlineStart: 0 }}>
      <span className="labelled">
        <IconButton icon={UserCircleIcon} aria-label="Account" variant="tertiary" tone="neutral" size="md" />
        <span className="caption" aria-hidden="true">Account</span>
      </span>
    </Navbar.Actions>
    <Navbar.MenuButton variant="tertiary" tone="neutral" size="md" />
  </Navbar.Row>
  <Navbar.Row size="sm" variant="outlined">
    <Navbar.Links aria-label="Categories" align="center">
      <Navbar.Link href="/women">Women</Navbar.Link>
      <Navbar.Link href="/men">Men</Navbar.Link>
    </Navbar.Links>
  </Navbar.Row>
</Navbar>`,

  rounded: `{/* rounded makes each link and group button a pill; the bar itself keeps its shape. It is the same prop Button,
    IconButton and Toolbar have. */}
<Navbar rounded currentVariant="subtle">
${brand}
  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
    <Navbar.Link href="/pricing">Pricing</Navbar.Link>
    <Navbar.Link href="/docs">Docs</Navbar.Link>
    <Navbar.Link href="/beta" disabled>
      Beta
    </Navbar.Link>
    <Navbar.Group label="Resources">
      <Navbar.Link href="/blog">Blog</Navbar.Link>
      <Navbar.Link href="/guides">Guides</Navbar.Link>
      <Navbar.Link href="/changelog">Changelog</Navbar.Link>
    </Navbar.Group>
  </Navbar.Links>
${actions}
</Navbar>`,

  sizes: `{/* size: "sm" | "md" (default) | "lg". The bar is as tall as an IconButton of the same step plus room. */}
${navbar('size="lg"')}`,

  actions: `{/* Whatever belongs to the whole app goes in Navbar.Actions, at the bar's end. */}
${navbar(
  "",
  `${brand}
${links}
  <Navbar.Actions>
    <SearchInput aria-label="Search" size="sm" />
    <Menu>
      <Menu.Trigger asChild>
        <IconButton icon={UserCircleIcon} aria-label="Account" variant="ghost" />
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Profile</Menu.Item>
        <Menu.Item>Sign out</Menu.Item>
      </Menu.Content>
    </Menu>
  </Navbar.Actions>`,
)}`,

  group: `{/* A Navbar.Group is a dropdown in the bar (a Menu of its links) and an expandable group in the phone panel. current
    marks a group that holds the current page; it also starts the group expanded in the panel. */}
<Navbar>
  <Navbar.Links>
    <Navbar.Link href="/products">Products</Navbar.Link>
    <Navbar.Group label="Resources">
      <Navbar.Link href="/blog">Blog</Navbar.Link>
      <Navbar.Link href="/guides">Guides</Navbar.Link>
      <Navbar.Link href="/changelog">Changelog</Navbar.Link>
    </Navbar.Group>
  </Navbar.Links>
</Navbar>`,

  contained: `{/* contained keeps the content to the page's reading width, centred; the bar itself still spans the page. */}
${navbar('contained variant="filled"')}`,

  collapse: `{/* collapseBelow: "sm" | "md" (default) | "lg" | "xl" | "2xl" | "3xl" | "never". Below the width the links
    leave the bar for a menu button. The switch is a stylesheet's, so a server-rendered page is right at first paint. */}
${navbar('collapseBelow="lg"')}`,

  menu: `{/* Below the collapse width the same Navbar.Link items fill a menu panel (a Drawer) behind a button. menuSide is
    "start" (default) | "end" | "top" | "bottom", and start and end swap in right-to-left. This demo collapses below the widest
    step ("3xl") so the panel shows on any window narrower than 1920px; an app picks the step that suits its links (the default
    is "md"). */}
${navbar('collapseBelow="3xl"')}`,

  onAPhone: `{/* The default collapseBelow is "md": on a window narrower than 768px the links leave the bar and the menu button
    opens them in a panel. */}
${navbar("")}`,

  sticky: `{/* sticky keeps the bar at the top as the page scrolls, with a shadow while it is stuck. In a scrolling box of your own,
    scrollContainerRef names it: const boxRef = useRef<HTMLDivElement>(null), on the box with <div ref={boxRef} …>. Without
    one the bar sticks to the page. */}
${navbar("sticky scrollContainerRef={boxRef}")}`,

  current: `{/* current marks the page the reader is on (aria-current="page"). You decide which one it is, from the router. */}
<Navbar>
  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
    <Navbar.Link href="/pricing">Pricing</Navbar.Link>
    <Navbar.Link href="/docs">Docs</Navbar.Link>
    <Navbar.Link href="/beta" disabled>
      Beta
    </Navbar.Link>
  </Navbar.Links>
</Navbar>`,

  routerLinks: `{/* asChild puts the look on your router's link: put its component where the <a> is (here a plain anchor). */}
<Navbar>
  <Navbar.Brand asChild>
    <a href="/">dbM</a>
  </Navbar.Brand>
  <Navbar.Links>
    <Navbar.Link asChild current>
      <a href="/products">Products</a>
    </Navbar.Link>
    <Navbar.Link asChild>
      <a href="/pricing">Pricing</a>
    </Navbar.Link>
  </Navbar.Links>
</Navbar>`,

  controlledMenu: `{/* const [open, setOpen] = useState(false); and the reason for the last change: const [reason, setReason] = useState(""); */}
<Navbar
  collapseBelow="3xl"
  menuOpen={open}
  onMenuOpenChange={(next, details) => {
    setOpen(next);
    setReason(details.reason);
  }}
>
${brand}
${links}
</Navbar>`,

  rightToLeft: `{/* dir="rtl": the brand sits at the right, and menuSide="start" is the right edge. This demo collapses below the widest step
    ("3xl") so the panel shows on any window narrower than 1920px. */}
${navbar('dir="rtl" collapseBelow="3xl" labels={{ menu: "القائمة", navigation: "الرئيسية", close: "إغلاق" }}')}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface NavbarPlaygroundSnippetArgs {
  variant?: NavbarVariant;
  currentVariant?: NavbarCurrentVariant;
  rounded?: boolean;
  size?: NavbarSize;
  contained?: boolean;
  collapseBelow?: NavbarCollapseBelow;
  menuSide?: "start" | "end" | "top" | "bottom";
  closeMenuOnNavigate?: boolean;
  defaultMenuOpen?: boolean;
  sticky?: boolean;
  hideOnScroll?: boolean;
  stickyOffset?: number;
  dir?: "ltr" | "rtl";
  "aria-label"?: string;
  id?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, in the order the
 * controls and the Properties table list them, around a small real bar. `hideOnScroll` and `stickyOffset` are written only while
 * the bar is `sticky`, since they do nothing otherwise.
 */
export function navbarPlaygroundSnippet(args: NavbarPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "outlined") attributes.push(`variant="${args.variant}"`);
  if (args.currentVariant && args.currentVariant !== "underline") attributes.push(`currentVariant="${args.currentVariant}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.contained) attributes.push("contained");
  if (args.collapseBelow && args.collapseBelow !== "md") attributes.push(`collapseBelow="${args.collapseBelow}"`);
  if (args.menuSide && args.menuSide !== "start") attributes.push(`menuSide="${args.menuSide}"`);
  if (args.closeMenuOnNavigate === false) attributes.push("closeMenuOnNavigate={false}");
  if (args.defaultMenuOpen) attributes.push("defaultMenuOpen");
  if (args.sticky) {
    attributes.push("sticky");
    if (args.hideOnScroll) attributes.push("hideOnScroll");
    if (args.stickyOffset) attributes.push(`stickyOffset={${args.stickyOffset}}`);
  }
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args["aria-label"]) attributes.push(`aria-label=${quote(args["aria-label"])}`);
  if (args.id) attributes.push(`id=${quote(args.id)}`);
  return navbar(attributes.join(" "));
}
