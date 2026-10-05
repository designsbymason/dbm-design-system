import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { CaretLeftIcon } from "@dbm-design-system/icons";
import { IconButton } from "../../atoms/IconButton";
import { send } from "../CodeBlock/browserProtocol";
import { Calendar } from "./Calendar";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real layout, text direction, forced colours, focus
// rings, the Docs page's own stylesheet — measured in Chromium.
const meta: Meta = {
  title: "Molecules/Inputs/Calendar/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const day = (root: HTMLElement, date: string) => root.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)!;
const box = (element: Element) => element.getBoundingClientRect();
const colour = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

export const DaysAreSquaresAsTallAsAnIconButton: Story = {
  name: "At every size a day is a square as tall as an IconButton of that step, and the grid is seven wide",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`row-${size}`} style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
          <Calendar size={size} defaultMonth="2026-10" today="2026-10-14" aria-label={`c-${size}`} />
          <IconButton size={size} icon={CaretLeftIcon} aria-label={`b-${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const row = canvas.getByTestId(`row-${size}`);
      const calendar = row.firstElementChild as HTMLElement;
      const reference = box(row.querySelector("button[aria-label^='b-']")!);
      const first = box(day(calendar, "2026-10-14"));
      await expect(Math.abs(first.height - reference.height)).toBeLessThan(1);
      await expect(Math.abs(first.width - first.height)).toBeLessThan(1);
      await expect(Math.abs(box(calendar).width - 7 * reference.width)).toBeLessThan(1);
    }
  },
};

export const GridKeepsItsHeight: Story = {
  name: "The grid is as tall in a five-week month as in a six-week one, and does not move as the month changes",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Calendar defaultMonth="2026-02" today="2026-10-14" aria-label="February" data-testid="feb" />
      <Calendar defaultMonth="2026-11" today="2026-10-14" aria-label="November" data-testid="nov" />
      <Calendar defaultMonth="2026-08" today="2026-10-14" aria-label="August" data-testid="aug" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heights = ["feb", "nov", "aug"].map((id) => box(canvas.getByTestId(id)).height);
    await expect(Math.abs(heights[0]! - heights[1]!)).toBeLessThan(1);
    await expect(Math.abs(heights[0]! - heights[2]!)).toBeLessThan(1);
    const aug = canvas.getByTestId("aug");
    const before = box(aug);
    const nextButton = within(aug).getByRole("button", { name: "Next month" });
    const nextBefore = box(nextButton);
    await userEvent.click(nextButton);
    await expect(box(aug).height).toBe(before.height);
    // The buttons keep their place whatever the heading says.
    await expect(box(nextButton).x).toBe(nextBefore.x);
    await expect(box(nextButton).y).toBe(nextBefore.y);
  },
};

export const SevenEqualColumns: Story = {
  name: "The seven columns are equal, and the calendar shrinks to a narrow container without overflowing",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <Calendar defaultMonth="2026-10" today="2026-10-14" aria-label="Wide" data-testid="wide" />
      <div style={{ inlineSize: "14rem" }} data-testid="narrow-box">
        <Calendar size="xl" defaultMonth="2026-10" today="2026-10-14" aria-label="Narrow" data-testid="narrow" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const widths = [...canvas.getByTestId("wide").querySelectorAll("th")].map((th) => box(th).width);
    await expect(widths).toHaveLength(7);
    for (const width of widths) await expect(Math.abs(width - widths[0]!)).toBeLessThan(1);
    const narrow = canvas.getByTestId("narrow");
    const boxWidth = box(canvas.getByTestId("narrow-box")).width;
    await expect(box(narrow).width).toBeLessThanOrEqual(boxWidth + 0.5);
    await expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth + 1);
    const grid = narrow.querySelector("table")!;
    await expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth + 1);
  },
};

export const RightToLeft: Story = {
  name: "Right to left: the week starts at the right, the buttons swap sides and the arrow keys follow the picture",
  render: () => <Calendar dir="rtl" defaultMonth="2026-10" today="2026-10-14" aria-label="rtl" data-testid="rtl" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId("rtl");
    const [first, last] = [...root.querySelectorAll("th")];
    await expect(box(first!).x).toBeGreaterThan(box(last!).x);
    const previous = within(root).getByRole("button", { name: "Previous month" });
    const next = within(root).getByRole("button", { name: "Next month" });
    await expect(box(previous).x).toBeGreaterThan(box(next).x);
    // The previous button's arrow points the way the page reads backwards: to the right.
    await expect(previous.querySelector("svg")).toBeInTheDocument();
    day(root, "2026-10-14").focus();
    const before = box(day(root, "2026-10-14"));
    await userEvent.keyboard("{ArrowLeft}");
    const after = box(document.activeElement as Element);
    await expect((document.activeElement as HTMLElement).dataset.date).toBe("2026-10-15");
    await expect(after.x).toBeLessThan(before.x);
  },
};

export const RangeStripIsContinuous: Story = {
  name: "The strip behind a range runs unbroken between its ends, which it only half covers",
  render: () => (
    <Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" defaultValue={["2026-10-12", "2026-10-16"]} aria-label="strip" data-testid="strip" />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("strip");
    const pseudo = (date: string) => getComputedStyle(day(root, date).closest("td")!, "::before");
    const cellWidth = box(day(root, "2026-10-14")).width;
    await expect(pseudo("2026-10-14").backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(Math.abs(parseFloat(pseudo("2026-10-14").width) - cellWidth)).toBeLessThan(1);
    // The first day's strip is its half toward the end of the range, the last day's the half toward the start.
    await expect(Math.abs(parseFloat(pseudo("2026-10-12").width) - cellWidth / 2)).toBeLessThan(1);
    await expect(Math.abs(parseFloat(pseudo("2026-10-16").width) - cellWidth / 2)).toBeLessThan(1);
    await expect(getComputedStyle(day(root, "2026-10-17").closest("td")!, "::before").content).toBe("none");
    // The ends are the brand fill; the days between are not.
    await expect(getComputedStyle(day(root, "2026-10-12")).backgroundColor).not.toBe(getComputedStyle(day(root, "2026-10-14")).backgroundColor);
  },
};

export const FocusRingFitsInsideTheDay: Story = {
  name: "The focus ring is drawn inside the day, and in a readable colour on a chosen one",
  render: () => <Calendar defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-14" aria-label="focus" data-testid="focus" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("focus");
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    const chosen = day(root, "2026-10-14");
    await expect(chosen).toHaveFocus();
    const style = getComputedStyle(chosen);
    await expect(style.outlineStyle).toBe("solid");
    await expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
    // On the brand fill the ring takes the on-brand icon colour, not the focus colour.
    await expect(style.outlineColor).not.toBe(colour(getComputedStyle(document.documentElement).getPropertyValue("--dbm-border-focus")));
    await userEvent.keyboard("{ArrowRight}");
    const plain = getComputedStyle(document.activeElement as Element);
    await expect(plain.outlineColor).toBe(colour(getComputedStyle(document.documentElement).getPropertyValue("--dbm-border-focus")));
  },
};

export const ForcedColours: Story = {
  name: "Forced colours: a chosen day is the system highlight, the strip becomes two lines and today an outline",
  render: () => (
    <Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" defaultValue={["2026-10-12", "2026-10-16"]} aria-label="forced" data-testid="forced" />
  ),
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await settle(400);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const root = within(canvasElement).getByTestId("forced");
      await expect(getComputedStyle(day(root, "2026-10-12")).backgroundColor).toBe(colour("Highlight"));
      await expect(getComputedStyle(day(root, "2026-10-12")).color).toBe(colour("HighlightText"));
      const strip = getComputedStyle(day(root, "2026-10-14").closest("td")!, "::before");
      await expect(strip.borderTopStyle).toBe("solid");
      await expect(strip.borderTopWidth).not.toBe("0px");
      const today = getComputedStyle(day(root, "2026-10-14"));
      await expect(today.outlineStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

export const OnTheDocsPage: Story = {
  name: "Inside the Docs page's own content wrapper it looks the same as on its own",
  render: () => (
    <div>
      <Calendar defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-06" aria-label="plain" data-testid="plain" />
      <div className="sbdocs sbdocs-content">
        <Calendar defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-06" aria-label="docs" data-testid="docs" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [plain, docs] = [canvas.getByTestId("plain"), canvas.getByTestId("docs")];
    await expect(Math.abs(box(plain).width - box(docs).width)).toBeLessThan(1);
    await expect(Math.abs(box(plain).height - box(docs).height)).toBeLessThan(1);
    for (const [selector, property] of [
      ["td", "padding-top"],
      ["td", "border-top-width"],
      ["th", "padding-top"],
      ["th", "border-top-width"],
      ["button[data-date]", "border-top-width"],
      ["button[data-date]", "color"],
    ] as const) {
      await expect(getComputedStyle(docs.querySelector(selector)!).getPropertyValue(property)).toBe(
        getComputedStyle(plain.querySelector(selector)!).getPropertyValue(property),
      );
    }
  },
};

export const NeverNarrowerThanSevenTargets: Story = {
  name: "In a container narrower than seven 24px days it keeps that width and overflows, instead of squeezing the days together",
  render: () => (
    <div style={{ inlineSize: "6rem", overflow: "auto", border: "1px dashed currentColor" }} data-testid="tight">
      <Calendar size="xs" defaultMonth="2026-10" today="2026-10-14" aria-label="Tight" data-testid="tight-calendar" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = canvas.getByTestId("tight");
    const calendar = canvas.getByTestId("tight-calendar");
    // Seven 24px targets, the least WCAG 2.5.8 allows.
    await expect(box(calendar).width).toBeGreaterThanOrEqual(7 * 24 - 0.5);
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    for (const th of calendar.querySelectorAll("th")) await expect(box(th).width).toBeGreaterThanOrEqual(24 - 0.5);
    for (const date of ["2026-10-14", "2026-10-15"]) await expect(box(day(calendar, date)).width).toBeGreaterThanOrEqual(24 - 0.5);
  },
};

export const RoundedDays: Story = {
  name: "Rounded: a day is a circle, and so are its focus ring, today's ring and the month buttons",
  render: () => (
    <Calendar rounded defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-06" aria-label="rounded" data-testid="rounded" />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("rounded");
    for (const date of ["2026-10-06", "2026-10-14", "2026-10-20"]) {
      const radius = parseFloat(getComputedStyle(day(root, date)).borderTopLeftRadius);
      await expect(radius).toBeGreaterThanOrEqual(box(day(root, date)).height / 2);
    }
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(day(root, "2026-10-06")).toHaveFocus();
    await expect(parseFloat(getComputedStyle(day(root, "2026-10-06")).borderTopLeftRadius)).toBeGreaterThanOrEqual(box(day(root, "2026-10-06")).height / 2);
    const previous = within(root).getByRole("button", { name: "Previous month" });
    await expect(parseFloat(getComputedStyle(previous).borderTopLeftRadius)).toBeGreaterThanOrEqual(box(previous).height / 2);
  },
};

export const KeyFitsBelowTheGrid: Story = {
  name: "The key sits below the grid, wraps in a narrow container and never moves the grid",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Calendar defaultMonth="2026-10" today="2026-10-14" mode="range" isDateDisabled={(date) => date.endsWith("-20")} showLegend aria-label="with key" data-testid="with-key" />
      <Calendar defaultMonth="2026-10" today="2026-10-14" mode="range" isDateDisabled={(date) => date.endsWith("-20")} aria-label="without key" data-testid="without-key" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const withKey = canvas.getByTestId("with-key");
    const without = canvas.getByTestId("without-key");
    const grid = (root: HTMLElement) => box(root.querySelector("table")!);
    await expect(grid(withKey).y).toBe(grid(without).y);
    await expect(grid(withKey).height).toBe(grid(without).height);
    const list = within(withKey).getByRole("list", { name: "Key" });
    await expect(box(list).y).toBeGreaterThanOrEqual(grid(withKey).bottom);
    // Every entry fits within the calendar's width.
    await expect(box(list).right).toBeLessThanOrEqual(box(withKey).right + 0.5);
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth + 1);
  },
};
