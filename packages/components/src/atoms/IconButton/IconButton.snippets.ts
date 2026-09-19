// The code shown under each story's "Show code" button on IconButton's Docs page.
//
// Hand-written rather than generated from the rendered story: `icon` is a required
// prop, and the generated code prints it as `{{ $$typeof: Symbol(react.forward_ref),
// render: () => {} }}` on every one of the ten panels, which can't be pasted. It
// also spells out every default (`asChild={false}`, `rounded={false}`,
// `type="button"`), a no-op `onClick={() => {}}`, and the story's demo wrapper. Each
// snippet here is the smallest real usage of what its story shows — only exports of
// the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

import { HeartIcon, TrashIcon } from "@dbm-design-system/icons";

export const iconButtonSnippets = {
  allVariants: `{/* variant: "primary" (default) | "secondary" | "tertiary" | "ghost" | "destructive".
    An icon button has no visible text, so aria-label names it. TrashIcon comes from @dbm-design-system/icons. */}
<IconButton icon={TrashIcon} aria-label="Delete" variant="secondary" />`,

  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl". HeartIcon comes from @dbm-design-system/icons. */}
<IconButton icon={HeartIcon} aria-label="Favorite" size="lg" />`,

  loading: `{/* isLoading swaps the icon for a spinner and blocks interaction. HeartIcon comes from
    @dbm-design-system/icons. */}
<IconButton icon={HeartIcon} aria-label="Favorite" isLoading />`,

  toggle: `{/* Setting defaultPressed (or pressed) makes it a toggle button, with aria-pressed. onPressedChange
    receives the new state — handlePressedChange is yours. HeartIcon comes from @dbm-design-system/icons. */}
<IconButton
  icon={HeartIcon}
  aria-label="Favorite"
  variant="ghost"
  defaultPressed={false}
  onPressedChange={handlePressedChange}
/>`,

  asChild: `{/* asChild renders the icon button's styling onto your own element — here a link — which holds the icon.
    icon is a required prop but has no effect under asChild: put the icon in the child.
    HeartIcon comes from @dbm-design-system/icons. */}
<IconButton asChild icon={HeartIcon} aria-label="Favorite">
  <a href="/favorite">
    <HeartIcon />
  </a>
</IconButton>`,

  asChildDisabled: `{/* On an asChild icon button, disabled sets aria-disabled and blocks the click — an <a> has no native
    disabled attribute. HeartIcon comes from @dbm-design-system/icons. */}
<IconButton asChild disabled icon={HeartIcon} aria-label="Favorite">
  <a href="/favorite">
    <HeartIcon />
  </a>
</IconButton>`,
} as const;

// The Playground's icon control hands the builder an icon — the component itself, or the
// control's option key for it — and this turns either back into the name a reader would write.
const iconNames: Array<[unknown, string]> = [
  [HeartIcon, "HeartIcon"],
  [TrashIcon, "TrashIcon"],
];
const iconKeys = "Heart|Trash".split("|");
const iconName = (icon: unknown): string | undefined => {
  const byComponent = iconNames.find(([component]) => component === icon)?.[1];
  if (byComponent) return byComponent;
  // For a control with a `mapping`, Storybook's snippet `transform` is handed the control's
  // *option key* (`"Star"`), not the mapped component — so accept that form too.
  return typeof icon === "string" && iconKeys.includes(icon) ? `${icon}Icon` : undefined;
};

/** The Playground's live controls, as far as the snippet cares. */
export interface IconButtonPlaygroundSnippetArgs {
  icon?: unknown;
  variant?: string;
  size?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  rounded?: boolean;
  "aria-label"?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Playground-only: whether the button is a toggle. Not a real prop. */
  interactionMode?: "Non-toggle" | "Toggle";
  defaultPressed?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. `icon` is required, so it's always written (the icon
 * control's component, back as its name), and so is the `aria-label` an icon button
 * needs. Toggle isn't a prop — it's what setting `defaultPressed` means — so the
 * Playground's "Toggle" mode is written as `defaultPressed` plus an `onPressedChange`.
 */
export function iconButtonPlaygroundSnippet(args: IconButtonPlaygroundSnippetArgs): string {
  const attributes: string[] = [`icon={${iconName(args.icon) ?? "HeartIcon"}}`, `aria-label="${args["aria-label"] || "Favorite"}"`];
  if (args.variant && args.variant !== "primary") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.type && args.type !== "button") attributes.push(`type="${args.type}"`);
  if (args.isLoading) {
    attributes.push("isLoading");
    if (args.loadingLabel) attributes.push(`loadingLabel="${args.loadingLabel}"`);
  }
  if (args.interactionMode === "Toggle") {
    attributes.push(`defaultPressed={${Boolean(args.defaultPressed)}}`, "onPressedChange={handlePressedChange}");
  }
  if (args.disabled) attributes.push("disabled");
  return `<IconButton ${attributes.join(" ")} />`;
}
