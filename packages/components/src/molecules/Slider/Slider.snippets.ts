// The code shown under each story's "Show code" button on Slider's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out about twenty props, nearly all of them defaults (`showTicks={false}`,
// `inverted={false}`, `aria-valuetext=""`, `tickInterval={10}`) and no-op handlers
// (`onValueChange={() => {}}`), so a one-prop variant hides its one prop, and the
// controlled story freezes `value={50}` and its "Live: 50" text. Each snippet here
// is the smallest real usage of what its story shows — only exports of the
// package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

export const sliderSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Slider aria-label="Size sm" size="sm" defaultValue={50} />`,

  controlled: `{/* You own the value:
    const [value, setValue] = useState(50);
    const [committedValue, setCommittedValue] = useState(50);
    onValueChange fires continuously while dragging; onValueCommit fires once, on release — use it for
    anything expensive (a request, a save). */}
<Slider
  aria-label="Volume"
  value={value}
  onValueChange={setValue}
  onValueCommit={setCommittedValue}
/>
<p>Live: {value} · Committed: {committedValue}</p>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SliderPlaygroundSnippetArgs {
  size?: string;
  hasError?: boolean;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  inverted?: boolean;
  showValue?: boolean;
  showValueTooltip?: boolean;
  showMinMaxLabels?: boolean;
  showTicks?: boolean;
  tickInterval?: number;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
  "aria-valuetext"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. Also serves the stories that just change a few args
 * (the value shown, a tooltip, min/max labels, ticks, a custom range, error,
 * disabled, vertical). A slider needs an accessible name, so the `aria-label` is
 * always written. A vertical slider takes its height from its container, so it's
 * shown in one that has a height.
 */
export function sliderPlaygroundSnippet(args: SliderPlaygroundSnippetArgs): string {
  const vertical = args.orientation === "vertical";
  const step = args.step ?? 1;
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Volume"}"`];
  if (args.defaultValue !== undefined) attributes.push(`defaultValue={${args.defaultValue}}`);
  if (args.min !== undefined && args.min !== 0) attributes.push(`min={${args.min}}`);
  if (args.max !== undefined && args.max !== 100) attributes.push(`max={${args.max}}`);
  if (step !== 1) attributes.push(`step={${step}}`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (vertical) attributes.push('orientation="vertical"');
  if (args.inverted) attributes.push("inverted");
  if (args.showValue) attributes.push("showValue");
  if (args.showValueTooltip) attributes.push("showValueTooltip");
  if (args.showMinMaxLabels) attributes.push("showMinMaxLabels");
  if (args.showTicks) {
    attributes.push("showTicks");
    // `tickInterval` defaults to `step`, so it only needs writing when it differs.
    if (args.tickInterval !== undefined && args.tickInterval !== step) attributes.push(`tickInterval={${args.tickInterval}}`);
  }
  if (args.hasError) attributes.push("hasError");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  if (args["aria-valuetext"]) attributes.push(`aria-valuetext="${args["aria-valuetext"]}"`);

  if (vertical) {
    return `{/* A vertical slider fills its container's height, so give the container one */}
<div style={{ height: "12rem" }}>
  <Slider ${attributes.join(" ")} style={{ height: "100%" }} />
</div>`;
  }
  return `<Slider ${attributes.join(" ")} />`;
}
