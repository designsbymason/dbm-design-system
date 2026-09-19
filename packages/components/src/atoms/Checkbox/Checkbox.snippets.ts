// The code shown under each story's "Show code" button on Checkbox's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `required={false}`, `name=""`,
// `value=""`), empty placeholders (`aria-label=""`), no-op handlers, and the story's
// demo wrapper; it prints the custom icons as `{{ $$typeof: Symbol(react.forward_ref),
// ... }}`; and the "Select-all" story shows every checkbox as `checked={false}` with
// `defaultChecked={false}` and no state. Each snippet here is the smallest real usage
// of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { HeartIcon, StarIcon, XIcon } from "@dbm-design-system/icons";
import type { CheckboxSize } from "./Checkbox.types";

export const checkboxSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Checkbox size="lg" defaultChecked>Size lg</Checkbox>`,

  states: `<Checkbox>Unchecked</Checkbox>
<Checkbox defaultChecked>Checked</Checkbox>

{/* checked="indeterminate" shows a dash — for a "some, not all" parent checkbox */}
<Checkbox checked="indeterminate">Indeterminate</Checkbox>

<Checkbox disabled>Disabled</Checkbox>
<Checkbox disabled defaultChecked>Disabled + checked</Checkbox>

{/* hasError marks the checkbox invalid — pair it with a FieldError that says what's wrong */}
<Checkbox hasError>Error state</Checkbox>`,

  iconOnly: `{/* With no visible label, aria-label is required */}
<Checkbox aria-label="Select row" />`,

  customIcons: `{/* icon replaces the check mark; indeterminateIcon replaces the dash. StarIcon and XIcon come from
    @dbm-design-system/icons. */}
<Checkbox defaultChecked icon={StarIcon}>Custom check icon (Star)</Checkbox>
<Checkbox checked="indeterminate" indeterminateIcon={XIcon}>Custom indeterminate icon (X)</Checkbox>`,

  selectAllPattern: `{/* A parent checkbox that is checked, unchecked or indeterminate according to its children:
    const [items, setItems] = useState([false, false, false]);
    const checkedCount = items.filter(Boolean).length;
    const allChecked = checkedCount === items.length;
    const someChecked = checkedCount > 0 && !allChecked; */}
<Checkbox
  checked={someChecked ? "indeterminate" : allChecked}
  onCheckedChange={(checked) => setItems(items.map(() => checked === true))}
>
  Select all
</Checkbox>
{items.map((checked, index) => (
  <Checkbox
    key={index}
    checked={checked}
    onCheckedChange={(value) => setItems(items.map((v, i) => (i === index ? value === true : v)))}
  >
    Item {index + 1}
  </Checkbox>
))}`,
} as const;

// The Playground's icon controls hand the builder an icon — the component itself, or the
// control's option key for it — and this turns either back into the name a reader would write.
const iconNames: Array<[unknown, string]> = [
  [StarIcon, "StarIcon"],
  [HeartIcon, "HeartIcon"],
  [XIcon, "XIcon"],
];
const iconKeys = "Star|Heart|X".split("|");
const iconName = (icon: unknown): string | undefined => {
  const byComponent = iconNames.find(([component]) => component === icon)?.[1];
  if (byComponent) return byComponent;
  // For a control with a `mapping`, Storybook's snippet `transform` is handed the control's
  // *option key* (`"Star"`), not the mapped component — so accept that form too.
  return typeof icon === "string" && iconKeys.includes(icon) ? `${icon}Icon` : undefined;
};

/** The Playground's live controls, as far as the snippet cares. */
export interface CheckboxPlaygroundSnippetArgs {
  children?: unknown;
  size?: CheckboxSize;
  hasError?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean | "indeterminate";
  required?: boolean;
  name?: string;
  value?: string;
  "aria-label"?: string;
  icon?: unknown;
  indeterminateIcon?: unknown;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. The icon controls give the builder the icon component,
 * which it writes back as its name.
 */
export function checkboxPlaygroundSnippet(args: CheckboxPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.defaultChecked === true) attributes.push("defaultChecked");
  else if (args.defaultChecked === "indeterminate") attributes.push('defaultChecked="indeterminate"');
  const icon = iconName(args.icon);
  const indeterminateIcon = iconName(args.indeterminateIcon);
  if (icon) attributes.push(`icon={${icon}}`);
  if (indeterminateIcon) attributes.push(`indeterminateIcon={${indeterminateIcon}}`);
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.name) attributes.push(`name="${args.name}"`);
  if (args.value) attributes.push(`value="${args.value}"`);
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);
  if (args.disabled) attributes.push("disabled");
  const open = `<Checkbox${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}`;
  const label = args.children === undefined || args.children === "" ? undefined : String(args.children);
  return label ? `${open}>${label}</Checkbox>` : `${open} />`;
}
