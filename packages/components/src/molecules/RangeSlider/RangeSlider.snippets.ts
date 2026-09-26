// The code shown under each story's "Show code" button on RangeSlider's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`showTicks={false}`, `inverted={false}`, `name=""`) and
// fills every handler with a no-op (`onValueChange={() => {}}`), so a one-prop variant
// hides its one prop and the controlled story freezes `value={[20, 80]}`. Each snippet
// here is the smallest real usage of what its story shows — only exports of the
// package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true.
// See `07-storybook-and-documentation-standards.md` §4.2.

export const rangeSliderSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<RangeSlider aria-label="Size sm" size="sm" defaultValue={[20, 80]} />`,

  price: `{/* formatNumber writes each number the slider shows — the range, a thumb's tooltip, the min and max
    labels — and becomes what assistive tech announces on each thumb. onValueChange and the form still get
    the plain numbers. */}
<RangeSlider
  aria-label="Price"
  min={0}
  max={500}
  step={10}
  defaultValue={[100, 300]}
  showValue
  showMinMaxLabels
  formatNumber={(value) => \`$\${value}\`}
/>

<RangeSlider
  aria-label="Weight"
  defaultValue={[20, 80]}
  showValue
  showMinMaxLabels
  formatNumber={new Intl.NumberFormat("ar-EG").format}
/>`,

  minGap: `{/* minStepsBetweenThumbs: 0 (default) lets the thumbs meet; 5 steps of 2 keeps them at least 10 apart,
    so neither can hide the other */}
<RangeSlider
  aria-label="Age"
  min={0}
  max={100}
  step={2}
  defaultValue={[30, 60]}
  minStepsBetweenThumbs={5}
  showValue
/>`,

  labelled: `{/* A visible label names the slider; each thumb adds "Minimum" / "Maximum" to it — "Price Minimum",
    "Price Maximum". labels renames those two words, for another language. */}
<FieldLabel id="price-label">Price</FieldLabel>
<RangeSlider
  aria-labelledby="price-label"
  aria-describedby="price-help"
  defaultValue={[20, 80]}
  labels={{ minimum: "From", maximum: "To" }}
/>
<FieldHelperText id="price-help">Between 0 and 100</FieldHelperText>`,

  controlled: `{/* You own the range:
    const [range, setRange] = useState<[number, number]>([20, 80]);
    const [committedRange, setCommittedRange] = useState<[number, number]>([20, 80]);
    onValueChange fires continuously while dragging; onValueCommit fires once, on release — use it for
    anything expensive (a request, a filter). */}
<RangeSlider
  aria-label="Price"
  value={range}
  onValueChange={setRange}
  onValueCommit={setCommittedRange}
/>
<p>Live: {range[0]} – {range[1]} · Committed: {committedRange[0]} – {committedRange[1]}</p>`,

  form: `{/* Inside a <form>, the slider submits two values under price[] — the lower, then the upper */}
<form>
  <RangeSlider aria-label="Price" name="price" defaultValue={[20, 80]} />
</form>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface RangeSliderPlaygroundSnippetArgs {
  size?: string;
  hasError?: boolean;
  /** Storybook only: the range the demo starts with, written as `defaultValue`. */
  lowerStart?: number;
  upperStart?: number;
  min?: number;
  max?: number;
  step?: number;
  minStepsBetweenThumbs?: number;
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
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. Also serves the stories that just change a few args
 * (the value shown, a tooltip, min/max labels, ticks, a custom range, error,
 * disabled, vertical). A slider needs an accessible name, so the `aria-label` is
 * always written. A vertical slider takes its height from its container, so it's
 * shown in one that has a height.
 */
export function rangeSliderPlaygroundSnippet(args: RangeSliderPlaygroundSnippetArgs): string {
  const vertical = args.orientation === "vertical";
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const step = args.step ?? 1;
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Price"}"`];
  if (args.min !== undefined && args.min !== 0) attributes.push(`min={${args.min}}`);
  if (args.max !== undefined && args.max !== 100) attributes.push(`max={${args.max}}`);
  if (step !== 1) attributes.push(`step={${step}}`);
  // The uncontrolled start defaults to the whole track, so it only needs writing when it isn't.
  const lower = args.lowerStart ?? min;
  const upper = args.upperStart ?? max;
  if (lower !== min || upper !== max) attributes.push(`defaultValue={[${lower}, ${upper}]}`);
  if (args.minStepsBetweenThumbs) attributes.push(`minStepsBetweenThumbs={${args.minStepsBetweenThumbs}}`);
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

  if (vertical) {
    return `{/* A vertical slider fills its container's height, so give the container one */}
<div style={{ height: "12rem" }}>
  <RangeSlider ${attributes.join(" ")} style={{ height: "100%" }} />
</div>`;
  }
  return `<RangeSlider ${attributes.join(" ")} />`;
}
