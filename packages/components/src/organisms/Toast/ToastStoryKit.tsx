import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { useToast } from "./Toast";
import type { ToastOptions } from "./Toast.types";

/**
 * A box that keeps the toasts inside it, for Storybook only: every `<Canvas>` on a Docs page shares one document,
 * so a toast's `position: fixed` region would otherwise stack in the corner of the whole page. A `transform` makes
 * the box the containing block of its fixed descendants, and the provider draws its region into it through
 * `container`, so toasts sit against the box's edges as they would the viewport's.
 */
export function ToastStage({
  children,
  minBlockSize = "20rem",
}: {
  children: (container: HTMLElement | null) => ReactNode;
  /** How tall the box is; a story with several toasts or a top placement needs more room. */
  minBlockSize?: string;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={setContainer}
      style={{
        position: "relative",
        transform: "translateZ(0)",
        minBlockSize,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
        background: "var(--dbm-bg-canvas)",
      }}
    >
      {children(container)}
    </div>
  );
}

/** A button that raises a toast with the options it is given, from inside a provider. */
export function RaiseButton({
  label,
  options,
  variant = "secondary",
}: {
  label: string;
  options: ToastOptions | (() => ToastOptions);
  variant?: "primary" | "secondary" | "tertiary";
}) {
  const { toast } = useToast();
  return (
    <Button variant={variant} onClick={() => toast(typeof options === "function" ? options() : options)}>
      {label}
    </Button>
  );
}

/** A row of buttons, wrapping. */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>{children}</div>;
}

/** What the stories' toasts say, so each story differs only in what it sets. */
export const sampleOptions = {
  info: { tone: "info", title: "New version available", description: "Reload to get the latest changes." },
  success: { tone: "success", title: "Saved", description: "Your changes are live." },
  warning: { tone: "warning", title: "Storage almost full", description: "You have used 92% of your plan." },
  danger: { tone: "danger", title: "Payment failed", description: "Your card was declined." },
  neutral: { tone: "neutral", title: "Link copied", description: "Paste it anywhere." },
} as const satisfies Record<string, ToastOptions>;
