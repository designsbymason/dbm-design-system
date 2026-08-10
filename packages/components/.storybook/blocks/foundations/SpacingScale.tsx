import { primitives } from "@dbm-design-system/tokens";

/**
 * Foundations-only spacing-scale reference table — one row per step, each
 * paired with a bar rendered at its actual token width so the progression
 * is felt, not just read as numbers. Sourced live from `primitives.space`.
 * Reuses the `.dbm-proptable dbm-tokentable` styling already established
 * for Breakpoints/Miscellaneous's `TokenReferenceTable` (2026-08-09, for
 * visual consistency across Foundations reference tables) rather than
 * `TokenReferenceTable` itself, since that component's third column is
 * plain text — this one needs a rendered bar instead. Not part of the
 * published package.
 */
export function SpacingScale() {
  const entries = Object.entries(primitives.space).filter(([step]) => step !== "px");
  return (
    // Scroll container (2026-08-10) — same fix as `PropertiesTable`'s:
    // this table had no bounding box with `overflow-x: auto`, so on a
    // narrow viewport it (and the largest `space.*` steps' preview bars,
    // rendered at their literal token width) just overflowed the page
    // instead of scrolling within its own box.
    <div style={{ overflowX: "auto" }}>
      <table className="dbm-proptable dbm-tokentable">
        <thead>
          <tr>
            <th>Token</th>
            <th>Value</th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([step, value]) => (
            <tr key={step}>
              <td>
                <code>space.{step}</code>
              </td>
              <td>{value}</td>
              <td>
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
    </div>
  );
}
