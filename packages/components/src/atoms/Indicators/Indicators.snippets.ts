// The code shown under each story's "Show code" button on Indicators' Docs page.
//
// Hand-written rather than generated from the rendered story: the position lives in the
// story's own `useState`, so the generated code prints `activeIndex={1}` frozen and
// `onIndexChange={() => {}}`; "Many slides" prints `getLabel={() => {}}`, hiding the one thing
// it shows; and "All variants" / "All sizes" run to 38 and 58 lines of the same boilerplate.
// Indicators is controlled — the owning component holds the index — so each snippet names
// that state in a comment. Each snippet here is the smallest real usage of what its story
// shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { IndicatorsOrientation, IndicatorsSize, IndicatorsVariant } from "./Indicators.types";

const state = "{/* const [index, setIndex] = useState(0); — Indicators is controlled, so your component holds the position */}";

export const indicatorsSnippets = {
  allVariants: `${state}
{/* variant: "dots" (default) | "outline" | "bars" */}
<Indicators count={5} activeIndex={index} onIndexChange={setIndex} variant="bars" />`,

  allSizes: `${state}
{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Indicators count={5} activeIndex={index} onIndexChange={setIndex} size="lg" />`,

  manySlides: `${state}
{/* getLabel names each indicator for assistive technology. The default is "Go to slide N"; here each
    is a photo. aria-label names the whole group. */}
<Indicators
  count={10}
  activeIndex={index}
  onIndexChange={setIndex}
  getLabel={(i) => \`Photo \${i + 1} of 10\`}
  aria-label="Gallery navigation"
/>`,
} as const;

// An attribute value as a reader would write it: a plain string, or a `{"…"}` expression when the
// text holds a quote or an ampersand (which a JSX string attribute would misread).
const quote = (value: string): string => (/["&\\]/.test(value) ? `{${JSON.stringify(value)}}` : `"${value}"`);

/** The Playground's live controls, as far as the snippet cares. */
export interface IndicatorsPlaygroundSnippetArgs {
  count?: number;
  size?: IndicatorsSize;
  orientation?: IndicatorsOrientation;
  variant?: IndicatorsVariant;
  showLabel?: boolean;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: the three required props
 * (`count`, and `activeIndex` / `onIndexChange` wired to the reader's own state), then only what
 * differs from the defaults (`md`, `horizontal`, `dots`, no label, "Slide navigation"). Also
 * serves the "Vertical orientation" and "With progress label" stories.
 */
export function indicatorsPlaygroundSnippet(args: IndicatorsPlaygroundSnippetArgs): string {
  const attributes = [`count={${args.count ?? 5}}`, "activeIndex={index}", "onIndexChange={setIndex}"];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.orientation && args.orientation !== "horizontal") attributes.push(`orientation="${args.orientation}"`);
  if (args.variant && args.variant !== "dots") attributes.push(`variant="${args.variant}"`);
  if (args.showLabel) attributes.push("showLabel");
  if (args["aria-label"] && args["aria-label"] !== "Slide navigation") attributes.push(`aria-label=${quote(args["aria-label"])}`);
  return `${state}\n<Indicators ${attributes.join(" ")} />`;
}
