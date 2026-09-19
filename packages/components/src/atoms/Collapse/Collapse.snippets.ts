// The code shown under each story's "Show code" button on Collapse's Docs page.
//
// Hand-written rather than generated from the rendered story: every panel prints
// `defaultOpen={false} disabled={false} onOpenChange={() => {}} orientation="vertical"` and
// inlines the story's content-box style (`backgroundColor`, `borderRadius`, `padding` …);
// "Playground" and "Default" come out identical; and "Externally driven" prints a frozen
// `open`. Each snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true.
// See `07-storybook-and-documentation-standards.md` §4.2.

import type { CollapseOrientation } from "./Collapse.types";

export const collapseSnippets = {
  horizontal: `{/* orientation="horizontal" grows and shrinks the content sideways instead of by height — a sidebar
    panel, say. Give the content a width of its own. */}
<Collapse orientation="horizontal" trigger={<Button variant="secondary">Toggle sidebar</Button>}>
  <div style={{ width: "12rem" }}>
    <Text>A sidebar-style panel that grows and shrinks sideways.</Text>
  </div>
</Collapse>`,

  withoutTrigger: `{/* const [isOpen, setIsOpen] = useState(false); */}
{/* Leave trigger out and drive open from your own control — this is how Accordion uses Collapse. */}
<Button onClick={() => setIsOpen((open) => !open)}>Toggle details</Button>
<Collapse open={isOpen}>
  <Text>Hidden content, opened and closed from outside.</Text>
</Collapse>`,

  asChild: `{/* asChild puts Collapse's behavior on your own element instead of adding a wrapper <div> — here the <li>
    itself collapses, so the list stays valid HTML. */}
<ul>
  <li>Always-visible item</li>
  <Collapse asChild defaultOpen>
    <li>A collapsible list item</li>
  </Collapse>
  <li>Another always-visible item</li>
</ul>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CollapsePlaygroundSnippetArgs {
  children?: unknown;
  defaultOpen?: boolean;
  disabled?: boolean;
  orientation?: CollapseOrientation;
  /** The control's option key (`"Button trigger"` / `"None (externally driven)"`), or an element. */
  trigger?: unknown;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from
 * their defaults (closed, enabled, `vertical`), around a `Button` trigger and one line of content.
 * The trigger control has a `mapping`, so Storybook hands the builder its option key, not the
 * element; "None (externally driven)" leaves the `trigger` out. `withTrigger` lets the stories
 * that always render a button say so. Also serves the "Default" and "Open by default" stories.
 */
export function collapsePlaygroundSnippet(args: CollapsePlaygroundSnippetArgs, withTrigger?: boolean): string {
  const hasTrigger = withTrigger ?? args.trigger !== "None (externally driven)";
  const attributes: string[] = [];
  if (hasTrigger) attributes.push('trigger={<Button variant="secondary">Toggle details</Button>}');
  if (args.defaultOpen) attributes.push("defaultOpen");
  if (args.disabled) attributes.push("disabled");
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${args.orientation}"`);
  const content = typeof args.children === "string" && args.children ? args.children : "Hidden content revealed on toggle.";
  const open = attributes.length > 0 ? `<Collapse ${attributes.join(" ")}>` : "<Collapse>";
  return `${open}\n  <Text>${content}</Text>\n</Collapse>`;
}
