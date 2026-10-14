import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Input } from "../../atoms/Input";
import { FormField } from "../../molecules/FormField";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Select } from "../../molecules/Select";
import { TimePicker } from "../../molecules/TimePicker";
import { Button } from "../../atoms/Button";
import { Form } from "./Form";

// Real-browser checks for what jsdom can't evaluate: where focus really lands (a disabled control drops it, a hidden
// validity control must never take it), a live region read from the accessibility tree, the summary's focus ring,
// the buttons' width on a phone and right-to-left. Hidden from the sidebar and the Docs page, and still run as
// tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Inputs/Form/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

// A real key through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events.
const pressKey = async (key: string, code: string, windowsVirtualKeyCode: number, text?: string) => {
  await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key, code, windowsVirtualKeyCode, text });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode });
};
const pressEnter = () => pressKey("Enter", "Enter", 13, "\r");

const frame = (children: React.ReactNode) => <div style={{ maxInlineSize: "28rem" }}>{children}</div>;

export const EnterRefusedFocusesFirstInvalid: Story = {
  name: "Enter in a field refuses an invalid form and focuses the first invalid control",
  render: () =>
    frame(
      <Form aria-label="Sign up" onSubmit={() => undefined}>
        <FormField label="Email" name="email" required>
          {(field) => <Input {...field} type="email" />}
        </FormField>
        <FormField label="Username" name="username" required>
          {(field) => <Input {...field} />}
        </FormField>
        <Form.Submit>Create account</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const username = canvas.getByRole("textbox", { name: "Username" });
    username.focus();
    await userEvent.keyboard("ada");
    await pressEnter();
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus());
    // announced from a region that was in the page before: the accessibility tree has it as a status
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("1 error."));
  },
};

export const HiddenValidityControlNeverTakesFocus: Story = {
  name: "A required TimePicker refuses the form and focus lands on a segment, not the hidden control",
  render: () =>
    frame(
      <Form aria-label="Booking" onSubmit={() => undefined}>
        <FormField label="Start time" name="start" required>
          {(field) => <TimePicker {...field} />}
        </FormField>
        <Form.Submit>Book</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Book" }));
    await waitFor(() => {
      const active = document.activeElement as HTMLElement;
      expect(canvasElement.contains(active)).toBe(true);
      expect(active).not.toBe(document.body);
      // visually hidden validity inputs are 1px; a person's focus can't be on one
      const rect = active.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(8);
      expect(rect.height).toBeGreaterThan(8);
    });
    await expect(canvas.getByRole("status")).toBeInTheDocument();
  },
};

export const RequiredSelectIsFocusedTrigger: Story = {
  name: "A required Select refuses the form and focus lands on its trigger",
  render: () =>
    frame(
      <Form aria-label="Preferences" onSubmit={() => undefined}>
        <FormField label="Plan" name="plan" required>
          {(field) => (
            <Select {...field} placeholder="Choose a plan">
              <Select.Option value="free">Free</Select.Option>
              <Select.Option value="pro">Pro</Select.Option>
            </Select>
          )}
        </FormField>
        <Form.Submit>Save</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(canvas.getByRole("combobox", { name: /Plan/ })).toHaveFocus());
  },
};

export const BusyFormGivesFocusBack: Story = {
  name: "A busy form disables its fields and gives focus back to the one that was typed in",
  render: () =>
    frame(
      <Form
        aria-label="Sign up"
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 400))}
      >
        <FormField label="Email" name="email" required>
          {(field) => <Input {...field} type="email" />}
        </FormField>
        <Form.Submit>Create account</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("textbox", { name: "Email" });
    email.focus();
    await userEvent.keyboard("ada@example.com");
    await pressEnter();
    await waitFor(() => expect(email).toBeDisabled());
    await waitFor(() => expect(email).toBeEnabled(), { timeout: 3000 });
    // the browser moved focus off the control when it was disabled; the form puts it back
    await waitFor(() => expect(email).toHaveFocus());
  },
};

export const SummaryRingAndLinks: Story = {
  name: "The summary takes focus with a ring, and its links focus the controls",
  render: () =>
    frame(
      <Form aria-label="Sign up" focusTarget="summary" onSubmit={() => undefined}>
        <Form.Summary />
        <FormField label="Email" name="email" required>
          {(field) => <Input {...field} type="email" />}
        </FormField>
        <Form.Submit>Create account</Form.Submit>
      </Form>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("textbox", { name: "Email" });
    email.focus();
    await pressEnter();
    const summary = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>("[tabindex='-1']");
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    await waitFor(() => expect(summary).toHaveFocus());
    // keyboard-driven, so :focus-visible draws the ring
    await expect(getComputedStyle(summary).outlineWidth).toBe("2px");
    await userEvent.click(within(summary).getByRole("link", { name: /Email/ }));
    await waitFor(() => expect(email).toHaveFocus());
  },
};

export const OnAPhoneActionsTakeARowEach: Story = {
  name: "On a phone the buttons take a row each at the full width",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Form aria-label="Sign up">
      <Form.Actions data-testid="actions">
        <Button type="reset" variant="ghost">
          Reset
        </Button>
        <Form.Submit>Create account</Form.Submit>
      </Form.Actions>
    </Form>
  ),
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport didn't apply, rather than passing at desktop width.
    await expect(window.innerWidth).toBeLessThan(640);
    const actions = within(canvasElement).getByTestId("actions");
    const buttons = Array.from(actions.querySelectorAll("button"));
    const width = Math.round(actions.getBoundingClientRect().width);
    for (const button of buttons) await expect(Math.round(button.getBoundingClientRect().width)).toBe(width);
    await expect(buttons[0]?.getBoundingClientRect().bottom).toBeLessThanOrEqual(buttons[1]?.getBoundingClientRect().top as number);
  },
};

export const RightToLeft: Story = {
  name: "In right-to-left the summary's list is indented from the start side",
  render: () => (
    <div dir="rtl" style={{ maxInlineSize: "28rem" }}>
      <Form aria-label="Sign up" errors={{ email: "Enter an email address" }}>
        <Form.Summary />
        <FormField label="Email" name="email">
          {(field) => <Input {...field} />}
        </FormField>
      </Form>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("ul") as HTMLElement;
    const style = getComputedStyle(list);
    await expect(parseFloat(style.paddingRight)).toBeGreaterThan(0);
    await expect(parseFloat(style.paddingLeft)).toBe(0);
  },
};
