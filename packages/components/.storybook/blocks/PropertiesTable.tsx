import { useOf } from "@storybook/addon-docs/blocks";
import type { Of } from "@storybook/addon-docs/blocks";
import type { ReactNode } from "react";
import { sortEntriesByOrder } from "./sortEntriesByOrder";

interface ArgTypeLike {
  description?: string;
  options?: unknown[];
  table?: {
    disable?: boolean;
    defaultValue?: { summary?: string };
  };
  type?: { name?: string; required?: boolean };
}

/** Splits `` `code` `` spans out of a plain-text JSDoc description into `<code>`. */
function renderInline(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function ValueOptions({ argType }: { argType: ArgTypeLike }) {
  if (Array.isArray(argType.options) && argType.options.length > 0) {
    return (
      <span className="dbm-proptable-options">
        {argType.options.map((option) => (
          <code key={String(option)}>{String(option)}</code>
        ))}
      </span>
    );
  }
  if (argType.type?.name === "boolean") {
    return (
      <span className="dbm-proptable-options">
        <code>true</code>
        <code>false</code>
      </span>
    );
  }
  return <span className="dbm-proptable-empty">—</span>;
}

/**
 * Docs-page-only Properties table — replaces the `<ArgTypes>` doc block with
 * one that includes a "Value options" column (the literal set of values a
 * prop accepts — enum members, `true`/`false` for booleans — which
 * `<ArgTypes>` has no way to show; see
 * guidelines/07-storybook-and-documentation-standards.md §4). Resolves the
 * same underlying argTypes data `<ArgTypes>` does, via the officially
 * exported `useOf` hook, so it stays in sync with each story file's
 * `argTypes`/JSDoc automatically. Not part of the published package.
 *
 * `order` lets a component's docs page force a sensible reading order
 * (content prop first, then core visual props, then behavioral/state props,
 * then advanced/escape-hatch props last) instead of whatever order the
 * underlying docgen happens to produce — pass every prop name explicitly;
 * anything omitted falls through in its natural remaining order at the end.
 */
export function PropertiesTable({ of, order }: { of: Of; order?: string[] }) {
  const resolved = useOf(of, ["meta"]);
  const argTypes =
    resolved.type === "meta" ? resolved.preparedMeta.argTypes : {};
  const filtered = Object.entries(argTypes ?? {}).filter(
    ([, argType]) => !(argType as ArgTypeLike)?.table?.disable,
  );
  const rows = sortEntriesByOrder(filtered, order);

  return (
    <table className="dbm-proptable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Value options</th>
          <th>Description</th>
          <th>Default</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, argType]) => {
          const at = argType as ArgTypeLike;
          const defaultSummary = at.table?.defaultValue?.summary;
          return (
            <tr key={name}>
              <td>
                <code>{name}</code>
                {at.type?.required && (
                  <span className="dbm-proptable-required" title="Required">
                    *
                  </span>
                )}
              </td>
              <td>
                <ValueOptions argType={at} />
              </td>
              <td>
                {at.description ? (
                  renderInline(at.description)
                ) : (
                  <span className="dbm-proptable-empty">—</span>
                )}
              </td>
              <td>
                {defaultSummary ? (
                  <code>{defaultSummary}</code>
                ) : (
                  <span className="dbm-proptable-empty">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
