import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spacer } from "./Spacer";

const meta: Meta<typeof Spacer> = {
  title: "Atoms/Layout/Spacer",
  component: Spacer,
  parameters: { layout: "padded" },
  // Spacer takes no props of its own — only the inherited native escape
  // hatches, none of which are meaningfully live-editable (05-component-
  // api-conventions.md §3), so every one gets `control: false` here.
  argTypes: {
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
};

export default meta;

type Story = StoryObj<typeof Spacer>;

const chipStyle = {
  background: "var(--dbm-bg-brand)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-on-brand)",
  padding: "var(--dbm-space-2) var(--dbm-space-3)",
};

/**
 * Spacer has no controllable props of its own — see the Properties table on
 * the Docs page for what each inherited native prop does. The Playground
 * still exists per the standard template, showing Spacer doing its one job
 * inside a real flex row.
 */
export const Playground: Story = {
  render: () => (
    <div style={{ alignItems: "center", display: "flex", width: "100%" }}>
      <span style={chipStyle}>Logo</span>
      <Spacer />
      <span style={chipStyle}>Nav actions</span>
    </div>
  ),
};

export const InARow: Story = {
  name: "Pushes content apart in a row",
  render: () => (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        width: "100%",
      }}
    >
      <span style={chipStyle}>Logo</span>
      <Spacer />
      <span style={chipStyle}>Nav actions</span>
    </div>
  ),
};
