import { useState } from "react";
import { primitives } from "@dbm-design-system/tokens";

const REPRESENTATIVE_EASING = primitives.motion.easing.standard;
const REPRESENTATIVE_DURATION = primitives.motion.duration.moderate;

/**
 * Foundations-only motion-scale demo — one row per token, each showing the
 * token name, its usage description, AND a replayable dot-on-a-track demo
 * together (not the description and the demo as two separate lists) so a
 * reader sees what a token means and how it feels in the same place.
 * Isolates either the duration axis (fixed "standard" easing) or the
 * easing axis (fixed "moderate" duration) so each token's effect is felt
 * on its own rather than lost in a combinatorial grid of duration ×
 * easing. Uses `left` (not `transform: translateX`) so the percentage-
 * based keyframe resolves against the track's actual width regardless of
 * viewport. Sourced live from `primitives.motion`. Not part of the
 * published package.
 */
export function MotionScale({
  dimension,
  tokens,
}: {
  dimension: "duration" | "easing";
  tokens: { name: string; usage: string }[];
}) {
  const [replayKey, setReplayKey] = useState(0);

  const timingFor = (name: string) =>
    dimension === "duration"
      ? `${primitives.motion.duration[name as keyof typeof primitives.motion.duration]} ${REPRESENTATIVE_EASING}`
      : `${REPRESENTATIVE_DURATION} ${primitives.motion.easing[name as keyof typeof primitives.motion.easing]}`;

  return (
    <div>
      <style>{`
        @keyframes dbm-motion-demo {
          from { left: 0; }
          to { left: calc(100% - var(--dbm-space-6)); }
        }
      `}</style>
      <button
        onClick={() => setReplayKey((key) => key + 1)}
        style={{
          background: "var(--dbm-bg-brand)",
          border: "none",
          borderRadius: "var(--dbm-radius-md)",
          color: "var(--dbm-text-on-brand)",
          cursor: "pointer",
          fontSize: "var(--dbm-font-size-sm)",
          fontWeight: "var(--dbm-font-weight-semibold)",
          marginBlockEnd: "var(--dbm-space-4)",
          padding: "var(--dbm-space-2) var(--dbm-space-4)",
        }}
        type="button"
      >
        Replay
      </button>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {tokens.map(({ name, usage }) => (
          <div
            key={name}
            className="dbm-motion-demo-row"
            style={{
              alignItems: "center",
              borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-subtle)",
              display: "flex",
              gap: "var(--dbm-space-4)",
              paddingBlock: "var(--dbm-space-3)",
            }}
          >
            {/* `code` + `usage` grouped into their own row (2026-08-10) so
                `.dbm-motion-demo-row`'s mobile media query can stack the
                animation track below this pair unconditionally, the same
                fix as `TypeSpecimen`'s row for the identical reason. */}
            <div style={{ alignItems: "center", display: "flex", flex: 1, gap: "var(--dbm-space-4)", minWidth: 0 }}>
              <code style={{ flexShrink: 0, fontSize: "var(--dbm-font-size-xs)", minWidth: "11rem" }}>
                motion.{dimension}.{name}
              </code>
              <span
                style={{
                  color: "var(--dbm-text-tertiary)",
                  flex: 1,
                  fontSize: "var(--dbm-font-size-sm)",
                  minWidth: 0,
                  overflowWrap: "break-word",
                }}
              >
                {usage}
              </span>
            </div>
            <div
              style={{
                background: "var(--dbm-bg-neutral-subtle)",
                borderRadius: "var(--dbm-radius-full)",
                flexShrink: 0,
                height: "var(--dbm-space-6)",
                position: "relative",
                width: "var(--dbm-space-32)",
              }}
            >
              <div
                key={replayKey}
                style={{
                  animation: `dbm-motion-demo ${timingFor(name)}`,
                  background: "var(--dbm-bg-brand)",
                  borderRadius: "var(--dbm-radius-full)",
                  height: "var(--dbm-space-6)",
                  left: 0,
                  position: "absolute",
                  width: "var(--dbm-space-6)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
