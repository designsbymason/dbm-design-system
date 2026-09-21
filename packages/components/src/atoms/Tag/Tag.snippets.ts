// The code shown under each story's "Show code" button on Tag's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`removable={false}`, `disabled={false}`,
// `variant="subtle"`), empty and derived props (`aria-label=""`,
// `removeLabel="Remove Design"`), no-op handlers, and — for the two icon stories —
// prints the icon as `{{ $$typeof: Symbol(react.forward_ref), render: () => {} }}`,
// which can't be pasted. Three panels show the story object itself, with about
// thirty lines of `argTypes` and development notes. Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no
// demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { CheckCircleIcon, InfoIcon, StarIcon, TagIcon } from "@dbm-design-system/icons";
import type { TagSize, TagTone, TagVariant } from "./Tag.types";

export const tagSnippets = {
  allTones: `{/* tone: "neutral" (default) | "brand" | "info" | "success" | "warning" | "danger" */}
<Tag variant="subtle" tone="success">success</Tag>`,

  solid: `{/* variant: "subtle" (default) | "solid" | "outlined" */}
<Tag variant="solid" tone="success">success</Tag>`,

  outlined: `<Tag variant="outlined" tone="success">success</Tag>`,

  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Tag size="lg">Size lg</Tag>`,

  withIcon: `{/* leadingIcon takes an icon component; TagIcon comes from @dbm-design-system/icons */}
<Tag tone="info" leadingIcon={TagIcon}>Design</Tag>`,

  withTrailingIcon: `{/* trailingIcon puts the icon after the label; StarIcon comes from @dbm-design-system/icons */}
<Tag tone="warning" trailingIcon={StarIcon}>Design</Tag>`,

  clickable: `{/* onClick makes the tag a button. handleClick is your handler. */}
<Tag tone="info" onClick={handleClick}>Design</Tag>`,

  selectable: `{/* Selectable and uncontrolled: it tracks its own state, starting from defaultSelected, and tells you
    about changes. handleSelectedChange receives the new boolean. */}
<Tag tone="info" defaultSelected={false} onSelectedChange={handleSelectedChange}>Design</Tag>`,

  selectableOutlined: `<Tag tone="info" variant="outlined" defaultSelected={false} onSelectedChange={handleSelectedChange}>
  Design
</Tag>`,

  selectableFilterGroup: `{/* Controlled: you own which tags are selected.
    const [selected, setSelected] = useState<Record<string, boolean>>({
      Design: true, Engineering: false, "In review": false,
    }); */}
{Object.keys(selected).map((filter) => (
  <Tag
    key={filter}
    tone="info"
    selected={selected[filter]}
    onSelectedChange={(next) => setSelected((prev) => ({ ...prev, [filter]: next }))}
  >
    {filter}
  </Tag>
))}`,

  disabled: `{/* disabled blocks every interaction: click, selection, and remove */}
<Tag
  tone="info"
  removable
  onRemove={handleRemove}
  defaultSelected={false}
  onSelectedChange={handleSelectedChange}
  onClick={handleClick}
  disabled
>
  Design
</Tag>`,

  removableFilterList: `{/* removable adds a remove button; onRemove is yours to act on.
    const [filters, setFilters] = useState(["Design", "Engineering", "In review"]); */}
{filters.map((filter) => (
  <Tag
    key={filter}
    tone="info"
    removable
    onRemove={() => setFilters(filters.filter((f) => f !== filter))}
  >
    {filter}
  </Tag>
))}`,

  removableAndSelectable: `{/* A tag can be removable and selectable at once.
    const [filters, setFilters] = useState(["Design", "Engineering"]);
    const [selected, setSelected] = useState<Record<string, boolean>>({ Design: true, Engineering: false }); */}
{filters.map((filter) => (
  <Tag
    key={filter}
    tone="info"
    removable
    onRemove={() => setFilters((prev) => prev.filter((f) => f !== filter))}
    selected={selected[filter] ?? false}
    onSelectedChange={(next) => setSelected((prev) => ({ ...prev, [filter]: next }))}
  >
    {filter}
  </Tag>
))}`,
} as const;

// The Playground's icon control hands the builder an icon — the component itself, or the
// control's option key for it — and this turns either back into the name a reader would write.
const iconNames: Array<[unknown, string]> = [
  [TagIcon, "TagIcon"],
  [StarIcon, "StarIcon"],
  [CheckCircleIcon, "CheckCircleIcon"],
  [InfoIcon, "InfoIcon"],
];
const iconKeys = "Tag|Star|CheckCircle|Info".split("|");
const iconName = (icon: unknown): string | undefined => {
  const byComponent = iconNames.find(([component]) => component === icon)?.[1];
  if (byComponent) return byComponent;
  // For a control with a `mapping`, Storybook's snippet `transform` is handed the control's
  // *option key* (`"Star"`), not the mapped component — so accept that form too.
  return typeof icon === "string" && iconKeys.includes(icon) ? `${icon}Icon` : undefined;
};

/** The Playground's live controls, as far as the snippet cares. */
export interface TagPlaygroundSnippetArgs {
  children?: unknown;
  tone?: TagTone;
  variant?: TagVariant;
  size?: TagSize;
  leadingIcon?: unknown;
  trailingIcon?: unknown;
  removable?: boolean;
  removeLabel?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. The icon controls give the builder the icon component,
 * which it writes back as its name; a removable tag gets an `onRemove`, since a remove
 * button that does nothing isn't a usage. `removeLabel` is only written when it isn't
 * the default (`Remove <label>`).
 */
export function tagPlaygroundSnippet(args: TagPlaygroundSnippetArgs): string {
  const label = String(args.children ?? "Design");
  const attributes: string[] = [];
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.variant && args.variant !== "subtle") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  const leading = iconName(args.leadingIcon);
  const trailing = iconName(args.trailingIcon);
  if (leading) attributes.push(`leadingIcon={${leading}}`);
  if (trailing) attributes.push(`trailingIcon={${trailing}}`);
  if (args.removable) {
    attributes.push("removable", "onRemove={handleRemove}");
    if (args.removeLabel && args.removeLabel !== `Remove ${label}`) attributes.push(`removeLabel="${args.removeLabel}"`);
  }
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);
  if (args.disabled) attributes.push("disabled");
  return `<Tag${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}>${label}</Tag>`;
}
