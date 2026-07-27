import { useState } from "react";
import { primitives } from "@dbm-design-system/tokens";

const REPRESENTATIVE_EASING = primitives.motion.easing.standard;
const REPRESENTATIVE_DURATION = primitives.motion.duration.moderate;

/**
 * Foundations-only motion-scale demo — a dot that slides across a track,
 * replayable on click, isolating either the duration axis (fixed
 * "standard" easing) or the easing axis (fixed "moderate" duration) so
 * each token's effect is felt on its own rather than lost in a
 * combinatorial grid of duration × easing. Uses `left` (not
 * `transform: translateX`) so the percentage-based keyframe resolves
 * against the track's actual width regardless of viewport. Sourced live
 * from `primitives.motion`. Not part of the published package.
 */
export function MotionScale({ dimension }: { dimension: "duration" | "easing" }) {
  const [replayKey, setReplayKey] = useState(0);

  const rows =
    dimension === "duration"
      ? Object.entries(primitives.motion.duration).map(([name, value]) => ({
          name,
          timing: `${value} ${REPRESENTATIVE_EASING}`,
        }))
      : Object.entries(primitives.motion.easing).map(([name, value]) => ({
          name,
          timing: `${REPRESENTATIVE_DURATION} ${value}`,
        }));

  return (
    <div>
      <style>{`
        @keyframes dbm-motion-demo {
          from { left: 0; }
          to { left: calc(100% - 1.5rem); }
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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        {rows.map((row) => (
          <div key={row.name} style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
            <code style={{ flexShrink: 0, fontSize: "var(--dbm-font-size-xs)", width: "8rem" }}>
              motion.{dimension}.{row.name}
            </code>
            <div
              style={{
                background: "var(--dbm-bg-subtle)",
                borderRadius: "var(--dbm-radius-full)",
                flex: 1,
                height: "1.5rem",
                position: "relative",
              }}
            >
              <div
                key={replayKey}
                style={{
                  animation: `dbm-motion-demo ${row.timing}`,
                  background: "var(--dbm-bg-brand)",
                  borderRadius: "var(--dbm-radius-full)",
                  height: "1.5rem",
                  left: 0,
                  position: "absolute",
                  width: "1.5rem",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
