import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { FocusTrap } from "./FocusTrap";

const meta: Meta<typeof FocusTrap> = {
  title: "Atoms/Utility/FocusTrap",
  component: FocusTrap,
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: false,
      description: "The content focus is managed/trapped within.",
    },
    loop: {
      control: "boolean",
      description:
        "When true, tabbing from the last focusable element focuses the first (and shift+tab from the first focuses the last).",
      table: { defaultValue: { summary: "false" } },
    },
    trapped: {
      control: "boolean",
      description:
        "When true, focus cannot escape the trap via keyboard, pointer, or a programmatic focus call.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: "boolean",
      description:
        "Merges the trap's focus-management behavior directly onto children instead of rendering an extra wrapping <div> around it. children must be a single valid element when set.",
      table: { defaultValue: { summary: "false" } },
    },
    onMountAutoFocus: {
      control: false,
      description: "Called when focus moves into the trap on mount. Can be prevented.",
    },
    onUnmountAutoFocus: {
      control: false,
      description: "Called when focus moves out of the trap on unmount. Can be prevented.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    trapped: true,
    loop: true,
    asChild: false,
  },
};

export default meta;

type Story = StoryObj<typeof FocusTrap>;

const fieldStyle = {
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-sm)",
  display: "block",
  marginBottom: "var(--dbm-space-3)",
  padding: "var(--dbm-space-2)",
  width: "100%",
};

const boxStyle = {
  background: "var(--dbm-bg-surface)",
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-md)",
  color: "var(--dbm-text-primary)",
  maxWidth: "20rem",
  padding: "var(--dbm-space-4)",
};

/** Drive every prop live. */
export const Playground: Story = {
  render: (args) => (
    <FocusTrap {...args}>
      <div style={boxStyle}>
        <p style={{ marginTop: 0 }}>
          Tab through these fields — with <code>loop</code>, focus cycles back to the first field
          after the last; with <code>trapped</code>, it never escapes to elements outside this box.
        </p>
        <input style={fieldStyle} placeholder="First field" />
        <input style={fieldStyle} placeholder="Second field" />
        <button type="button" style={fieldStyle}>
          Third field (button)
        </button>
      </div>
    </FocusTrap>
  ),
};

export const Default: Story = {
  argTypes: { asChild: { control: false } },
  args: { asChild: undefined },
  render: (args) => (
    <FocusTrap {...args}>
      <div style={boxStyle}>
        <p style={{ marginTop: 0 }}>
          Tab through these fields — with <code>loop</code>, focus cycles back to the first field
          after the last, and never escapes to elements outside this box.
        </p>
        <input style={fieldStyle} placeholder="First field" />
        <input style={fieldStyle} placeholder="Second field" />
        <button type="button" style={fieldStyle}>
          Third field (button)
        </button>
      </div>
    </FocusTrap>
  ),
};

export const MergedOntoChild: Story = {
  name: "Merged onto a single child (asChild)",
  // Deliberately kept OUT of the Docs page's embed list (FocusTrap.mdx) —
  // reachable only via the sidebar, the same treatment already established
  // for BackToTop's/Affix's own interaction-sensitive stories (see
  // 07-storybook-and-documentation-standards.md §4.1's "A story whose own
  // render relies on real window scroll..." entry for that precedent).
  // Root cause here is different but the fix pattern is identical: Radix's
  // FocusScope unconditionally registers *every* mounted instance into a
  // single shared `focusScopesStack` (confirmed by reading
  // @radix-ui/react-focus-scope's own source, not guessed) — whichever
  // instance mounts *last* pauses every previously-mounted one's own
  // Tab-key handling, entirely regardless of that later instance's own
  // `trapped`/`loop` values. No prop combination on this story can prevent
  // it from pausing the Playground story's own loop/trap the moment both
  // are mounted together on one Docs page (found 2026-09-09, user-
  // reported: Playground's own `loop` visibly stopped wrapping once this
  // story's Canvas was also embedded). Kept at the meta defaults
  // (trapped/loop both on) since it no longer needs the detrapped
  // workaround once it's not coexisting with another mounted FocusTrap —
  // this is the more representative, realistic demo of `asChild` in
  // practice (typically paired with real trapping, like a real dialog).
  argTypes: { asChild: { control: false } },
  args: { asChild: true },
  render: (args) => (
    <FocusTrap {...args}>
      <div role="group" aria-label="Merged focus trap" style={boxStyle}>
        <p style={{ marginTop: 0 }}>
          <code>asChild</code> merges the trap directly onto this box — no extra wrapping{" "}
          <code>&lt;div&gt;</code> is rendered around it (inspect the DOM to confirm).
        </p>
        <input style={fieldStyle} placeholder="First field" />
        <input style={fieldStyle} placeholder="Second field" />
      </div>
    </FocusTrap>
  ),
};

export const KeyboardInteraction: Story = {
  name: "Interaction: Tab cycles and never escapes the trap",
  args: { trapped: true, loop: true },
  render: (args) => (
    <FocusTrap {...args}>
      <div style={boxStyle}>
        <input style={fieldStyle} placeholder="First field" />
        <input style={fieldStyle} placeholder="Second field" />
        <button type="button" style={fieldStyle}>
          Third field (button)
        </button>
      </div>
    </FocusTrap>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByPlaceholderText("First field");
    const second = canvas.getByPlaceholderText("Second field");
    const third = canvas.getByRole("button", { name: "Third field (button)" });

    first.focus();
    await expect(first).toHaveFocus();

    await userEvent.tab();
    await expect(second).toHaveFocus();

    await userEvent.tab();
    await expect(third).toHaveFocus();

    // loop wraps focus back to the first field instead of escaping the
    // trap to whatever real elements happen to sit outside this canvas.
    await userEvent.tab();
    await expect(first).toHaveFocus();
  },
};
