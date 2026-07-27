import { primitives } from "@dbm-design-system/tokens";

/**
 * Foundations-only radius-scale swatch grid — one rounded box per step,
 * rendered at the actual token radius. Sourced live from
 * `primitives.radius`. Not part of the published package.
 */
export function RadiusScale() {
  const entries = Object.entries(primitives.radius);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-5)" }}>
      {entries.map(([step, value]) => (
        <div
          key={step}
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: "var(--dbm-space-2)",
          }}
        >
          <div
            style={{
              background: "var(--dbm-bg-brand-subtle)",
              border: "2px solid var(--dbm-border-focus)",
              borderRadius: value,
              height: "4rem",
              width: "4rem",
            }}
          />
          <code style={{ fontSize: "var(--dbm-font-size-xs)" }}>radius.{step}</code>
          <span style={{ color: "var(--dbm-text-tertiary)", fontSize: "var(--dbm-font-size-xs)" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
