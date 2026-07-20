import type { Meta, StoryObj } from "@storybook/react-vite";
import { Portal } from "./Portal";

// Purely structural/behavioral — no visual variants or breakpoint behavior of
// its own, so the story demonstrates *where in the DOM* content ends up
// rather than viewport-width coverage.
const meta: Meta<typeof Portal> = {
  title: "Atoms/Utility/Portal",
  component: Portal,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Portal>;

export const Default: Story = {
  render: () => (
    <div
      style={{
        border: "1px dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <p style={{ margin: 0 }}>
        This box is the local render tree. Open devtools and inspect the badge in the
        bottom-right corner — it&apos;s rendered at the end of <code>&lt;body&gt;</code>, not
        nested inside this box, even though it&apos;s declared here in JSX.
      </p>
      <Portal>
        <div
          style={{
            background: "var(--dbm-bg-brand)",
            borderRadius: "var(--dbm-radius-md)",
            bottom: "var(--dbm-space-4)",
            color: "var(--dbm-text-on-brand)",
            padding: "var(--dbm-space-3)",
            position: "fixed",
            right: "var(--dbm-space-4)",
          }}
        >
          Portaled content
        </div>
      </Portal>
    </div>
  ),
};

export const CustomContainer: Story = {
  name: "Custom container target",
  render: () => {
    const targetId = "portal-story-custom-target";
    return (
      <div
        style={{
          border: "1px dashed var(--dbm-border-default)",
          borderRadius: "var(--dbm-radius-md)",
          padding: "var(--dbm-space-4)",
        }}
      >
        <p style={{ marginTop: 0 }}>
          The badge below is portaled into the target box beneath it via the{" "}
          <code>container</code> prop, instead of <code>document.body</code>.
        </p>
        <div
          id={targetId}
          style={{
            border: "1px solid var(--dbm-border-strong)",
            borderRadius: "var(--dbm-radius-md)",
            minHeight: "3rem",
            padding: "var(--dbm-space-3)",
          }}
        />
        <PortalIntoTarget targetId={targetId} />
      </div>
    );
  },
};

function PortalIntoTarget({ targetId }: { targetId: string }) {
  const container = typeof document !== "undefined" ? document.getElementById(targetId) : null;
  if (!container) return null;
  return (
    <Portal container={container}>
      <span
        style={{
          background: "var(--dbm-bg-brand-subtle)",
          borderRadius: "var(--dbm-radius-sm)",
          color: "var(--dbm-text-link)",
          padding: "var(--dbm-space-1) var(--dbm-space-2)",
        }}
      >
        Portaled into custom container
      </span>
    </Portal>
  );
}

export const DisabledPortal: Story = {
  name: "disablePortal (renders in place)",
  render: () => (
    <div
      style={{
        border: "1px dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <p style={{ marginTop: 0 }}>
        With <code>disablePortal</code>, the badge below renders exactly where it&apos;s declared
        in JSX — no portal, no wrapper element.
      </p>
      <Portal disablePortal>
        <div
          style={{
            background: "var(--dbm-bg-brand-subtle)",
            borderRadius: "var(--dbm-radius-md)",
            color: "var(--dbm-text-link)",
            display: "inline-block",
            padding: "var(--dbm-space-3)",
          }}
        >
          Not portaled — rendered in place
        </div>
      </Portal>
    </div>
  ),
};

export const AsChild: Story = {
  name: "asChild (no wrapper div)",
  render: () => (
    <div
      style={{
        border: "1px dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <p style={{ margin: 0 }}>
        With <code>asChild</code>, the badge below is portaled as itself — inspect devtools and
        you&apos;ll find a single <code>&lt;span&gt;</code> at the end of <code>&lt;body&gt;</code>
        , not a <code>&lt;span&gt;</code> nested inside an extra portal <code>&lt;div&gt;</code>.
      </p>
      <Portal asChild>
        <span
          style={{
            background: "var(--dbm-bg-brand)",
            borderRadius: "var(--dbm-radius-md)",
            bottom: "var(--dbm-space-4)",
            color: "var(--dbm-text-on-brand)",
            padding: "var(--dbm-space-3)",
            position: "fixed",
            right: "var(--dbm-space-4)",
          }}
        >
          Portaled as itself (asChild)
        </span>
      </Portal>
    </div>
  ),
};
