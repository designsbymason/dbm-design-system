// The code shown under each story's "Show code" button on AspectRatio's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground's
// generated code prints the default ratio as `ratio={1.7777777777777777}` rather than
// `16 / 9` and keeps the story's demo wrapper, and the three gallery panels show the
// story object itself (`{ argTypes: …, render: () => … }`). Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no
// demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const aspectRatioSnippets = {
  default: `{/* AspectRatio fills its container's width and sets its height from the ratio (width / height, default
    16 / 9); its child fills the box. Give the container a width. */}
<AspectRatio ratio={16 / 9}>
  <img src="/hero.jpg" alt="A mountain valley at dawn" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
</AspectRatio>`,

  square: `{/* ratio={1} is a square */}
<AspectRatio ratio={1}>
  <img src="/avatar.jpg" alt="Jane Doe" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
</AspectRatio>`,

  videoEmbed: `{/* An embed keeps its shape at any width — here a 21:9 cinema ratio */}
<AspectRatio ratio={21 / 9}>
  <iframe
    src="https://example.com/embed/intro"
    title="Product introduction"
    style={{ width: "100%", height: "100%", border: 0 }}
  />
</AspectRatio>`,
} as const;

// Ratios people write by name — tried first so 21 / 9 doesn't come out as its reduced
// form, 7 / 3.
const commonRatios: Array<[number, number]> = [
  [16, 9],
  [21, 9],
  [4, 3],
  [3, 2],
  [5, 4],
  [3, 1],
  [2, 1],
  [1, 1],
  [9, 16],
  [3, 4],
  [2, 3],
  [4, 5],
];

// A ratio as a reader would write it: a common named ratio (`16 / 9`, `21 / 9`), else a
// fraction with a denominator up to 12, else a plain number. Storybook hands the builder the
// evaluated number (1.7777…), so this recovers the fraction.
export function ratioLiteral(ratio: number): string {
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const common = commonRatios.find(([numerator, denominator]) => close(numerator / denominator, ratio));
  if (common) return common[1] === 1 ? String(common[0]) : `${common[0]} / ${common[1]}`;
  for (let denominator = 1; denominator <= 12; denominator += 1) {
    const numerator = Math.round(ratio * denominator);
    if (numerator > 0 && close(numerator / denominator, ratio)) {
      return denominator === 1 ? String(numerator) : `${numerator} / ${denominator}`;
    }
  }
  return String(Number(ratio.toFixed(3)));
}

/** The Playground's live controls, as far as the snippet cares. */
export interface AspectRatioPlaygroundSnippetArgs {
  ratio?: number;
  children?: unknown;
}

/**
 * The Playground's snippet, built from its current controls: the ratio only when it
 * differs from the default (16 / 9), written as a fraction where it can be.
 */
export function aspectRatioPlaygroundSnippet(args: AspectRatioPlaygroundSnippetArgs): string {
  const isDefault = args.ratio === undefined || Math.abs(args.ratio - 16 / 9) < 1e-9;
  const attribute = isDefault ? "" : ` ratio={${ratioLiteral(args.ratio as number)}}`;
  return `<AspectRatio${attribute}>${String(args.children ?? "Aspect-ratio content placeholder")}</AspectRatio>`;
}
