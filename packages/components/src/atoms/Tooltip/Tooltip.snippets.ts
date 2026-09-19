// The code shown under each story's "Show code" button on Tooltip's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code prints
// `aria-label="" defaultOpen={false} delayDuration={400} disableHoverableContent={false}
// hideArrow={false} side="top"` inside the story's padding wrapper (there only to leave room
// for the tooltip), "Icon-only trigger" prints its icon as `{ $$typeof:
// Symbol(react.forward_ref), render: () => {} }`, and "Multiple tooltips" shows the story
// object with a nine-entry `argTypes` block. Each snippet here is the smallest real usage of
// what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { TooltipAlign, TooltipSide } from "./Tooltip.types";
import { quote } from "../../snippetHelpers";

export const tooltipSnippets = {
  sides: `{/* side: "top" (default) | "right" | "bottom" | "left". align: "start" | "center" (default) | "end". */}
<Tooltip content="Side: right" side="right">
  <Button variant="secondary">right</Button>
</Tooltip>`,

  multipleWithSharedProvider: `{/* A Tooltip works on its own. Put several inside one TooltipProvider and moving from one to the next
    opens it straight away, instead of waiting out the delay again. */}
<TooltipProvider>
  <Tooltip content="Bold">
    <Button variant="secondary">B</Button>
  </Tooltip>
  <Tooltip content="Italic">
    <Button variant="secondary">I</Button>
  </Tooltip>
  <Tooltip content="Underline">
    <Button variant="secondary">U</Button>
  </Tooltip>
</TooltipProvider>`,
} as const;

/** Which trigger a story puts inside the `Tooltip`. */
export type TooltipSnippetTrigger = "button" | "save" | "icon";

const triggers: Record<TooltipSnippetTrigger, string> = {
  button: '<Button variant="secondary">Hover or focus me</Button>',
  save: "<Button>Save</Button>",
  icon: '<IconButton icon={TrashIcon} aria-label="Delete" variant="destructive" />',
};

/** The Playground's live controls, as far as the snippet cares. */
export interface TooltipPlaygroundSnippetArgs {
  content?: unknown;
  /** The control's option key (`"Button trigger"` / `"Icon-only trigger"`). */
  children?: unknown;
  side?: TooltipSide;
  align?: TooltipAlign;
  delayDuration?: number;
  disableHoverableContent?: boolean;
  hideArrow?: boolean;
  defaultOpen?: boolean;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: `content` always, everything else
 * only when it differs from its default (`top`, `center`, 400ms, hoverable content, an arrow,
 * closed). The trigger control has a `mapping`, so Storybook hands the builder its option key;
 * `trigger` lets the stories that always render the same trigger ("Default", "Icon-only
 * trigger") say which one. An icon trigger gets a comment saying where its icon comes from.
 */
export function tooltipPlaygroundSnippet(args: TooltipPlaygroundSnippetArgs, trigger?: TooltipSnippetTrigger): string {
  const which = trigger ?? (args.children === "Icon-only trigger" ? "icon" : "button");
  const attributes = [`content=${quote(String(args.content ?? "Save your changes"))}`];
  if (args.side && args.side !== "top") attributes.push(`side="${args.side}"`);
  if (args.align && args.align !== "center") attributes.push(`align="${args.align}"`);
  if (args.delayDuration !== undefined && args.delayDuration !== 400) attributes.push(`delayDuration={${args.delayDuration}}`);
  if (args.disableHoverableContent) attributes.push("disableHoverableContent");
  if (args.hideArrow) attributes.push("hideArrow");
  if (args.defaultOpen) attributes.push("defaultOpen");
  if (args["aria-label"]) attributes.push(`aria-label=${quote(args["aria-label"])}`);
  const comment = which === "icon" ? "{/* TrashIcon comes from @dbm-design-system/icons */}\n" : "";
  return `${comment}<Tooltip ${attributes.join(" ")}>\n  ${triggers[which]}\n</Tooltip>`;
}
