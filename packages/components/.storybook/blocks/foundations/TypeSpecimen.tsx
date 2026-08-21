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
          className="dbm-type-specimen-row"
          style={{
            alignItems: "baseline",
            borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-neutral-subtle)",
            display: "flex",
            gap: "var(--dbm-space-4)",
            paddingBlock: "var(--dbm-space-3)",
          }}
        >
          {/* `code` + `value` grouped into their own row (2026-08-10) so
              `.dbm-type-specimen-row`'s mobile media query can stack this
              pair above the sample text as one unit, unconditionally for
              every size — previously only `flex-wrap` decided whether the
              sample text dropped to its own line, so it only did that
              once a size was physically too wide to fit (roughly `lg`
              and up), leaving `xs`–`md` inconsistent with the rest. */}
          <div style={{ alignItems: "baseline", display: "flex", flexShrink: 0, gap: "var(--dbm-space-4)" }}>
            <code
              style={{
                color: "var(--dbm-text-tertiary)",
                flexShrink: 0,
                fontSize: "var(--dbm-font-size-xs)",
                textAlign: "center",
                width: "var(--dbm-space-16)",
              }}
            >
              {step}
            </code>
            <span
              style={{
                color: "var(--dbm-text-secondary)",
                flexShrink: 0,
                fontSize: "var(--dbm-font-size-sm)",
                lineHeight: "var(--dbm-line-height-relaxed)",
                width: "var(--dbm-space-32)",
              }}
            >
              {value}
            </span>
          </div>
          <span
            style={{
              color: "var(--dbm-text-primary)",
              fontFamily,
              fontSize: value,
              minWidth: 0,
              overflowWrap: "break-word",
            }}
          >
            Design builds meaning
          </span>
        </div>
      ))}
    </div>
  );
}
