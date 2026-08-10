export interface TokenReferenceRow {
  name: string;
  value: string;
  usage?: string;
}

/**
 * Foundations-only generic reference table (Name / Value / Usage) for
 * scales too small or non-visual to need a dedicated swatch component
 * (border widths, opacity, z-index, breakpoints). Reuses the `.dbm-proptable`
 * styling already established for component Properties tables
 * (`.storybook/docs.css`) for visual consistency. Not part of the
 * published package.
 */
export function TokenReferenceTable({ rows }: { rows: TokenReferenceRow[] }) {
  return (
    // Scroll container (2026-08-10) — same fix as `PropertiesTable`'s: no
    // bounding box with `overflow-x: auto`, so a wide row (long token
    // name/usage text) overflowed the page instead of scrolling within
    // its own box on a narrow viewport.
    <div style={{ overflowX: "auto" }}>
      <table className="dbm-proptable dbm-tokentable">
        <thead>
          <tr>
            <th>Token</th>
            <th>Value</th>
            <th>Usage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              <td>{row.value}</td>
              <td>
                {row.usage ? row.usage : <span className="dbm-proptable-empty">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
