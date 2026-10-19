import { MagnifyingGlassIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Icon } from "../Icon";
import { Combobox } from "../../organisms/Combobox";
import { PasswordInput } from "../../molecules/PasswordInput";
import { SearchInput } from "../../molecules/SearchInput";
import { DatePicker } from "../../organisms/DatePicker";
import { EditableText } from "../../molecules/EditableText";
import { Select } from "../../molecules/Select";
import { TagsInput } from "../../molecules/TagsInput";
import { TimePicker } from "../../molecules/TimePicker";
import { Textarea } from "../Textarea";
import { Input } from "./Input";
import type { InputSize } from "./Input.types";

// The checks only a real browser can make, run as stories but hidden from the sidebar and the Docs page (`!dev`): the icons in an input
// are the input's own step, and a larger icon (and the clear button's hit area round it) never makes the field taller.
const meta: Meta = {
  title: "Atoms/Inputs/Input/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const sizes = ["xs", "sm", "md", "lg", "xl"] as const satisfies readonly InputSize[];
const token = (name: string) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) * (getComputedStyle(document.documentElement).getPropertyValue(name).trim().endsWith("rem") ? parseFloat(getComputedStyle(document.documentElement).fontSize) : 1);

export const IconsAreTheInputsStep: Story = {
  name: "The prefix, suffix and clear icons are the input's own step, and the field is no taller for them",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-4)", maxInlineSize: "24rem" }}>
      {sizes.map((size) => (
        <div key={size} data-size={size} style={{ display: "grid", gap: "var(--dbm-space-2)" }}>
          <Input size={size} aria-label={`${size} plain`} placeholder="plain" />
          <Input
            size={size}
            aria-label={`${size} icons`}
            prefix={<Icon icon={MagnifyingGlassIcon} />}
            suffix={<Icon icon={MagnifyingGlassIcon} />}
            value="text"
            onChange={() => {}}
            onClear={() => {}}
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const size of sizes) {
      const group = canvasElement.querySelector(`[data-size="${size}"]`)!;
      const [plain, withIcons] = Array.from(group.children).map((child) => child.querySelector("input")!.parentElement!) as HTMLElement[];
      const expected = token(`--dbm-icon-size-${size}`);
      const svgs = Array.from(withIcons!.querySelectorAll("svg"));
      expect(svgs).toHaveLength(3);
      for (const svg of svgs) expect(svg.getBoundingClientRect().width).toBeCloseTo(expected, 0);
      // the field is as tall as one with no icons, and the clear button sits inside it, off the border
      expect(withIcons!.getBoundingClientRect().height).toBeCloseTo(plain!.getBoundingClientRect().height, 0);
      const box = withIcons!.getBoundingClientRect();
      const clear = withIcons!.querySelector("button")!.getBoundingClientRect();
      expect(clear.top).toBeGreaterThan(box.top);
      expect(clear.bottom).toBeLessThan(box.bottom);
    }
  },
};

const fields = {
  search: (size: InputSize) => <SearchInput size={size} aria-label={`${size} search`} />,
  password: (size: InputSize) => <PasswordInput size={size} aria-label={`${size} password`} defaultValue="secret" />,
  combobox: (size: InputSize) => (
    <Combobox size={size} aria-label={`${size} combobox`} options={[{ value: "a", label: "A" }]} defaultValue="a" />
  ),
} as const;

export const FieldsBuiltOnInputUseTheSameSteps: Story = {
  name: "Search, password and combobox fields draw their icons at the input's step, in a field no taller than a plain one",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-2)", maxInlineSize: "24rem" }}>
      {sizes.map((size) => (
        <div key={size} data-size={size} style={{ display: "grid", gap: "var(--dbm-space-2)" }}>
          <Input size={size} aria-label={`${size} plain`} placeholder="plain" />
          {Object.entries(fields).map(([name, render]) => (
            <div key={name} data-field={name}>
              {render(size)}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const size of sizes) {
      const group = canvasElement.querySelector(`[data-size="${size}"]`)!;
      const plain = group.querySelector("input")!.parentElement!.getBoundingClientRect().height;
      const expected = token(`--dbm-icon-size-${size}`);
      for (const name of Object.keys(fields)) {
        const field = group.querySelector(`[data-field="${name}"]`)!;
        const wrapper = field.querySelector("input")!.parentElement!;
        const svgs = Array.from(wrapper.querySelectorAll("svg"));
        expect(svgs.length, `${size} ${name}`).toBeGreaterThan(0);
        for (const svg of svgs) expect(svg.getBoundingClientRect().width, `${size} ${name}`).toBeCloseTo(expected, 0);
        expect(wrapper.getBoundingClientRect().height, `${size} ${name} height`).toBeCloseTo(plain, 0);
        for (const button of Array.from(wrapper.querySelectorAll("button"))) {
          const box = wrapper.getBoundingClientRect();
          const rect = button.getBoundingClientRect();
          expect(rect.top, `${size} ${name} button`).toBeGreaterThan(box.top);
          expect(rect.bottom, `${size} ${name} button`).toBeLessThan(box.bottom);
        }
      }
    }
  },
};

// Each field with the icons it draws itself, found in the DOM, and what stays true of the field when they are the input's own step.
const family = {
  textarea: {
    render: (size: InputSize) => <Textarea size={size} aria-label={`${size} textarea`} defaultValue="text" onClear={() => {}} />,
    icons: (field: Element) => Array.from(field.querySelectorAll('button[aria-label="Clear"] svg')),
  },
  select: {
    render: (size: InputSize) => (
      <Select size={size} aria-label={`${size} select`} defaultValue="a">
        <Select.Option value="a">A</Select.Option>
      </Select>
    ),
    icons: (field: Element) => Array.from(field.querySelectorAll("button svg")),
  },
  "clearable select": {
    render: (size: InputSize) => (
      <Select size={size} aria-label={`${size} clearable select`} defaultValue="a" onClear={() => {}}>
        <Select.Option value="a">A</Select.Option>
      </Select>
    ),
    icons: (field: Element) => Array.from(field.querySelectorAll("button svg")),
  },
  datepicker: {
    render: (size: InputSize) => <DatePicker size={size} aria-label={`${size} date`} defaultValue="2026-10-19" clearable />,
    icons: (field: Element) => Array.from(field.querySelectorAll("button svg")),
  },
  timepicker: {
    render: (size: InputSize) => <TimePicker size={size} aria-label={`${size} time`} defaultValue="10:30" clearable />,
    icons: (field: Element) => Array.from(field.querySelectorAll("button svg")),
  },
  tagsinput: {
    render: (size: InputSize) => <TagsInput size={size} aria-label={`${size} tags`} defaultValue={["one"]} clearable />,
    icons: (field: Element) => Array.from(field.querySelectorAll('button[aria-label="Clear all"] svg')),
  },
  editabletext: {
    render: (size: InputSize) => <EditableText size={size} aria-label={`${size} editable`} defaultValue="text" />,
    icons: (field: Element) => Array.from(field.querySelectorAll("svg")),
  },
} as const;

export const OtherFieldsUseTheSameSteps: Story = {
  name: "Textarea, select, date, time, tags and editable text draw their own icons at the input's step",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-2)", maxInlineSize: "28rem" }}>
      {sizes.map((size) => (
        <div key={size} data-size={size} style={{ display: "grid", gap: "var(--dbm-space-2)" }}>
          <Input size={size} aria-label={`${size} plain`} placeholder="plain" />
          {Object.entries(family).map(([name, entry]) => (
            <div key={name} data-field={name}>
              {entry.render(size)}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const size of sizes) {
      const group = canvasElement.querySelector(`[data-size="${size}"]`)!;
      const plain = group.querySelector("input")!.parentElement!.getBoundingClientRect().height;
      const expected = token(`--dbm-icon-size-${size}`);
      for (const [name, entry] of Object.entries(family)) {
        const field = group.querySelector(`[data-field="${name}"]`)!;
        const svgs = entry.icons(field);
        expect(svgs.length, `${size} ${name}`).toBeGreaterThan(0);
        for (const svg of svgs) expect(svg.getBoundingClientRect().width, `${size} ${name}`).toBeCloseTo(expected, 0);
        if (name === "textarea") {
          // the text stops short of the clear button
          const textarea = field.querySelector("textarea")!;
          const button = field.querySelector("button")!.getBoundingClientRect();
          const box = textarea.getBoundingClientRect();
          const style = getComputedStyle(textarea);
          const textEdge = box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
          expect(textEdge, `${size} textarea`).toBeLessThanOrEqual(button.left + 1);
          continue;
        }
        const wrapper = field.firstElementChild!.getBoundingClientRect();
        if (name !== "tagsinput" && name !== "editabletext") expect(wrapper.height, `${size} ${name} height`).toBeCloseTo(plain, 0);
        // a button in the field sits inside its box
        for (const button of Array.from(field.querySelectorAll("button"))) {
          const rect = button.getBoundingClientRect();
          expect(rect.top, `${size} ${name} button`).toBeGreaterThanOrEqual(wrapper.top);
          expect(rect.bottom, `${size} ${name} button`).toBeLessThanOrEqual(wrapper.bottom);
        }
      }
    }
  },
};
