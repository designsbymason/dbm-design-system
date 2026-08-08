import { primitives } from "@dbm-design-system/tokens";

/**
 * Foundations-only elevation-scale swatch grid — one card per step, the
 * actual token's `box-shadow` applied, shown against a background that
 * matches what each set is designed for (light shadows on a light
 * surface, dark shadows on a dark one — dark shadows on white would look
 * like nothing, since they're calibrated for a dark canvas). Sourced live
 * from `primitives.shadow`. Not part of the published package.
 */
export function ShadowScale({ mode }: { mode: "light" | "dark" }) {
  const entries = Object.entries(primitives.shadow[mode]);
  const containerBg = mode === "dark" ? primitives.color.gray[950] : primitives.color.gray[50];
  const cardBg = mode === "dark" ? primitives.color.gray[900] : primitives.color.neutral.white;

  return (
    <div
      style={{
        background: containerBg,
        borderRadius: "var(--dbm-radius-lg)",
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--dbm-space-6)",
        padding: "var(--dbm-space-6)",
      }}
    >
      {entries.map(([step, value]) => (
        <div
          key={step}
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: "var(--dbm-space-3)",
          }}
        >
          <div
            style={{
              background: cardBg,
              borderRadius: "var(--dbm-radius-md)",
              boxShadow: value,
              height: "var(--dbm-space-20)",
              width: "var(--dbm-space-20)",
            }}
          />
          <code
            style={{
              color: mode === "dark" ? primitives.color.gray[300] : primitives.color.gray[600],
              fontSize: "var(--dbm-font-size-xs)",
            }}
          >
            shadow.{mode}.{step}
          </code>
        </div>
      ))}
    </div>
  );
}
