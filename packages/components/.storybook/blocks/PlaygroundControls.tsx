import { ArrowCounterClockwiseIcon } from "@dbm-design-system/icons";
import { DocsContext, useOf } from "@storybook/addon-docs/blocks";
import type { Of } from "@storybook/addon-docs/blocks";
import { useContext } from "react";
import type { ReactNode } from "react";
import { FieldLabel } from "../../src/atoms/FieldLabel";
import { IconButton } from "../../src/atoms/IconButton";
import { Input } from "../../src/atoms/Input";
import { Switch } from "../../src/atoms/Switch";
import { Tooltip } from "../../src/atoms/Tooltip";
import { Select } from "../../src/molecules/Select";
import { sortEntriesByOrder } from "./sortEntriesByOrder";
import { usePlaygroundArgs } from "./usePlaygroundArgs";

interface ArgTypeLike {
  control?: { type?: string; disable?: boolean } | false;
  options?: unknown[];
  table?: { disable?: boolean };
}

/**
 * One prop's row: `FieldLabel` on the left, the matching interactive
 * widget on the right — dispatched by `argType.control.type`, using this
 * design system's own form atoms instead of Storybook's own Controls
 * widgets. Unrecognized control types fall back to a plain text `Input`
 * rather than being silently dropped, since every remaining row here has
 * already been confirmed interactive (see the `PlaygroundControls`
 * filter below) — better a best-effort text box than a missing control.
 */
function ControlField({
  name,
  argType,
  value,
  onChange,
}: {
  name: string;
  argType: ArgTypeLike;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  // `argType.control &&` already truthy-narrows away the `false` member of
  // `{ type?: string; disable?: boolean } | false` (the only falsy one),
  // so a further `!== false` check is redundant — and, now that
  // `.storybook` is type-checked, TS flags it as a comparison that can
  // never be false (TS2367), not just a style nit.
  const controlType = argType.control ? argType.control.type : undefined;
  const fieldId = `playground-control-${name}`;

  let widget: ReactNode;
  if (controlType === "boolean") {
    widget = (
      <Switch
        id={fieldId}
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
    );
  } else if (controlType === "select" || controlType === "radio") {
    // Options aren't always strings — e.g. Affix's `offset` (a numeric
    // space scale) or Heading's `level` (1–6) — but `Select` only deals in
    // string values internally. Real, previously-shipped bug: comparing
    // `typeof value === "string"` to decide what to display meant any
    // non-string arg (a plain number, most commonly the default `0`, which
    // is also falsy) always read as unset, rendering the placeholder
    // instead of the real value; found via direct user report that
    // Affix's `offset` control looked broken on its Docs page. Fixed by
    // stringifying for comparison/display, then mapping the selected
    // string back to the original option (preserving its real type —
    // including `undefined`, which some option lists include as a valid
    // choice, e.g. Avatar's `loading`/`status`) before calling `onChange`.
    const options = Array.isArray(argType.options) ? argType.options : [];
    widget = (
      <Select
        id={fieldId}
        value={value === undefined ? undefined : String(value)}
        onValueChange={(selected) => {
          const index = options.findIndex((option) => String(option) === selected);
          onChange(index === -1 ? selected : options[index]);
        }}
        placeholder="Choose option…"
      >
        {options.map((option) => (
          <Select.Option key={String(option)} value={String(option)}>
            {String(option)}
          </Select.Option>
        ))}
      </Select>
    );
  } else if (controlType === "number") {
    widget = (
      <Input
        id={fieldId}
        type="number"
        value={typeof value === "number" ? value : ""}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? undefined : Number(next));
        }}
      />
    );
  } else {
    // "text" and any other/unrecognized control type.
    widget = (
      <Input
        id={fieldId}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: "var(--dbm-space-3)",
        minWidth: 0,
      }}
    >
      <FieldLabel
        htmlFor={fieldId}
        size="md"
        style={{
          flex: "0 0 var(--dbm-space-32)",
          fontWeight: "var(--dbm-font-weight-medium)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "var(--dbm-space-32)",
        }}
      >
        {name}
      </FieldLabel>
      <div style={{ display: "flex", flex: "1 1 auto", justifyContent: "flex-end", minWidth: 0 }}>
        {widget}
      </div>
    </div>
  );
}

/**
 * The Playground section's compact controls panel — a custom-rendered
 * replacement for Storybook's own `<Controls of={X}>` block (see
 * guidelines/07-storybook-and-documentation-standards.md §4 and this
 * component's introduction in the commit that added it for the full
 * rationale: Storybook's ArgsTable renders every row as two separately-
 * boxed table cells, which no CSS override can turn into "one border
 * around the whole panel" once `border-collapse` no longer applies).
 * Same `of`/`exclude` API as `<Controls>` for a drop-in swap at the MDX
 * call site.
 *
 * Layout is inline styles with `var(--dbm-*)` tokens, matching every other
 * docs-only block in this folder (`RelatedCard`, `ColorSwatch`,
 * `TypeSpecimen`) rather than a CSS Module — those are for the published
 * component library; this is Storybook-only tooling. The one exception is
 * the row grid itself (`.dbm-playground-controls-grid`, in `docs.css`):
 * stacking to a single column below `breakpoint.sm` needs a real media
 * query, which inline styles can't express. Deliberately no divider lines
 * between rows, only the outer card gets a border — spacing alone
 * separates rows, so there's no ambiguity about a border being "around" a
 * field.
 *
 * `order` mirrors `PropertiesTable`'s prop of the same name (same
 * `sortEntriesByOrder` helper) — pass the same array to both so a
 * component's docs page defines one sensible prop reading order and reuses
 * it for the full Properties table and this compact panel alike.
 */
export function PlaygroundControls({
  of,
  exclude = [],
  order,
}: {
  of: Of;
  exclude?: string[];
  order?: string[];
}) {
  const context = useContext(DocsContext);
  const resolved = useOf(of, ["story"]);
  const story = resolved.type === "story" ? resolved.story : undefined;
  const [args, updateArgs, resetArgs] = usePlaygroundArgs(context, story);

  if (!story) return null;

  const argTypes = story.argTypes as Record<string, ArgTypeLike>;
  const filtered = Object.entries(argTypes).filter(([name, argType]) => {
    if (exclude.includes(name)) return false;
    // Same redundant-comparison fix as `ControlField` above — `!argType.control`
    // alone already excludes the `false` member.
    if (!argType.control) return false;
    if (argType.control.disable) return false;
    return true;
  });
  const rows = sortEntriesByOrder(filtered, order);

  return (
    <div
      style={{
        background: "var(--dbm-bg-surface)",
        border: "var(--dbm-border-width-1) solid var(--dbm-border-neutral-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-4)",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginBlockEnd: "var(--dbm-space-2)" }}>
        <Tooltip content="Reset to defaults">
          <IconButton
            icon={ArrowCounterClockwiseIcon}
            aria-label="Reset controls to defaults"
            size="sm"
            variant="ghost"
            onClick={() => resetArgs()}
          />
        </Tooltip>
      </div>
      <div className="dbm-playground-controls-grid">
        {rows.map(([name, argType]) => (
          <ControlField
            key={name}
            name={name}
            argType={argType}
            value={args[name]}
            onChange={(value) => updateArgs({ [name]: value })}
          />
        ))}
      </div>
    </div>
  );
}
