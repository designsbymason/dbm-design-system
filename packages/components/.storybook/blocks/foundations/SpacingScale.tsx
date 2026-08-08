import { primitives } from "@dbm-design-system/tokens";

/**
 * Foundations-only spacing-scale bar chart — one row per step, each bar
 * rendered at its actual token width so the progression is felt, not just
 * read as numbers. Sourced live from `primitives.space`. Not part of the
 * published package.
 */
export function SpacingScale() {
  const entries = Object.entries(primitives.space).filter(([step]) => step !== "px");
  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {entries.map(([step, value]) => (
          <tr key={step} style={{ borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-subtle)" }}>
            <td style={{ padding: "var(--dbm-space-2) var(--dbm-space-3)", whiteSpace: "nowrap" }}>
              <code>space.{step}</code>
            </td>
            <td
              style={{
                color: "var(--dbm-text-tertiary)",
                fontFamily: "var(--dbm-font-family-mono)",
                fontSize: "var(--dbm-font-size-xs)",
                padding: "var(--dbm-space-2) var(--dbm-space-3)",
                whiteSpace: "nowrap",
              }}
            >
              {value}
            </td>
            <td style={{ padding: "var(--dbm-space-2) var(--dbm-space-3)", width: "100%" }}>
              <div
                style={{
                  background: "var(--dbm-bg-brand)",
                  borderRadius: "var(--dbm-radius-xs)",
                  height: "var(--dbm-space-4)",
                  width: value,
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
