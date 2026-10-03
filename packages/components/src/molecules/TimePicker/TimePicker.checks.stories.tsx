import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { send } from "../CodeBlock/browserProtocol";
import { TimePicker } from "./TimePicker";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real layout, text direction, forced colours, focus
// order — measured in Chromium.
const meta: Meta = {
  title: "Molecules/Inputs/TimePicker/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

export const HeightMatchesInputAndButton: Story = {
  name: "At every size the field is as tall as an Input and a Button",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`row-${size}`} style={{ display: "flex", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
          <TimePicker size={size} aria-label={`t-${size}`} defaultValue="09:30" onClear={() => {}} />
          <Input size={size} aria-label={`i-${size}`} defaultValue="09:30" onClear={() => {}} />
          <Button size={size}>Go</Button>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const row = canvas.getByTestId(`row-${size}`);
      const [picker, input, button] = [...row.children] as HTMLElement[];
      const height = (element: HTMLElement) => element.getBoundingClientRect().height;
      // The picker's buttons are padded (with a compensating negative margin), so they must not stretch the row.
      await expect(Math.abs(height(picker!) - height(button!))).toBeLessThan(1);
      await expect(Math.abs(height(picker!) - height(input!.closest("[class]") as HTMLElement))).toBeLessThan(1);
    }
  },
};

export const WidthStaysPut: Story = {
  name: "Filling the field in never changes its width",
  render: () => <TimePicker aria-label="Start time" data-testid="field" />,
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByTestId("field");
    const empty = field.getBoundingClientRect().width;
    await userEvent.click(within(field).getByRole("spinbutton", { name: "Hour" }));
    await userEvent.keyboard("1");
    await expect(field.getBoundingClientRect().width).toBe(empty);
    await userEvent.keyboard("2");
    await userEvent.keyboard("45p");
    await expect(field.getBoundingClientRect().width).toBe(empty);
    await userEvent.keyboard("{Backspace}");
    await expect(field.getBoundingClientRect().width).toBe(empty);
  },
};

export const TabOrder: Story = {
  name: "One tab stop per segment, then the picker button, then the next control",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      <TimePicker aria-label="Start time" defaultValue="09:30" onClear={() => {}} />
      <Button>After</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const order = ["Hour", "Minute", "AM/PM", "Clear time", "Choose time", "After"];
    (document.activeElement as HTMLElement | null)?.blur();
    for (const name of order) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(canvas.getByRole(name.endsWith("time") || name === "After" ? "button" : "spinbutton", { name }));
    }
  },
};

export const PickerScrollsToTheChosenOption: Story = {
  name: "The picker opens with the chosen hour and minute in view",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="22:47" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Choose time" }));
    await screen.findByRole("dialog");
    await settle();
    for (const [column, text] of [["Hour", "22"], ["Minute", "47"]] as const) {
      const box = screen.getByRole("listbox", { name: column });
      const chosen = within(box).getByRole("option", { name: text });
      const outer = box.getBoundingClientRect();
      const inner = chosen.getBoundingClientRect();
      // The column really scrolls (it has more than it shows), and the chosen option is inside what it shows.
      await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
      await expect(inner.top).toBeGreaterThanOrEqual(outer.top - 1);
      await expect(inner.bottom).toBeLessThanOrEqual(outer.bottom + 1);
    }
  },
};

export const OptionFocusRingIsInside: Story = {
  name: "An option's focus ring is drawn inside its column, not clipped by it",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="09:30" defaultOpen />,
  play: async () => {
    await screen.findByRole("dialog");
    await settle();
    const box = screen.getByRole("listbox", { name: "Hour" });
    const option = within(box).getByRole("option", { name: "08" });
    option.focus();
    await userEvent.keyboard("{ArrowDown}");
    const focused = document.activeElement as HTMLElement;
    const style = getComputedStyle(focused);
    await expect(focused.matches(":focus-visible")).toBe(true);
    // A negative offset puts the ring inside the option's own box.
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
    await expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
  },
};

export const PickerFitsAPhone: Story = {
  name: "On a phone the picker stays on screen",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <TimePicker aria-label="Start time" showSeconds defaultValue="09:30:15" size="sm" defaultOpen />
    </div>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(480);
    const dialog = await screen.findByRole("dialog");
    await settle();
    const rect = dialog.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    // All four columns are there, and none is cut off the panel's edge.
    for (const name of ["Hour", "Minute", "Second", "AM/PM"]) {
      const column = within(dialog).getByRole("listbox", { name }).getBoundingClientRect();
      await expect(column.right).toBeLessThanOrEqual(rect.right + 1);
      await expect(column.left).toBeGreaterThanOrEqual(rect.left - 1);
    }
  },
};

export const RightToLeft: Story = {
  name: "Right to left: the digits keep their order, and the field's parts follow the page",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="09:30" onClear={() => {}} />,
  play: async ({ canvasElement }) => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    try {
      await settle();
      const canvas = within(canvasElement);
      const hour = canvas.getByRole("spinbutton", { name: "Hour" }).getBoundingClientRect();
      const minute = canvas.getByRole("spinbutton", { name: "Minute" }).getBoundingClientRect();
      const clear = canvas.getByRole("button", { name: "Clear time" }).getBoundingClientRect();
      const picker = canvas.getByRole("button", { name: "Choose time" }).getBoundingClientRect();
      // Hours before minutes, left to right, whatever the page's direction.
      await expect(hour.left).toBeLessThan(minute.left);
      // The buttons sit at the end of the field, which in this direction is the left, in order: picker last.
      await expect(clear.right).toBeLessThanOrEqual(hour.left);
      await expect(picker.right).toBeLessThanOrEqual(clear.left + 1);
      // And ArrowRight still goes on to the minutes, since segments are laid out left to right.
      canvas.getByRole("spinbutton", { name: "Hour" }).focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("spinbutton", { name: "Minute" })).toHaveFocus();
    } finally {
      document.documentElement.dir = previous;
    }
  },
};

export const ForcedColors: Story = {
  name: "Forced colours: the focused segment and the chosen option still stand out",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="09:30" defaultOpen />,
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const colour = (value: string) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    await screen.findByRole("dialog");
    await emulate("active");
    try {
      await settle();
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const field = within(canvasElement).getByRole("group", { name: "Start time" });
      // The box keeps a drawn edge.
      await expect(getComputedStyle(field).borderTopStyle).toBe("solid");
      const chosen = within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "09" });
      await expect(getComputedStyle(chosen).backgroundColor).toBe(colour("Highlight"));
      await expect(getComputedStyle(chosen).color).toBe(colour("HighlightText"));
      const hour = within(canvasElement).getByRole("spinbutton", { name: "Hour" });
      hour.focus();
      await expect(getComputedStyle(hour).backgroundColor).toBe(colour("Highlight"));
      await expect(getComputedStyle(hour).color).toBe(colour("HighlightText"));
    } finally {
      await emulate("none");
    }
  },
};

export const PickerKeyboard: Story = {
  name: "Open the picker, move through a column choosing as you go, close with Escape",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="10:00" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Choose time" }));
    await screen.findByRole("dialog");
    await waitFor(() => expect(within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "10" })).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect(canvas.getByRole("spinbutton", { name: "Hour" })).toHaveValue("12");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Choose time" })).toHaveFocus();
  },
};

export const NoSegmentClipsItsText: Story = {
  name: "At every size no segment cuts its text off, including AM/PM and a longer label",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", alignItems: "flex-start" }} data-testid="all">
      {sizes.map((size) => (
        <TimePicker key={size} size={size} showSeconds aria-label={`t-${size}`} defaultValue="23:59:59" />
      ))}
      {sizes.map((size) => (
        <TimePicker key={`long-${size}`} size={size} aria-label={`long-${size}`} defaultValue="11:11" labels={{ am: "a.m.", pm: "p.m." }} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle();
    const segments = [...within(canvasElement).getByTestId("all").querySelectorAll<HTMLInputElement>('input[role="spinbutton"]')];
    await expect(segments.length).toBeGreaterThan(20);
    for (const segment of segments) {
      // Text wider than its box would make the input scroll sideways.
      await expect(segment.scrollWidth).toBeLessThanOrEqual(segment.clientWidth);
    }
  },
};

export const InsertedText: Story = {
  name: "Text inserted all at once (a phone's keyboard, autofill, a paste) fills the segments in order",
  render: () => <TimePicker aria-label="Start time" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("spinbutton", { name: "Hour" }).focus();
    // The browser's own text insertion, which fires `input` with the whole string and no key events.
    await send("Input.insertText", { text: "0415p" });
    await settle(50);
    await expect(canvas.getByRole("spinbutton", { name: "Hour" })).toHaveValue("04");
    await expect(canvas.getByRole("spinbutton", { name: "Minute" })).toHaveValue("15");
    await expect(canvas.getByRole("spinbutton", { name: "AM/PM" })).toHaveValue("PM");
    await expect(canvas.getByRole("spinbutton", { name: "AM/PM" })).toHaveFocus();
  },
};

export const TargetSizes: Story = {
  name: "Every button is at least 24 × 24 CSS pixels at every size (WCAG 2.5.8)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", alignItems: "flex-start" }} data-testid="all">
      {sizes.map((size) => (
        <TimePicker key={size} size={size} aria-label={`t-${size}`} defaultValue="09:30" onClear={() => {}} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const all = within(canvasElement).getByTestId("all");
    for (const element of all.querySelectorAll<HTMLElement>("button")) {
      const { width, height } = element.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(24);
      await expect(height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const PressingTheFieldFocusesASegment: Story = {
  name: "A press on the field's padding or a colon focuses the nearest segment",
  render: () => <TimePicker aria-label="Start time" defaultValue="09:30" data-testid="field" size="xl" />,
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByTestId("field");
    const box = field.getBoundingClientRect();
    const minute = within(field).getByRole("spinbutton", { name: "Minute" }).getBoundingClientRect();
    // The left padding, level with the segments: before the hour, so the hour.
    await userEvent.pointer({ keys: "[MouseLeft]", target: field, coords: { clientX: box.left + 3, clientY: box.top + box.height / 2 } });
    await expect(within(field).getByRole("spinbutton", { name: "Hour" })).toHaveFocus();
    // Just past the minute's left edge (the colon's gap and the minute's own box): the minute.
    await userEvent.pointer({ keys: "[MouseLeft]", target: field, coords: { clientX: minute.left + 2, clientY: box.top + 3 } });
    await expect(within(field).getByRole("spinbutton", { name: "Minute" })).toHaveFocus();
  },
};
