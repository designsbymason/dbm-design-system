// The code shown under each story's "Show code" button on FieldError's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out `disabled={false}` and — for "Custom icon" — prints the icon as
// `{{ $$typeof: Symbol(react.forward_ref), render: () => {} }}`, which can't be
// pasted. Each snippet here is the smallest real usage of what its story shows —
// only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { HeartIcon, StarIcon } from "@dbm-design-system/icons";

export const fieldErrorSnippets = {
  customIcon: `{/* icon: true (the default warning icon) | false (no icon) | an icon component.
    StarIcon comes from @dbm-design-system/icons. */}
<FieldError>Default warning icon</FieldError>
<FieldError icon={StarIcon}>Custom icon (Star)</FieldError>`,
} as const;

// The Playground's icon control hands the builder `true`, `false`, or the icon
// component itself; this turns a component back into the name a reader would write.
const iconNames: Array<[unknown, string]> = [
  [StarIcon, "StarIcon"],
  [HeartIcon, "HeartIcon"],
];
const iconKeys = "Star|Heart".split("|");
const iconName = (icon: unknown): string | undefined => {
  const byComponent = iconNames.find(([component]) => component === icon)?.[1];
  if (byComponent) return byComponent;
  // For a control with a `mapping`, Storybook's snippet `transform` is handed the control's
  // *option key* (`"Star"`), not the mapped component — so accept that form too.
  return typeof icon === "string" && iconKeys.includes(icon) ? `${icon}Icon` : undefined;
};

/** The Playground's live controls, as far as the snippet cares. */
export interface FieldErrorPlaygroundSnippetArgs {
  children?: unknown;
  icon?: unknown;
  disabled?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults (the default icon is `true`, so only `icon={false}` or a
 * custom icon is written). Also serves the no-icon and disabled stories.
 */
export function fieldErrorPlaygroundSnippet(args: FieldErrorPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  // The control passes its option key (`"Hidden"`); a real `false` is the same thing.
  if (args.icon === false || args.icon === "Hidden") attributes.push("icon={false}");
  const custom = iconName(args.icon);
  if (custom) attributes.push(`icon={${custom}}`);
  if (args.disabled) attributes.push("disabled");
  const message = String(args.children ?? "Enter a valid email address");
  return `<FieldError${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}>${message}</FieldError>`;
}
