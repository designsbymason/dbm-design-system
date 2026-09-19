// The code shown under each story's "Show code" button on Switch's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `loading={false}`, `required={false}`,
// `name=""`, `value=""`), empty placeholders (`aria-label=""`), no-op handlers, and
// the story's demo wrapper; and "With thumb icons" printed both icons as
// `{{ $$typeof: Symbol(react.forward_ref), ... }}`, which can't be pasted. Each
// snippet here is the smallest real usage of what its story shows — only exports of
// the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

import { CheckIcon, MoonIcon, SunIcon, XIcon } from "@dbm-design-system/icons";
import type { SwitchSize } from "./Switch.types";

export const switchSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Switch size="lg" defaultChecked>Size lg</Switch>`,

  states: `<Switch>Off</Switch>
<Switch defaultChecked>On</Switch>
<Switch disabled>Disabled</Switch>
<Switch disabled defaultChecked>Disabled + on</Switch>

{/* hasError marks the switch invalid — pair it with a FieldError that says what's wrong */}
<Switch hasError>Error state</Switch>

{/* loading shows a spinner and blocks changes while something is in flight */}
<Switch loading>Loading</Switch>`,

  withThumbIcons: `{/* checkedIcon and uncheckedIcon put an icon on the thumb for each state. MoonIcon and SunIcon come from
    @dbm-design-system/icons. */}
<Switch defaultChecked checkedIcon={MoonIcon} uncheckedIcon={SunIcon}>Dark mode</Switch>`,

  iconOnly: `{/* With no visible label, aria-label is required */}
<Switch aria-label="Airplane mode" />`,
} as const;

// The Playground's icon controls hand the builder an icon — the component itself, or the
// control's option key for it — and this turns either back into the name a reader would write.
const iconNames: Array<[unknown, string]> = [
  [MoonIcon, "MoonIcon"],
  [CheckIcon, "CheckIcon"],
  [SunIcon, "SunIcon"],
  [XIcon, "XIcon"],
];
const iconKeys = "Moon|Check|Sun|X".split("|");
const iconName = (icon: unknown): string | undefined => {
  const byComponent = iconNames.find(([component]) => component === icon)?.[1];
  if (byComponent) return byComponent;
  // For a control with a `mapping`, Storybook's snippet `transform` is handed the control's
  // *option key* (`"Star"`), not the mapped component — so accept that form too.
  return typeof icon === "string" && iconKeys.includes(icon) ? `${icon}Icon` : undefined;
};

/** The Playground's live controls, as far as the snippet cares. */
export interface SwitchPlaygroundSnippetArgs {
  children?: unknown;
  size?: SwitchSize;
  hasError?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean;
  loading?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  "aria-label"?: string;
  checkedIcon?: unknown;
  uncheckedIcon?: unknown;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. The icon controls give the builder the icon component,
 * which it writes back as its name.
 */
export function switchPlaygroundSnippet(args: SwitchPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.defaultChecked) attributes.push("defaultChecked");
  const checked = iconName(args.checkedIcon);
  const unchecked = iconName(args.uncheckedIcon);
  if (checked) attributes.push(`checkedIcon={${checked}}`);
  if (unchecked) attributes.push(`uncheckedIcon={${unchecked}}`);
  if (args.loading) attributes.push("loading");
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.name) attributes.push(`name="${args.name}"`);
  if (args.value) attributes.push(`value="${args.value}"`);
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);
  if (args.disabled) attributes.push("disabled");
  const open = `<Switch${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}`;
  const label = args.children === undefined || args.children === "" ? undefined : String(args.children);
  return label ? `${open}>${label}</Switch>` : `${open} />`;
}
