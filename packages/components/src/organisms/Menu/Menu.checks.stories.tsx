import type { Meta, StoryObj } from "@storybook/react-vite";
import { DotsThreeIcon } from "@dbm-design-system/icons";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Toolbar } from "../../molecules/Toolbar";
import { Dialog } from "../Dialog";
import { Menu } from "./Menu";
import type { MenuSize } from "./Menu.types";
import { countries } from "./MenuStoryKit";

// Real-browser checks for what jsdom can't evaluate: layout, the stacking above a dialog, a real pointer, the
// breakpoint, computed style from the cascade and forced colours. Hidden from the sidebar and the Docs page, and
// still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Navigation/Menu/Checks",
  tags: ["!dev"],
  // A modal menu hides the page behind it from assistive technology while its trigger stays focusable but unreachable
  // (focus is trapped in the panel and Tab does nothing), which axe's `aria-hidden-focus` reports for every story that
  // holds one open. The same markup is axe-checked open, with every kind of part, in the unit tests.
  parameters: { layout: "fullscreen", a11y: { test: "todo" } },
};

export default meta;

type Story = StoryObj;

const body = within(document.body);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance (the panel scales from
// 0.96), so wait for every animation on the panel to finish first.
const settled = async (element: HTMLElement) => {
  await nextFrame();
  await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const openMenu = async () => {
  const menu = await body.findByRole("menu");
  await settled(menu);
  return menu;
};

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events. The test page
// scales its iframe, so a point inside the story is mapped to the page it is drawn on.
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

const trigger = (name: string) => body.getByRole("button", { name, hidden: true });
const textLeft = (element: Element) => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect().left;
};

const Page = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>{children}</div>
);

export const RealPointerInsideADialog: Story = {
  name: "An item chosen with a real mouse in a menu opened from inside a Dialog",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Settings">
        <Dialog.Body>
          <Menu>
            <Menu.Trigger asChild>
              <Button variant="secondary">Theme</Button>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item>Light</Menu.Item>
              <Menu.Item>Dark</Menu.Item>
            </Menu.Content>
          </Menu>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await body.findByRole("dialog", { name: "Settings" });
    await realClick(trigger("Theme"));
    const menu = await openMenu();
    const item = within(menu).getByRole("menuitem", { name: "Dark" });
    const { left, top } = item.getBoundingClientRect();
    // the list is above the dialog's scrim and panel, and takes the pointer
    await expect(document.elementFromPoint(left + 8, top + 8)?.closest('[role="menuitem"]')).toBe(item);
    await realClick(item);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    // choosing did not close the dialog
    await expect(body.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  },
};

const sizeCheck = (size: MenuSize): Story => ({
  name: `Every item at size ${size} is at least 24px tall and nothing overflows`,
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content size={size}>
          <Menu.Item>Edit</Menu.Item>
          <Menu.CheckboxItem checked>Show grid</Menu.CheckboxItem>
          <Menu.RadioGroup value="a" aria-label="Sort by">
            <Menu.RadioItem value="a">Name</Menu.RadioItem>
          </Menu.RadioGroup>
          <Menu.Sub>
            <Menu.SubTrigger>More</Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Item>Inside</Menu.Item>
            </Menu.SubContent>
          </Menu.Sub>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const items = [
      ...within(menu).getAllByRole("menuitem"),
      ...within(menu).getAllByRole("menuitemcheckbox"),
      ...within(menu).getAllByRole("menuitemradio"),
    ];
    await expect(items).toHaveLength(4);
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      await expect(rect.height).toBeGreaterThanOrEqual(24);
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
    }
    await expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth);
  },
});

export const TargetSizeXs: Story = sizeCheck("xs");
export const TargetSizeSm: Story = sizeCheck("sm");
export const TargetSizeMd: Story = sizeCheck("md");
export const TargetSizeLg: Story = sizeCheck("lg");
export const TargetSizeXl: Story = sizeCheck("xl");

export const LongMenuScrollsInsideItsPanel: Story = {
  name: "A long menu is capped to the viewport, scrolls, and keeps the focused item in view",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Country</Button>
        </Menu.Trigger>
        <Menu.Content size="xl">
          {countries.map((country) => (
            <Menu.Item key={country}>{country}</Menu.Item>
          ))}
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const rect = menu.getBoundingClientRect();
    await expect(rect.top).toBeGreaterThanOrEqual(0);
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight);
    menu.focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{End}");
    const last = within(menu).getByRole("menuitem", { name: countries[countries.length - 1] as string });
    await waitFor(() => expect(last).toHaveFocus());
    const panel = menu.getBoundingClientRect();
    const target = last.getBoundingClientRect();
    await expect(target.top).toBeGreaterThanOrEqual(panel.top - 1);
    await expect(target.bottom).toBeLessThanOrEqual(panel.bottom + 1);
  },
};

export const FlipsAboveATriggerAtTheBottom: Story = {
  name: "A menu opened near the bottom edge flips above its trigger and stays on screen",
  render: () => (
    <div style={{ blockSize: "100vh", position: "relative" }}>
      <div style={{ insetBlockEnd: "var(--dbm-space-2)", insetInlineStart: "var(--dbm-space-4)", position: "absolute" }}>
        <Menu defaultOpen>
          <Menu.Trigger asChild>
            <Button variant="secondary">Actions</Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item>Duplicate</Menu.Item>
            <Menu.Item>Archive</Menu.Item>
          </Menu.Content>
        </Menu>
      </div>
    </div>
  ),
  play: async () => {
    const menu = await openMenu();
    await expect(menu).toHaveAttribute("data-side", "top");
    const rect = menu.getBoundingClientRect();
    await expect(rect.bottom).toBeLessThanOrEqual(trigger("Actions").getBoundingClientRect().top);
    await expect(rect.top).toBeGreaterThanOrEqual(0);
  },
};

export const WidthStaysBetweenItsCaps: Story = {
  name: "The panel is at least the minimum width, and a very long label wraps inside the maximum",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Go</Menu.Item>
          <Menu.Item>
            This is a very long label that goes on and on well past any reasonable measure for a list of actions in a
            menu, so it has to wrap
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const rect = menu.getBoundingClientRect();
    await expect(rect.width).toBeLessThanOrEqual(24 * rem + 2);
    await expect(rect.width).toBeGreaterThanOrEqual(12 * rem - 2);
    const long = within(menu).getAllByRole("menuitem")[1] as HTMLElement;
    const short = within(menu).getAllByRole("menuitem")[0] as HTMLElement;
    await expect(long.getBoundingClientRect().height).toBeGreaterThan(short.getBoundingClientRect().height * 1.5);
    await expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth);
  },
};

export const IndicatorColumnAlignsEveryLabel: Story = {
  name: "Check and radio indicators sit in a column that every label lines up with",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">View</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Group>
            <Menu.Label>Panels</Menu.Label>
            <Menu.Item>Plain item</Menu.Item>
          </Menu.Group>
          <Menu.CheckboxItem checked>Checked item</Menu.CheckboxItem>
          <Menu.CheckboxItem>Unchecked item</Menu.CheckboxItem>
          <Menu.RadioGroup value="a" aria-label="Mode">
            <Menu.RadioItem value="a">Radio item</Menu.RadioItem>
          </Menu.RadioGroup>
          <Menu.Sub>
            <Menu.SubTrigger>Sub trigger</Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Item>Inside</Menu.Item>
            </Menu.SubContent>
          </Menu.Sub>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const labels = [
      within(menu).getByText("Panels"),
      within(menu).getByText("Plain item"),
      within(menu).getByText("Checked item"),
      within(menu).getByText("Unchecked item"),
      within(menu).getByText("Radio item"),
      within(menu).getByText("Sub trigger"),
    ];
    const lefts = labels.map(textLeft);
    for (const left of lefts) await expect(Math.abs(left - (lefts[0] as number))).toBeLessThan(0.75);
    // the indicator of the checked item is drawn, and the unchecked one's column is empty
    const checked = within(menu).getByRole("menuitemcheckbox", { name: "Checked item" });
    await expect(checked.querySelector("svg")).not.toBeNull();
    const unchecked = within(menu).getByRole("menuitemcheckbox", { name: "Unchecked item" });
    await expect(unchecked.querySelector("svg")).toBeNull();
  },
};

export const HighlightFollowsTheKeyboard: Story = {
  name: "The focused item is highlighted in the brand-subtle fill, and a danger item in the danger-subtle one",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item tone="danger">Delete</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const resolved = (token: string) => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = `var(${token})`;
      document.body.appendChild(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    };
    menu.focus();
    await userEvent.keyboard("{ArrowDown}");
    const edit = within(menu).getByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(edit).toHaveAttribute("data-highlighted"));
    await expect(getComputedStyle(edit).backgroundColor).toBe(resolved("--dbm-bg-brand-subtle"));
    // and the keyboard is marked by a ring inside the item, in the focus colour
    await expect(edit.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(edit).outlineStyle).toBe("solid");
    await expect(getComputedStyle(edit).outlineWidth).toBe("2px");
    await expect(parseFloat(getComputedStyle(edit).outlineOffset)).toBe(-2);
    await userEvent.keyboard("{ArrowDown}");
    const remove = within(menu).getByRole("menuitem", { name: "Delete" });
    await waitFor(() => expect(remove).toHaveAttribute("data-highlighted"));
    await expect(getComputedStyle(remove).backgroundColor).toBe(resolved("--dbm-bg-danger-subtle"));
    await expect(getComputedStyle(remove).color).toBe(
      (() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--dbm-text-danger)";
        document.body.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      })(),
    );
  },
};

export const SeparatorIsDrawn: Story = {
  name: "A separator is a drawn line",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Separator />
          <Menu.Item>Delete</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const separator = within(menu).getByRole("separator");
    const style = getComputedStyle(separator);
    await expect(style.borderTopStyle).toBe("solid");
    await expect(style.borderTopWidth).toBe("1px");
    await expect(separator.getBoundingClientRect().width).toBeGreaterThan(50);
  },
};

export const ArrowUpOpensOnTheLastItem: Story = {
  name: "ArrowUp on the trigger opens the menu with focus on the last item, and Escape returns focus",
  render: () => (
    <Page>
      <Menu>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Duplicate</Menu.Item>
          <Menu.Item disabled>Archive</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const button = trigger("Actions");
    button.focus();
    await userEvent.keyboard("{ArrowUp}");
    const menu = await openMenu();
    // the last item that can have focus: the disabled one is skipped
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Duplicate" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
    await expect(button.matches(":focus-visible")).toBe(true);
  },
};

export const SubmenuOpensOnTheStartSideInRtl: Story = {
  name: "In right-to-left a submenu opens to the left, its caret is mirrored and ArrowLeft opens it",
  render: () => (
    <div dir="rtl" style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)", paddingInlineStart: "40vw" }}>
      <Menu defaultOpen dir="rtl">
        <Menu.Trigger asChild>
          <Button variant="secondary">פעולות</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>עריכה</Menu.Item>
          <Menu.Sub>
            <Menu.SubTrigger>שיתוף</Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Item>דוא״ל</Menu.Item>
            </Menu.SubContent>
          </Menu.Sub>
        </Menu.Content>
      </Menu>
    </div>
  ),
  play: async () => {
    const menu = await openMenu();
    const subTrigger = within(menu).getByRole("menuitem", { name: "שיתוף" });
    // the caret is drawn mirrored
    const caret = subTrigger.querySelector("svg") as SVGElement;
    await expect(new DOMMatrix(getComputedStyle(caret).transform).a).toBeLessThan(0);
    menu.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await waitFor(() => expect(subTrigger).toHaveFocus());
    await userEvent.keyboard("{ArrowLeft}");
    const sub = await within(document.body).findByRole("menuitem", { name: "דוא״ל" });
    const subPanel = sub.closest('[role="menu"]') as HTMLElement;
    await settled(subPanel);
    await expect(subPanel.getBoundingClientRect().right).toBeLessThanOrEqual(menu.getBoundingClientRect().left + 8);
  },
};

export const ForcedColoursDrawAnOutline: Story = {
  name: "In forced colours the highlighted item is drawn with an outline",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Separator />
          <Menu.CheckboxItem checked>Show grid</Menu.CheckboxItem>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      menu.focus();
      await userEvent.keyboard("{ArrowDown}");
      const edit = within(menu).getByRole("menuitem", { name: "Edit" });
      await waitFor(() => expect(edit).toHaveAttribute("data-highlighted"));
      const style = getComputedStyle(edit);
      await expect(style.outlineStyle).toBe("solid");
      await expect(style.outlineWidth).toBe("2px");
      // the separator is a border, which forced colours keeps
      await expect(getComputedStyle(within(menu).getByRole("separator")).borderTopStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

export const IconButtonWithATooltipOpensTheMenu: Story = {
  name: "An IconButton with a tooltip is a working trigger",
  render: () => (
    <Page>
      <Menu>
        <Menu.Trigger asChild>
          <IconButton icon={DotsThreeIcon} aria-label="Row actions" tooltip variant="ghost" />
        </Menu.Trigger>
        <Menu.Content align="end">
          <Menu.Item>Edit</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    await realClick(trigger("Row actions"));
    const menu = await openMenu();
    await expect(within(menu).getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(trigger("Row actions")).toHaveFocus());
  },
};

export const InsideAToolbar: Story = {
  name: "A menu trigger in a Toolbar opens, and focus returns to it",
  render: () => (
    <Page>
      <Toolbar aria-label="Document">
        <Toolbar.Button>Bold</Toolbar.Button>
        <Toolbar.Item>
          <Menu.Trigger asChild>
            <Button variant="secondary">More</Button>
          </Menu.Trigger>
        </Toolbar.Item>
      </Toolbar>
    </Page>
  ),
  // The trigger needs a `Menu` around it; it sits in the story's own wrapper below.
  decorators: [
    (Story) => (
      <Menu>
        <Story />
        <Menu.Content>
          <Menu.Item>Italic</Menu.Item>
        </Menu.Content>
      </Menu>
    ),
  ],
  play: async () => {
    const button = trigger("More");
    await realClick(button);
    const menu = await openMenu();
    await expect(within(menu).getByRole("menuitem", { name: "Italic" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
  },
};
