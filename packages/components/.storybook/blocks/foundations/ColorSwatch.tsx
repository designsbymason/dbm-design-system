/**
 * Foundations-only single color swatch — a resolved-color box plus a
 * label/sublabel pair (e.g. step number + hex, or token name + resolved
 * value). Not part of the published package.
 */
export function ColorSwatch({
  color,
  label,
  sublabel,
}: {
  color: string;
  label: string;
  sublabel?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
      <div
        style={{
          background: color,
          border: "var(--dbm-border-width-1) solid var(--dbm-border-subtle)",
          borderRadius: "var(--dbm-radius-md)",
          height: "var(--dbm-space-16)",
          width: "100%",
        }}
      />
      <div
        style={{
          color: "var(--dbm-text-primary)",
          fontSize: "var(--dbm-font-size-sm)",
          fontWeight: "var(--dbm-font-weight-semibold)",
        }}
      >
        {label}
      </div>
      {sublabel && (
        <code
          style={{
            color: "var(--dbm-text-tertiary)",
            fontSize: "var(--dbm-font-size-xs)",
          }}
        >
          {sublabel}
        </code>
      )}
    </div>
  );
}
