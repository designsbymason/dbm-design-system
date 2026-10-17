// The code shown under each story's "Show code" button on Navbar's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open menu panel inside its Docs frame, the `menuContainer` it is given), which can't
// be pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { NavbarCollapseBelow, NavbarSize, NavbarVariant } from "./Navbar.types";

const brand = `  <Navbar.Brand href="/">Acme</Navbar.Brand>`;

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
    <a href="/">Acme</a>
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
  size?: NavbarSize;
  collapseBelow?: NavbarCollapseBelow;
  menuSide?: "start" | "end" | "top" | "bottom";
  closeMenuOnNavigate?: boolean;
  contained?: boolean;
  sticky?: boolean;
  dir?: "ltr" | "rtl";
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real bar.
 */
export function navbarPlaygroundSnippet(args: NavbarPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "outlined") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.collapseBelow && args.collapseBelow !== "md") attributes.push(`collapseBelow="${args.collapseBelow}"`);
  if (args.menuSide && args.menuSide !== "start") attributes.push(`menuSide="${args.menuSide}"`);
  if (args.closeMenuOnNavigate === false) attributes.push("closeMenuOnNavigate={false}");
  if (args.contained) attributes.push("contained");
  if (args.sticky) attributes.push("sticky");
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  return navbar(attributes.join(" "));
}
