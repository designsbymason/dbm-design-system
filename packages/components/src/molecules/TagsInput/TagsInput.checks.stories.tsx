import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Input } from "../../atoms/Input";
import { send } from "../CodeBlock/browserProtocol";
import { TagsInput } from "./TagsInput";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real layout and measurement, focus, text
// direction, forms and the accessibility tree — measured in Chromium.
const meta: Meta = {
  title: "Molecules/Inputs/TagsInput/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const box = (element: Element) => element.getBoundingClientRect();

export const HeightAgainstInputAtEverySize: Story = {
  name: "At every size an empty field is within a few pixels of an Input, and the first tag does not move anything",
  render: function HeightStory() {
    const [tags, setTags] = useState<string[]>([]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", maxWidth: "24rem" }}>
        {sizes.map((size) => (
          <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
            <div data-testid={`input-${size}`}>
              <Input size={size} aria-label={`input-${size}`} />
            </div>
            <div data-testid={`tags-${size}`}>
              <TagsInput size={size} aria-label={`tags-${size}`} value={tags} onValueChange={setTags} />
            </div>
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const input = canvas.getByTestId(`input-${size}`);
      const field = canvas.getByTestId(`tags-${size}`).querySelector("[role=group]") as HTMLElement;
      const empty = box(field).height;
      // Close to an `Input` of the same size (the chip row is taller than `Input`'s line; the padding is the nearest token step).
      await expect(Math.abs(empty - box(input).height)).toBeLessThanOrEqual(5);
    }
    // The first tag changes no field's height (every field shares the same value in this story).
    const heights = sizes.map((size) => box(canvas.getByTestId(`tags-${size}`).querySelector("[role=group]") as HTMLElement).height);
    await userEvent.click(canvas.getByRole("textbox", { name: "tags-md" }));
    await userEvent.keyboard("first{Enter}");
    const after = sizes.map((size) => box(canvas.getByTestId(`tags-${size}`).querySelector("[role=group]") as HTMLElement).height);
    for (const [index, height] of heights.entries()) await expect(Math.abs((after[index] as number) - height)).toBeLessThan(1);
  },
};

export const WrapsInsideANarrowColumn: Story = {
  name: "A long row of chips wraps, the entry keeps its minimum width and nothing overflows",
  render: () => (
    <div data-testid="frame" style={{ width: "16rem" }}>
      <TagsInput
        aria-label="Labels"
        defaultValue={["design", "engineering", "accessibility", "urgent", "a-rather-long-tag-name-indeed", "review", "qa"]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    const entry = canvas.getByRole("textbox");
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;font-size:inherit";
    entry.parentElement?.appendChild(probe);
    const eightCharacters = (() => {
      probe.style.width = "8ch";
      return probe.getBoundingClientRect().width;
    })();
    probe.remove();
    await expect(box(entry).width).toBeGreaterThanOrEqual(eightCharacters - 1);
    // More than one row of chips, so the box grew.
    await expect(box(canvas.getByRole("group")).height).toBeGreaterThan(70);
  },
};

export const TextArrivingAllAtOnce: Story = {
  name: "Text inserted in one go, and a pasted list, are kept whole",
  render: () => <TagsInput aria-label="Labels" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const entry = canvas.getByRole("textbox") as HTMLInputElement;
    await userEvent.click(entry);
    await send("Input.insertText", { text: "alpha beta" });
    await expect(entry.value).toBe("alpha beta");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("alpha beta")).toBeInTheDocument();
    await send("Input.insertText", { text: "one,two,three" });
    await waitFor(() => expect(canvas.getByText("two")).toBeInTheDocument());
    await expect(entry.value).toBe("three");
  },
};

export const FocusAfterRemoving: Story = {
  name: "Pressing a chip's button puts focus in the entry; Delete on a chip keeps the place along the row",
  render: () => <TagsInput aria-label="Labels" defaultValue={["one", "two", "three"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Remove one" }));
    await expect(canvas.queryByText("one")).toBeNull();
    await expect(document.activeElement).toBe(canvas.getByRole("textbox"));
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await expect(canvas.getByRole("button", { name: "Remove two" })).toHaveFocus();
    await userEvent.keyboard("{Delete}");
    await expect(canvas.queryByText("two")).toBeNull();
    await expect(document.activeElement).toBe(canvas.getByRole("button", { name: "Remove three" }));
  },
};

export const TabOrder: Story = {
  name: "The field is one tab stop for its chips and entry, then clear-all, and back",
  render: () => <TagsInput aria-label="Labels" clearable defaultValue={["one", "two"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("textbox")).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Clear all" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole("textbox")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvas.getByRole("button", { name: "Remove two" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvas.getByRole("button", { name: "Remove one" })).toHaveFocus();
    // Tab from a chip leaves the field's chips for the entry, then onward.
    await userEvent.tab();
    await expect(canvas.getByRole("textbox")).toHaveFocus();
  },
};

export const ListSemantics: Story = {
  name: "The chips are a list of exactly as many items as there are tags, with the entry outside the count",
  render: () => <TagsInput aria-label="Labels" defaultValue={["one", "two", "three"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(canvas.getAllByRole("list")).toHaveLength(1);
    await expect(canvas.getByRole("group", { name: "Labels" })).toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: "Labels" })).toBeInTheDocument();
  },
};

export const TargetSizes: Story = {
  name: "Every chip's remove button and the clear-all button are at least 24 × 24 pixels at every size",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", maxWidth: "24rem" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`row-${size}`}>
          <TagsInput size={size} clearable aria-label={`Labels ${size}`} defaultValue={["a"]} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const row = within(canvas.getByTestId(`row-${size}`));
      // The clear-all button is its own box; a chip's remove button keeps a small glyph with a larger hit area, so
      // it is measured by pressing points 11px either side of its centre (`getBoundingClientRect` can't see it).
      const clear = row.getByRole("button", { name: "Clear all" });
      await expect(box(clear).width).toBeGreaterThanOrEqual(24);
      await expect(box(clear).height).toBeGreaterThanOrEqual(24);
      const remove = row.getByRole("button", { name: "Remove a" });
      const rect = box(remove);
      const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      for (const [dx, dy] of [[-11, 0], [11, 0], [0, -11], [0, 11]] as const) {
        const hit = document.elementFromPoint(centre.x + dx, centre.y + dy);
        await expect(hit === remove || remove.contains(hit)).toBe(true);
      }
    }
  },
};

export const RightToLeft: Story = {
  name: "In a right-to-left page the chips start at the right and the entry follows the last of them",
  render: () => (
    <div dir="rtl" style={{ width: "20rem" }}>
      <TagsInput aria-label="Labels" defaultValue={["واحد", "اثنان"]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chips = canvas.getAllByRole("listitem");
    const entry = canvas.getByRole("textbox");
    await expect(box(chips[0] as HTMLElement).left).toBeGreaterThan(box(chips[1] as HTMLElement).left);
    await expect(box(entry).right).toBeLessThanOrEqual(box(chips[1] as HTMLElement).left + 1);
    // Toward the chips is the right arrow here.
    await userEvent.click(entry);
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Remove اثنان" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Remove واحد" })).toHaveFocus();
  },
};

export const FormSubmission: Story = {
  name: "A form submits each tag as its own value, and not the pending text",
  render: () => (
    <form data-testid="form">
      <TagsInput aria-label="Labels" name="labels" defaultValue={["one", "two"]} />
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    await userEvent.click(canvas.getByRole("textbox"));
    await userEvent.keyboard("pending");
    const data = new FormData(form);
    await expect([...data.keys()]).toEqual(["labels", "labels"]);
    await expect(data.getAll("labels")).toEqual(["one", "two"]);
  },
};

export const RequiredStopsTheForm: Story = {
  name: "A required field with no tags stops the surrounding form submitting",
  render: () => (
    <form data-testid="form">
      <TagsInput aria-label="Labels" name="labels" required />
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    let submitted = false;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = true;
    });
    await expect(form.checkValidity()).toBe(false);
    form.requestSubmit();
    await expect(submitted).toBe(false);
    await userEvent.click(canvas.getByRole("textbox"));
    await userEvent.keyboard("one{Enter}");
    await expect(form.checkValidity()).toBe(true);
  },
};

export const OnAPhone: Story = {
  name: "On a phone the field, its chips and the clear button fit the width",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div data-testid="frame" style={{ width: "100%" }}>
      <TagsInput aria-label="Labels" clearable defaultValue={["design", "engineering", "accessibility", "urgent", "review"]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(640);
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

export const EnterInAnEmptyEntrySubmits: Story = {
  name: "Enter in an empty entry submits the surrounding form, and with text pending only adds a tag",
  render: () => (
    <form data-testid="form">
      <TagsInput aria-label="Labels" name="labels" />
      <button type="submit">Go</button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    let submits = 0;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submits += 1;
    });
    await userEvent.click(canvas.getByRole("textbox"));
    await userEvent.keyboard("one{Enter}");
    await expect(submits).toBe(0);
    await userEvent.keyboard("{Enter}");
    await expect(submits).toBe(1);
  },
};

export const PendingTextIsInTheFormWhenSubmitIsPressed: Story = {
  name: "Pressing a form's submit button with text typed makes it a tag first, so the form has it",
  render: () => (
    <form data-testid="form">
      <TagsInput aria-label="Labels" name="labels" defaultValue={["one"]} />
      <button type="submit">Go</button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    let submitted: string[] = [];
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = new FormData(form).getAll("labels").map(String);
    });
    await userEvent.click(canvas.getByRole("textbox"));
    await userEvent.keyboard("two");
    await userEvent.click(canvas.getByRole("button", { name: "Go" }));
    await expect(submitted).toEqual(["one", "two"]);
  },
};

export const CollapsedRowStaysOneLine: Story = {
  name: "A collapsed row is one line with a +N more button, and shows everything while the entry has focus",
  render: () => (
    <div data-testid="frame" style={{ width: "20rem" }}>
      <TagsInput
        aria-label="Labels"
        maxVisible={2}
        defaultValue={["design", "engineering", "accessibility", "urgent", "review", "qa", "launch"]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");
    const group = canvas.getByRole("group");
    const more = canvas.getByRole("button", { name: "+5 more" });
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
    const collapsed = box(group).height;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    await expect(box(more).height).toBeGreaterThanOrEqual(24);
    // One line: the typing area sits on the chips' row, not on a row of its own beneath them.
    const firstChip = canvas.getAllByRole("listitem")[0] as HTMLElement;
    await expect(box(canvas.getByRole("textbox")).top).toBeLessThan(box(firstChip).bottom);
    await expect(Math.abs(box(group).height - (box(firstChip).height + 2 * 4 + 2))).toBeLessThan(6);
    await userEvent.click(canvas.getByRole("textbox"));
    await expect(canvas.getAllByRole("listitem")).toHaveLength(7);
    await expect(box(group).height).toBeGreaterThanOrEqual(collapsed);
  },
};

export const FlaggedChipsAreDrawnAsInvalid: Story = {
  name: "A flagged tag is drawn in the danger tone and the field's border follows",
  render: () => (
    <TagsInput
      aria-label="Emails"
      invalidBehavior="flag"
      validate={(tag) => (tag.includes("@") ? undefined : "Not an email address")}
      defaultValue={["a@b.co", "nope"]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group");
    const [good, bad] = canvas.getAllByRole("listitem").map((item) => item.querySelector("span") as HTMLElement);
    await expect(getComputedStyle(bad as HTMLElement).color).not.toBe(getComputedStyle(good as HTMLElement).color);
    await expect(getComputedStyle(group).borderTopColor).not.toBe("");
    await expect(canvas.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  },
};
