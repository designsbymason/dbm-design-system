// The code shown under each story's "Show code" button on Icon's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground's generated
// code prints the icon as `{ $$typeof: Symbol(react.forward_ref), render: () => {} }` next
// to `label=""` and `mirrored={false}`, and the six gallery panels show the story object
// itself (`{ argTypes: disableAllAxes, render: () => … }`) with a `standaloneTones` constant
// and `.map(` loops from the stories file. Each snippet here is the smallest real usage of
// what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import {
  ArrowRightIcon,
  CheckIcon,
  HeartIcon,
  StarIcon,
  TrashIcon,
  WalletIcon,
  type IconWeight,
} from "@dbm-design-system/icons";
import type { IconSize, IconTone } from "./Icon.types";

export const iconSnippets = {
  default: `{/* icon takes any icon from @dbm-design-system/icons — WalletIcon here. Without a label the icon is
    decorative and hidden from assistive technology. */}
<Icon icon={WalletIcon} />`,

  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" | "2xl" | "3xl". WalletIcon comes from
    @dbm-design-system/icons. */}
<Icon icon={WalletIcon} size="xl" tone="brand" />`,

  allWeights: `{/* weight: "thin" | "light" | "regular" | "bold" (default) | "fill" | "duotone". HeartIcon comes from
    @dbm-design-system/icons. */}
<Icon icon={HeartIcon} weight="duotone" size="lg" tone="brand" />`,

  allTones: `{/* tone: "default" | "secondary" | "brand" | "disabled" | "danger" | "warning" | "success" | "info".
    Leave it out and the icon takes the surrounding text color. HeartIcon comes from @dbm-design-system/icons. */}
<Icon icon={HeartIcon} size="lg" tone="danger" />

{/* The on-* tones are for an icon sitting on that solid fill: "on-brand" | "on-danger" | "on-warning" |
    "on-success" | "on-info" | "on-neutral". "white" stays white in every theme. */}
<div style={{ background: "var(--dbm-bg-brand)", padding: "var(--dbm-space-2)" }}>
  <Icon icon={HeartIcon} size="lg" tone="on-brand" />
</div>`,

  labeled: `{/* label makes the icon an image (role="img") with that accessible name — use it when the icon carries
    meaning on its own. HeartIcon comes from @dbm-design-system/icons. */}
<Icon icon={HeartIcon} label="Favorite" />`,

  mirrored: `{/* mirrored flips a directional icon horizontally, for right-to-left layouts. ArrowRightIcon comes from
    @dbm-design-system/icons. */}
<Icon icon={ArrowRightIcon} size="lg" tone="brand" mirrored />`,
} as const;

// The Playground's icon control hands the builder an icon — the component itself, or the
// control's option key for it — and this turns either back into the name a reader would write.
const iconNames: Array<[unknown, string]> = [
  [WalletIcon, "WalletIcon"],
  [HeartIcon, "HeartIcon"],
  [StarIcon, "StarIcon"],
  [TrashIcon, "TrashIcon"],
  [CheckIcon, "CheckIcon"],
  [ArrowRightIcon, "ArrowRightIcon"],
];
const iconKeys = "Wallet|Heart|Star|Trash|Check|ArrowRight".split("|");
const iconName = (icon: unknown): string | undefined => {
  const byComponent = iconNames.find(([component]) => component === icon)?.[1];
  if (byComponent) return byComponent;
  // For a control with a `mapping`, Storybook's snippet `transform` is handed the control's
  // *option key* (`"Star"`), not the mapped component — so accept that form too.
  return typeof icon === "string" && iconKeys.includes(icon) ? `${icon}Icon` : undefined;
};

// An attribute value as a reader would write it: a plain string, or a `{"…"}` expression when the
// text holds a quote or an ampersand (which a JSX string attribute would misread).
const quote = (value: string): string => (/["&\\]/.test(value) ? `{${JSON.stringify(value)}}` : `"${value}"`);

/** The Playground's live controls, as far as the snippet cares. */
export interface IconPlaygroundSnippetArgs {
  icon?: unknown;
  size?: IconSize;
  weight?: IconWeight;
  tone?: IconTone;
  label?: string;
  mirrored?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: the icon always (it's
 * required), everything else only when it differs from its default (`md`, `bold`, no
 * tone, no label, not mirrored).
 */
export function iconPlaygroundSnippet(args: IconPlaygroundSnippetArgs): string {
  const attributes = [`icon={${iconName(args.icon) ?? "WalletIcon"}}`];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.weight && args.weight !== "bold") attributes.push(`weight="${args.weight}"`);
  if (args.tone) attributes.push(`tone="${args.tone}"`);
  if (args.label) attributes.push(`label=${quote(args.label)}`);
  if (args.mirrored) attributes.push("mirrored");
  return `<Icon ${attributes.join(" ")} />`;
}
