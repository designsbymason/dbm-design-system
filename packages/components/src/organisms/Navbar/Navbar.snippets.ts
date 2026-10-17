// The code shown under each story's "Show code" button on Navbar's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open menu panel inside its Docs frame, the `menuContainer` it is given), which can't
// be pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { NavbarCollapseBelow, NavbarCurrentVariant, NavbarSize, NavbarVariant } from "./Navbar.types";

const brand = `  <Navbar.Brand href="/">dbM</Navbar.Brand>`;

const links = `  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
    <Navbar.Link href="/pricing">Pricing</Navbar.Link>
    <Navbar.Link href="/docs">Docs</Navbar.Link>
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
    back, at the foot of the menu panel. PanelActions is drawn only in the panel, and goes directly inside Navbar. */}
<Navbar>
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
    <Navbar.Action hideBelow="md">
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

  ghostSticky: `{/* A sticky ghost bar is transparent over the page until it is stuck, then takes a surface and a shadow. */}
<Navbar sticky variant="ghost">
  <Navbar.Brand href="/">dbM</Navbar.Brand>
  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
  </Navbar.Links>
</Navbar>`,

  hideOnScroll: `{/* hideOnScroll slides a sticky bar away while the reader scrolls down and brings it back on a scroll up or near the top. It
    stays while anything in it has focus. In a scrolling box of your own, name it with scrollContainerRef. */}
<Navbar sticky hideOnScroll>
  <Navbar.Brand href="/">dbM</Navbar.Brand>
  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
  </Navbar.Links>
</Navbar>`,

  rounded: `{/* rounded makes each link and group button a pill; the bar itself keeps its shape. It is the same prop Button,
    IconButton and Toolbar have. */}
${navbar('rounded currentVariant="subtle"')}`,

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
${navbar("contained")}`,

  collapse: `{/* collapseBelow: "sm" | "md" (default) | "lg" | "xl" | "2xl" | "3xl" | "never". Below the width the links
    leave the bar for a menu button. The switch is a stylesheet's, so a server-rendered page is right at first paint. */}
${navbar('collapseBelow="lg"')}`,

  menu: `{/* Below the collapse width the same Navbar.Link items fill a menu panel (a Drawer) behind a button. menuSide is
    "start" (default) | "end" | "top" | "bottom", and start and end swap in right-to-left. */}
${navbar('menuSide="end"')}`,

  sticky: `{/* sticky keeps the bar at the top as the page scrolls, with a shadow while it is stuck. In a scrolling box of your
    own, scrollContainerRef names it (const boxRef = useRef<HTMLDivElement>(null)). */}
${navbar("sticky")}`,

  current: `{/* current marks the page the reader is on (aria-current="page"). You decide which one it is, from the router. */}
<Navbar>
  <Navbar.Links>
    <Navbar.Link href="/products" current>
      Products
    </Navbar.Link>
    <Navbar.Link href="/pricing">Pricing</Navbar.Link>
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

  controlledMenu: `{/* const [open, setOpen] = useState(false); */}
<Navbar menuOpen={open} onMenuOpenChange={(next, { reason }) => setOpen(next)}>
${brand}
${links}
</Navbar>`,

  rightToLeft: `{/* dir="rtl": the brand sits at the right, and menuSide="start" is the right edge. */}
${navbar('dir="rtl" labels={{ menu: "القائمة", navigation: "الرئيسية", close: "إغلاق" }}')}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface NavbarPlaygroundSnippetArgs {
  variant?: NavbarVariant;
  currentVariant?: NavbarCurrentVariant;
  rounded?: boolean;
  size?: NavbarSize;
  collapseBelow?: NavbarCollapseBelow;
  menuSide?: "start" | "end" | "top" | "bottom";
  closeMenuOnNavigate?: boolean;
  contained?: boolean;
  sticky?: boolean;
  hideOnScroll?: boolean;
  dir?: "ltr" | "rtl";
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real bar.
 */
export function navbarPlaygroundSnippet(args: NavbarPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "outlined") attributes.push(`variant="${args.variant}"`);
  if (args.currentVariant && args.currentVariant !== "underline") attributes.push(`currentVariant="${args.currentVariant}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.collapseBelow && args.collapseBelow !== "md") attributes.push(`collapseBelow="${args.collapseBelow}"`);
  if (args.menuSide && args.menuSide !== "start") attributes.push(`menuSide="${args.menuSide}"`);
  if (args.closeMenuOnNavigate === false) attributes.push("closeMenuOnNavigate={false}");
  if (args.contained) attributes.push("contained");
  if (args.sticky) attributes.push("sticky");
  if (args.hideOnScroll) attributes.push("hideOnScroll");
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  return navbar(attributes.join(" "));
}
