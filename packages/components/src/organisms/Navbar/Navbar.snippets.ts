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
    back, at the foot of the menu panel. PanelActions is drawn only in the panel, and goes directly inside Navbar. This demo uses
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
