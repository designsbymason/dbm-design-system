// The code shown under each story's "Show code" button on TableOfContents' Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// helpers (`DemoPage`, the scroll box), which can't be pasted anywhere. Each snippet is the smallest real usage of what
// its story shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { TableOfContentsSize, TableOfContentsTone } from "./TableOfContents.types";

const defaultItems = `[
    { id: "overview", label: "Overview" },
    { id: "installation", label: "Installation" },
    { id: "usage", label: "Usage" },
    { id: "accessibility", label: "Accessibility" },
  ]`;

const nestedItems = `[
    { id: "installation", label: "Installation" },
    { id: "requirements", label: "Requirements", level: 2 },
    { id: "setup", label: "Setup", level: 2 },
    { id: "options", label: "Options", level: 3 },
    { id: "usage", label: "Usage" },
  ]`;

/** An outline, one attribute to a line. */
const toc = (attributes: string[] = [], items = defaultItems) =>
  `<TableOfContents
${attributes.map((attribute) => `  ${attribute}
`).join("")}  items={${items}}
/>`;

export const tableOfContentsSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — text and spacing */}
${toc(['size="sm"'])}`,

  tones: `{/* tone: "brand" (default) | "neutral". Neutral keeps the current entry in primary text, and is the one to
    use on bg.canvas, where brand text falls under the contrast floor. */}
${toc(['tone="neutral"'])}`,

  nested: `{/* level: 1 (default) to 4 — each level is indented one step */}
${toc([], nestedItems)}`,

  readFromPage: `{/* With no items, the h2 and h3 headings are read from the page, in the browser. Each needs an id.
    Point contentRef at an element to read only its headings. */}
{/* const articleRef = useRef<HTMLElement>(null); */}
<TableOfContents contentRef={articleRef} />

{/* selector chooses which elements are entries (default "h2, h3") */}
<TableOfContents contentRef={articleRef} selector="h2, h3, h4" />`,

  scrollContainer: `{/* The headings live in a scrolling box of your own: tell the outline which one, so it measures and
    scrolls that box instead of the page. */}
{/* const boxRef = useRef<HTMLDivElement>(null); */}
${toc(["scrollContainerRef={boxRef}"])}`,

  stickyOffset: `{/* scrollOffset (px) is the height of a sticky header over the content: a heading counts as
    reached, and a click leaves it, just below that header. Here the headings are in a scrolling box
    of your own, which has the sticky header inside it. */}
{/* const boxRef = useRef<HTMLDivElement>(null); */}
${toc(["scrollContainerRef={boxRef}", "scrollOffset={40}"])}`,

  withoutTitle: `{/* The heading is hidden; the list keeps a name for screen readers (labels.navigation) */}
${toc(["showTitle={false}"])}`,

  controlled: `{/* const [active, setActive] = useState("usage"); */}
{/* While activeId is set, scrolling no longer changes the marked entry on its own. */}
${toc(["activeId={active}", "onActiveIdChange={setActive}"])}`,

  translated: `{/* labels holds every piece of text the component writes itself */}
${toc([`labels={{ title: "Sur cette page", navigation: "Table des matières" }}`])}`,

  rightToLeft: `{/* dir="rtl" mirrors the outline: the marker moves to the right edge and levels indent from it */}
${toc(['dir="rtl"'])}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TableOfContentsPlaygroundSnippetArgs {
  size?: TableOfContentsSize;
  tone?: TableOfContentsTone;
  showTitle?: boolean;
  smoothScroll?: boolean;
  scrollOffset?: number;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around
 * a small real outline.
 */
export function tableOfContentsPlaygroundSnippet(args: TableOfContentsPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.showTitle === false) attributes.push("showTitle={false}");
  if (args.smoothScroll === false) attributes.push("smoothScroll={false}");
  if (typeof args.scrollOffset === "number" && args.scrollOffset > 0) attributes.push(`scrollOffset={${args.scrollOffset}}`);
  if (args["aria-label"]) attributes.push(`aria-label=${quote(args["aria-label"])}`);
  return toc(attributes);
}
