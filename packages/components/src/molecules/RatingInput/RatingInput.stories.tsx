import { CircleIcon, HeartIcon, SmileyIcon, ThumbsUpIcon } from "@dbm-design-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../CodeBlock/browserProtocol";
import { FormField } from "../FormField";
import { RatingInput } from "./RatingInput";
import { ratingInputPlaygroundSnippet, ratingInputSnippets } from "./RatingInput.snippets";

const valueNames = ["Poor", "Fair", "Good", "Great", "Excellent"];
// A rating's icon is chosen by name in the Playground; the control hands back the key, and `mapping` the component.
const iconChoices = { Heart: HeartIcon, Thumb: ThumbsUpIcon, Smiley: SmileyIcon, Circle: CircleIcon };

const meta: Meta<typeof RatingInput> = {
  title: "Molecules/Inputs/RatingInput",
  component: RatingInput,
  parameters: { layout: "padded" },
  // Content-ish props first (max, value), then the look, then behaviour and state, then the escape hatches last
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    max: {
      control: { type: "number", min: 1, max: 10 },
      description: "The number of icons.",
      table: { defaultValue: { summary: "5" } },
    },
    value: {
      control: false,
      description:
        "The controlled value: 0 for no rating, up to max. Pair with onValueChange. A read-only rating draws any value exactly.",
    },
    defaultValue: {
      control: { type: "number", min: 0, max: 10, step: 0.5 },
      description: "The initial value when uncontrolled.",
      table: { defaultValue: { summary: "0" } },
    },
    onValueChange: {
      control: false,
      description: "Called with the new value when a person chooses one: 0 when a rating is cleared.",
    },
    precision: {
      control: "select",
      options: [1, 0.5],
      description: "The smallest step: 1 for whole icons, 0.5 for halves (two choices for each icon).",
      table: { defaultValue: { summary: "1" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The icon's box, on the shared size scale. Every choice is a target of at least 24px.",
      table: { defaultValue: { summary: "md" } },
    },
    tone: {
      control: "select",
      options: ["highlight", "warning", "brand", "success", "info", "danger"],
      description: "The colour of the filled icons.",
      table: { defaultValue: { summary: "highlight" } },
    },
    icon: {
      control: "select",
      options: Object.keys(iconChoices),
      mapping: iconChoices,
      description:
        "The icon to draw, a Phosphor component reference (a heart, a thumb). Filled for the chosen part, an outline for the rest. A star by default.",
      table: { defaultValue: { summary: "A star" } },
    },
    readOnly: {
      control: "boolean",
      description:
        "Shows the value without letting it be changed, drawn exactly (4.3 fills a third of the fifth icon), as one image with a text alternative.",
      table: { defaultValue: { summary: "false" } },
    },
    clearable: {
      control: "boolean",
      description: "Lets a person take their rating back: pressing the chosen value again, or Backspace, Delete or Escape, sets it to 0.",
      table: { defaultValue: { summary: "false" } },
    },
    hasError: {
      control: "boolean",
      description: "Marks the rating as invalid, visually and with aria-invalid.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every choice.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Makes a rating required for form validation.",
      table: { defaultValue: { summary: "false" } },
    },
    valueNames: {
      control: false,
      description:
        'A name for each whole value, from 1 to max (`["Poor", "Fair", "Good", "Great", "Excellent"]`), added to that choice\'s accessible name and, with showValueName, written beside the icons.',
    },
    showValueName: {
      control: "boolean",
      description:
        "Writes the name of the value under the pointer, or of the chosen one, beside the icons. Needs valueNames. The space for the longest name is kept.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "The name the value is submitted under in a surrounding form, as a number.",
    },
    formatNumber: {
      control: false,
      description: "Turns a number into the text shown or announced, for a locale's own numerals. Used by the default labels.",
      table: { defaultValue: { summary: "String" } },
    },
    labels: {
      control: false,
      description:
        'Text this component writes itself, for translation: `{ itemLabel, valueText, notRated }`. Each function receives the plain numbers. Defaults: "3 out of 5", "Rated 4.3 out of 5", "Not rated".',
    },
    "aria-label": {
      control: "text",
      description: "The accessible name of the rating when there is no visible label.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of the element that names the rating.",
    },
    "aria-describedby": {
      control: false,
      description: "The id of the helper or error text that describes the rating.",
    },
    id: {
      control: false,
      description: "The id of the element that carries the role.",
    },
    className: {
      control: false,
      description: "Extra classes, on the outermost box.",
    },
    style: {
      control: false,
      description: "Inline styles, on the outermost box.",
    },
    "data-testid": {
      control: false,
      description: "A test identifier, on the element that carries the role.",
    },
  },
  // Every controllable prop has an explicit value here, matching its real default
  // (07-storybook-and-documentation-standards.md §5).
  args: {
    max: 5,
    defaultValue: 3,
    precision: 1,
    size: "md",
    tone: "highlight",
    readOnly: false,
    clearable: false,
    hasError: false,
    disabled: false,
    required: false,
    showValueName: false,
    valueNames,
    name: "",
    "aria-label": "Rating",
    onValueChange: fn(),
  },
  render: (args) => <RatingInput {...args} />,
};

export default meta;

type Story = StoryObj<typeof RatingInput>;

const builtSnippet = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => ratingInputPlaygroundSnippet(context.args),
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: builtSnippet } },
  // "Star" is the default, not a value to choose, so it is a Playground-only choice that leaves the prop out.
  argTypes: { icon: { control: "select", options: ["Star", ...Object.keys(iconChoices)], mapping: { Star: undefined, ...iconChoices } } },
  args: { icon: "Star" as never },
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: ratingInputSnippets.allSizes } } },
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <RatingInput key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "Tones",
  parameters: { docs: { source: { code: ratingInputSnippets.tones } } },
  argTypes: { tone: { control: false } },
  args: { defaultValue: 4 },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["highlight", "warning", "brand", "success", "info", "danger"] as const).map((tone) => (
        <RatingInput key={tone} {...args} tone={tone} aria-label={`Tone ${tone}`} />
      ))}
    </div>
  ),
};

export const HalfSteps: Story = {
  name: "Half steps",
  parameters: { docs: { source: { code: ratingInputSnippets.halfSteps } } },
  argTypes: { precision: { control: false } },
  args: { precision: 0.5, defaultValue: 3.5 },
};

export const ReadOnly: Story = {
  name: "Read-only average",
  parameters: { docs: { source: { code: ratingInputSnippets.readOnly } } },
  argTypes: { readOnly: { control: false }, defaultValue: { control: false } },
  args: { readOnly: true, defaultValue: undefined, "aria-label": "Average rating" },
  render: (args) => <RatingInput {...args} value={4.3} />,
};

export const ValueNames: Story = {
  name: "With the value named",
  parameters: { docs: { source: { code: ratingInputSnippets.valueNames } } },
  argTypes: { showValueName: { control: false }, valueNames: { control: false } },
  args: { showValueName: true, defaultValue: 0 },
};

export const Clearable: Story = {
  name: "Clearable",
  parameters: { docs: { source: { code: ratingInputSnippets.clearable } } },
  argTypes: { clearable: { control: false } },
  args: { clearable: true },
};

export const CustomIcon: Story = {
  name: "Another icon",
  parameters: { docs: { source: { code: ratingInputSnippets.customIcon } } },
  argTypes: { icon: { control: false }, tone: { control: false } },
  args: { tone: "danger" },
  render: (args) => <RatingInput {...args} icon={HeartIcon} />,
};

export const ErrorState: Story = {
  name: "Error state",
  parameters: { docs: { source: builtSnippet } },
  args: { hasError: true, defaultValue: 0 },
};

export const Disabled: Story = {
  parameters: { docs: { source: builtSnippet } },
  args: { disabled: true, defaultValue: 2 },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: ratingInputSnippets.inFormField } } },
  argTypes: Object.fromEntries(
    ["max", "defaultValue", "precision", "size", "tone", "icon", "readOnly", "clearable", "hasError", "disabled", "required", "showValueName", "name", "aria-label"].map((key) => [key, { control: false }]),
  ),
  render: () => (
    <FormField label="How was it?" helperText="Choose a rating from 1 to 5." required>
      {(fieldProps) => <RatingInput {...fieldProps} name="rating" />}
    </FormField>
  ),
};

export const Controlled: Story = {
  name: "Controlled",
  parameters: { docs: { source: { code: ratingInputSnippets.controlled } } },
  argTypes: { defaultValue: { control: false } },
  args: { defaultValue: undefined },
  render: function ControlledStory(args) {
    const [rating, setRating] = useState(2);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", alignItems: "flex-start" }}>
        <RatingInput {...args} value={rating} onValueChange={setRating} />
        <Button variant="tertiary" size="xs" onClick={() => setRating(0)}>
          Reset
        </Button>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------------------------------------------------
// Hidden stories: interaction and real-browser checks. They run as tests and appear in neither the sidebar nor the
// Docs page.
// ---------------------------------------------------------------------------------------------------------------------

const items = (canvasElement: HTMLElement) => Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-fill]"));
const fills = (canvasElement: HTMLElement) => items(canvasElement).map((item) => Number(item.dataset.fill));
const checkedValue = (canvasElement: HTMLElement) =>
  (Array.from(canvasElement.querySelectorAll<HTMLInputElement>("input[type=radio]")).find((radio) => radio.checked) ?? { value: "" }).value;

export const ChooseInteraction: Story = {
  name: "Pressing an icon chooses it, and the arrow keys move the choice — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 0, onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const radios = within(canvasElement).getAllByRole("radio");
    await userEvent.click(radios[3] as HTMLElement);
    await expect(checkedValue(canvasElement)).toBe("4");
    await expect(args.onValueChange).toHaveBeenCalledWith(4);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(checkedValue(canvasElement)).toBe("3");
    await expect(fills(canvasElement)).toEqual([1, 1, 1, 0, 0]);
  },
};

export const HoverPreviewCheck: Story = {
  name: "Hovering previews a rating without choosing it — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 1 },
  play: async ({ canvasElement }) => {
    const radios = within(canvasElement).getAllByRole("radio");
    await userEvent.hover(radios[3] as HTMLElement);
    await waitFor(() => expect(fills(canvasElement)).toEqual([1, 1, 1, 1, 0]));
    await expect(checkedValue(canvasElement)).toBe("1");
    await userEvent.unhover(radios[3] as HTMLElement);
    await waitFor(() => expect(fills(canvasElement)).toEqual([1, 0, 0, 0, 0]));
  },
};

export const HalfClickCheck: Story = {
  name: "The left half of an icon chooses the half, the right half the whole — interaction test",
  tags: ["!dev"],
  args: { precision: 0.5, defaultValue: 0 },
  play: async ({ canvasElement }) => {
    const third = items(canvasElement)[2] as HTMLElement;
    const box = third.getBoundingClientRect();
    // The element under each point is what a real press lands on, so the test presses that.
    const press = async (fraction: number) => {
      const clientX = box.left + box.width * fraction;
      const clientY = box.top + box.height / 2;
      await userEvent.pointer({ keys: "[MouseLeft]", target: document.elementFromPoint(clientX, clientY) as Element, coords: { clientX, clientY } });
    };
    await press(0.25);
    await waitFor(() => expect(checkedValue(canvasElement)).toBe("2.5"));
    await press(0.75);
    await waitFor(() => expect(checkedValue(canvasElement)).toBe("3"));
  },
};

export const TargetSizeCheck: Story = {
  name: "Every choice is a target of at least 24px at every size — interaction test",
  tags: ["!dev"],
  args: { precision: 0.5 },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <RatingInput key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const radio of canvasElement.querySelectorAll<HTMLInputElement>("input[type=radio]")) {
      const box = radio.getBoundingClientRect();
      // A half step is half an item wide, so the item itself must be 24px: the two halves together.
      await expect(box.height).toBeGreaterThanOrEqual(24);
    }
    for (const item of items(canvasElement)) {
      const box = item.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const FillClipCheck: Story = {
  name: "A read-only value fills exactly that part of the icon — interaction test",
  tags: ["!dev"],
  args: { readOnly: true, defaultValue: undefined },
  render: (args) => <RatingInput {...args} value={3.3} />,
  play: async ({ canvasElement }) => {
    const clip = (item: HTMLElement) => getComputedStyle(item.querySelector("[class*='filled']") as HTMLElement).clipPath;
    const [first, , , fourth, fifth] = items(canvasElement) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    // inset(0 <right> 0 0): none cut off, 70% cut off, everything cut off.
    await expect(clip(first)).toMatch(/inset\(0(px)?\s+0(px|%)?\s+0(px)?\s+0(px)?\)/);
    await expect(clip(fourth)).toContain("70%");
    await expect(clip(fifth)).toContain("100%");
  },
};

export const ValueNameStaysPutCheck: Story = {
  name: "Writing a value's name never moves the icons or resizes the rating — interaction test",
  tags: ["!dev"],
  args: { showValueName: true, defaultValue: 0 },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("[dir='ltr']") as HTMLElement;
    const group = within(canvasElement).getByRole("radiogroup");
    const radios = within(canvasElement).getAllByRole("radio");
    const before = { root: root.getBoundingClientRect().width, group: group.getBoundingClientRect().left };
    for (const radio of radios) {
      await userEvent.hover(radio);
      await waitFor(() => expect(canvasElement.querySelector("[data-active='true']")).not.toBeNull());
      await expect(root.getBoundingClientRect().width).toBe(before.root);
      await expect(group.getBoundingClientRect().left).toBe(before.group);
    }
  },
};

export const KeyboardRingCheck: Story = {
  name: "Tabbing in shows a focus ring around the icon — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 2 },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const focused = document.activeElement as HTMLElement;
    await expect(focused).toBe(within(canvasElement).getAllByRole("radio")[1]);
    const item = focused.closest("[data-fill]") as HTMLElement;
    await expect(getComputedStyle(item).outlineStyle).toBe("solid");
    await expect(parseFloat(getComputedStyle(item).outlineWidth)).toBeGreaterThan(0);
  },
};

export const ForcedColorsCheck: Story = {
  name: "The focus ring and the filled shape survive forced colours — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 2 },
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await userEvent.tab();
      const item = (document.activeElement as HTMLElement).closest("[data-fill]") as HTMLElement;
      await expect(getComputedStyle(item).outlineStyle).toBe("solid");
      // Filled and outline icons are told apart by their shape, since every colour becomes the same system colour.
      const [outline, filled] = Array.from(items(canvasElement)[0]!.querySelectorAll("svg")) as SVGElement[];
      await expect(outline!.innerHTML).not.toBe(filled!.innerHTML);
    } finally {
      await emulate("none");
    }
  },
};

export const LeftToRightCheck: Story = {
  name: "Stays left to right in a right-to-left page — interaction test",
  tags: ["!dev"],
  args: { defaultValue: 2 },
  render: (args) => (
    <div dir="rtl">
      <RatingInput {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [first, , , , last] = items(canvasElement) as HTMLElement[];
    await expect(first!.getBoundingClientRect().left).toBeLessThan(last!.getBoundingClientRect().left);
    await expect(fills(canvasElement)).toEqual([1, 1, 0, 0, 0]);
  },
};

export const NarrowContainerCheck: Story = {
  name: "A value name wraps below the icons in a narrow container — interaction test",
  tags: ["!dev"],
  args: { showValueName: true, defaultValue: 4 },
  render: (args) => (
    <div data-box="" style={{ inlineSize: "13rem" }}>
      <RatingInput {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector("[data-box]") as HTMLElement;
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const group = within(canvasElement).getByRole("radiogroup").getBoundingClientRect();
    const name = (canvasElement.querySelector("[class*='valueName']") as HTMLElement).getBoundingClientRect();
    await expect(name.top).toBeGreaterThanOrEqual(group.bottom - 1);
  },
};
