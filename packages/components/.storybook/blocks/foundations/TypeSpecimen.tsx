import { primitives } from "@dbm-design-system/tokens";

/**
 * Foundations-only type specimen — one row per font-size step, rendered
 * at its actual (fluid, where applicable) size with real sample text, so
 * the scale is felt rather than just read as numbers. Sourced live from
 * `primitives["font-size"]`. Not part of the published package.
 */
export function TypeSpecimen({
  family = "primary",
}: {
  family?: "primary" | "secondary";
}) {
  const entries = Object.entries(primitives["font-size"]);
  const fontFamily =
    family === "primary"
      ? "var(--dbm-font-family-primary)"
      : "var(--dbm-font-family-secondary)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}>
      {entries.map(([step, value]) => (
        <div
          key={step}
          style={{
            alignItems: "baseline",
            borderBlockEnd: "1px solid var(--dbm-border-subtle)",
            display: "flex",
            gap: "var(--dbm-space-4)",
            paddingBlock: "var(--dbm-space-3)",
          }}
        >
          <code
            style={{
              color: "var(--dbm-text-tertiary)",
              flexShrink: 0,
              fontSize: "var(--dbm-font-size-xs)",
              width: "3rem",
            }}
          >
            {step}
          </code>
          <code
            style={{
              color: "var(--dbm-text-tertiary)",
              flexShrink: 0,
              fontSize: "var(--dbm-font-size-xs)",
              width: "15rem",
            }}
          >
            {value}
          </code>
          <span style={{ fontFamily, fontSize: value }}>Design builds meaning</span>
        </div>
      ))}
    </div>
  );
}
