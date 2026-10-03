import { TextBIcon, TextItalicIcon } from "@dbm-design-system/icons";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import buttonStyles from "../../atoms/Button/Button.module.css";
import iconButtonStyles from "../../atoms/IconButton/IconButton.module.css";
import buttonGroupStyles from "../ButtonGroup/ButtonGroup.module.css";
import toggleStyles from "../ToggleGroup/ToggleGroup.module.css";
import { Tooltip } from "../../atoms/Tooltip";
import { Popover } from "../Popover";
import { Select } from "../Select";
import { ButtonGroup } from "../ButtonGroup";
import { Toolbar } from "./Toolbar";
import styles from "./Toolbar.module.css";

afterEach(() => {
  vi.restoreAllMocks();
});

const Bar = (props: Partial<React.ComponentProps<typeof Toolbar>>) => (
  <Toolbar aria-label="Formatting" {...props}>
    <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
    <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
    <Toolbar.Separator />
    <Toolbar.Button>Link</Toolbar.Button>
  </Toolbar>
);

describe("Toolbar", () => {
  it("is a named toolbar with the orientation stated", () => {
    render(<Bar />);
    const bar = screen.getByRole("toolbar", { name: "Formatting" });
    expect(bar).toHaveAttribute("aria-orientation", "horizontal");
    expect(bar).toHaveAttribute("data-orientation", "horizontal");
  });

  it("can be named by a visible label", () => {
    render(
      <>
        <span id="label">Formatting</span>
        <Toolbar aria-labelledby="label">
          <Toolbar.Button>Link</Toolbar.Button>
        </Toolbar>
      </>,
    );
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument();
  });

  it("warns once in development with no accessible name, for the toolbar and for a group", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <Toolbar>
        <Toolbar.Group>
          <Toolbar.Button>A</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar>,
    );
    rerender(
      <Toolbar>
        <Toolbar.Group>
          <Toolbar.Button>A</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar>,
    );
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Toolbar: no accessible name"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Toolbar.Group: no accessible name"));
    warn.mockClear();
    render(
      <Toolbar aria-label="Named">
        <Toolbar.Group aria-label="Group">
          <Toolbar.Button>A</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("forwards its ref and passes className, style, id and data-testid through", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Bar ref={ref} className="extra" style={{ color: "red" }} id="bar" data-testid="bar" />);
    const bar = screen.getByTestId("bar");
    expect(ref.current).toBe(bar);
    expect(bar).toHaveClass("extra");
    expect(bar).toHaveAttribute("id", "bar");
    expect(bar.style.color).toBe("red");
  });

  it("does not let props replace its role or orientation", () => {
    render(<Bar {...({ role: "group", "aria-orientation": "vertical" } as object)} />);
    const bar = screen.getByRole("toolbar");
    expect(bar).toHaveAttribute("aria-orientation", "horizontal");
  });

  describe("keyboard", () => {
    it("is one tab stop, and the arrow keys move between items", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <Bar />
          <button>after</button>
        </>,
      );
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{End}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
      // Tab leaves the toolbar rather than visiting each item
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("returns to the last focused item when tabbing back in", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <Bar />
        </>,
      );
      await user.tab();
      await user.tab();
      await user.keyboard("{ArrowRight}");
      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: "before" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
    });

    it("stops at the ends when loop is false", async () => {
      const user = userEvent.setup();
      render(<Bar loop={false} />);
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{End}{ArrowRight}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
    });

    it("moves with up and down in a vertical toolbar, not left and right", async () => {
      const user = userEvent.setup();
      render(<Bar orientation="vertical" />);
      expect(screen.getByRole("toolbar")).toHaveAttribute("aria-orientation", "vertical");
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
    });

    it("reverses left and right with dir='rtl'", async () => {
      const user = userEvent.setup();
      render(<Bar dir="rtl" />);
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
    });

    it("skips a disabled item", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Button disabled>Two</Toolbar.Button>
          <Toolbar.Button>Three</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
    });

    it("keeps the toolbar reachable when the item that held the tab stop becomes disabled or loading", async () => {
      const user = userEvent.setup();
      const bar = (disabled: boolean, isLoading: boolean) => (
        <>
          <button>before</button>
          <Toolbar aria-label="Bar">
            <Toolbar.Button disabled={disabled} isLoading={isLoading}>
              One
            </Toolbar.Button>
            <Toolbar.Button>Two</Toolbar.Button>
          </Toolbar>
        </>
      );
      const { rerender } = render(bar(false, false));
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "One" })).toHaveFocus();
      await user.tab({ shift: true });
      rerender(bar(true, false));
      await user.tab();
      expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
      await user.tab({ shift: true });
      rerender(bar(false, true));
      await user.tab();
      expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
    });

    it("leaves a plain Button out of arrow-key movement", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Button>Plain</Button>
          <Toolbar.Button>Three</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
    });
  });

  describe("settings", () => {
    it("gives items the ghost look at the md size by default", () => {
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>Link</Toolbar.Button>
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
        </Toolbar>,
      );
      expect(screen.getByRole("button", { name: "Link" })).toHaveClass(buttonStyles.variantGhost!, buttonStyles.sizeMd!);
      expect(screen.getByRole("button", { name: "Bold" })).toHaveClass(
        iconButtonStyles.variantGhost!,
        iconButtonStyles.sizeMd!,
      );
    });

    it("hands itemVariant, size and rounded to items, and lets an item's own props win", () => {
      render(
        <Toolbar aria-label="Bar" itemVariant="secondary" size="sm" rounded>
          <Toolbar.Button>Plain</Toolbar.Button>
          <Toolbar.Button variant="primary" size="lg">
            Own
          </Toolbar.Button>
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
        </Toolbar>,
      );
      const plain = screen.getByRole("button", { name: "Plain" });
      expect(plain).toHaveClass(buttonStyles.variantSecondary!, buttonStyles.sizeSm!, buttonStyles.rounded!);
      const own = screen.getByRole("button", { name: "Own" });
      expect(own).toHaveClass(buttonStyles.variantPrimary!, buttonStyles.sizeLg!);
      expect(screen.getByRole("button", { name: "Bold" })).toHaveClass(
        iconButtonStyles.variantSecondary!,
        iconButtonStyles.sizeSm!,
        iconButtonStyles.rounded!,
      );
    });

    it("draws the bar by variant", () => {
      const { rerender } = render(<Bar data-testid="bar" />);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.outlined!, styles.filled!);
      rerender(<Bar data-testid="bar" variant="outlined" />);
      expect(screen.getByTestId("bar")).toHaveClass(styles.outlined!);
      rerender(<Bar data-testid="bar" variant="filled" overflow="wrap" />);
      expect(screen.getByTestId("bar")).toHaveClass(styles.filled!, styles.wrap!);
    });

    it("is as wide as its items unless fullWidth is set", () => {
      const { rerender } = render(<Bar data-testid="bar" />);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.fullWidth!);
      rerender(<Bar data-testid="bar" fullWidth />);
      expect(screen.getByTestId("bar")).toHaveClass(styles.fullWidth!);
    });

    it("states where the items sit with align, start by default", () => {
      const { rerender } = render(<Bar data-testid="bar" />);
      expect(screen.getByTestId("bar")).toHaveAttribute("data-align", "start");
      rerender(<Bar data-testid="bar" fullWidth align="end" />);
      expect(screen.getByTestId("bar")).toHaveAttribute("data-align", "end");
    });

    it("disables every item with disabled, and an item stays disabled by itself", () => {
      render(
        <Toolbar aria-label="Bar" disabled>
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
          <Toolbar.Button disabled={false}>Two</Toolbar.Button>
        </Toolbar>,
      );
      for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    });

    it("keeps the settings of an outer ButtonGroup it sits in, and its disabled", () => {
      render(
        <ButtonGroup aria-label="Outer" disabled rounded>
          <Toolbar aria-label="Inner">
            <Toolbar.Button>One</Toolbar.Button>
          </Toolbar>
        </ButtonGroup>,
      );
      const one = screen.getByRole("button", { name: "One" });
      expect(one).toBeDisabled();
      expect(one).toHaveClass(buttonStyles.rounded!);
    });

    it("lets a ButtonGroup inside it keep the toolbar's settings", () => {
      render(
        <Toolbar aria-label="Bar" itemVariant="secondary" disabled>
          <ButtonGroup aria-label="Inner">
            <Button>One</Button>
          </ButtonGroup>
        </Toolbar>,
      );
      const one = screen.getByRole("button", { name: "One" });
      expect(one).toBeDisabled();
      expect(one).toHaveClass(buttonStyles.variantSecondary!);
    });
  });

  describe("parts", () => {
    it("runs an item's click handler, and not a disabled item's", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button onClick={onClick}>Go</Toolbar.Button>
          <Toolbar.Button disabled onClick={onClick}>
            Stop
          </Toolbar.Button>
        </Toolbar>,
      );
      await user.click(screen.getByRole("button", { name: "Go" }));
      await user.click(screen.getByRole("button", { name: "Stop" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("makes a toggle of an icon button with pressed, and reports the change", async () => {
      const user = userEvent.setup();
      const onPressedChange = vi.fn();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" defaultPressed onPressedChange={onPressedChange} />
        </Toolbar>,
      );
      const bold = screen.getByRole("button", { name: "Bold" });
      expect(bold).toHaveAttribute("aria-pressed", "true");
      await user.click(bold);
      expect(bold).toHaveAttribute("aria-pressed", "false");
      expect(onPressedChange).toHaveBeenCalledWith(false);
    });

    it("forwards refs from Toolbar.Button and Toolbar.IconButton", () => {
      const buttonRef = createRef<HTMLButtonElement>();
      const iconRef = createRef<HTMLButtonElement>();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button ref={buttonRef}>Go</Toolbar.Button>
          <Toolbar.IconButton ref={iconRef} icon={TextBIcon} aria-label="Bold" />
        </Toolbar>,
      );
      expect(buttonRef.current).toBe(screen.getByRole("button", { name: "Go" }));
      expect(iconRef.current).toBe(screen.getByRole("button", { name: "Bold" }));
    });

    it("puts any other single element in the arrow-key order with Toolbar.Item", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Item>
            <a href="/docs">Docs</a>
          </Toolbar.Item>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
    });

    it("takes a Toolbar.Item out of arrow-key order when it is disabled", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Item disabled>
            <button disabled>Two</button>
          </Toolbar.Item>
          <Toolbar.Button>Three</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
    });

    it("works inside a Tooltip trigger", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Tooltip content="Make it bold">
            <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
          </Tooltip>
          <Toolbar.Button>Next</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    });

    it("names a group and keeps its items in the arrow-key order", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Group aria-label="Style">
            <Toolbar.Button>One</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Group aria-label="Other">
            <Toolbar.Button>Two</Toolbar.Button>
          </Toolbar.Group>
        </Toolbar>,
      );
      expect(screen.getByRole("group", { name: "Style" })).toContainElement(screen.getByRole("button", { name: "One" }));
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
    });

    it("does not let props replace a group's role", () => {
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Group aria-label="Style" {...({ role: "region" } as object)}>
            <Toolbar.Button>One</Toolbar.Button>
          </Toolbar.Group>
        </Toolbar>,
      );
      expect(screen.getByRole("group", { name: "Style" })).toBeInTheDocument();
    });

    it("draws a separator across the bar's direction", () => {
      const { rerender } = render(<Bar />);
      expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
      expect(screen.getByRole("separator")).toHaveAttribute("data-orientation", "vertical");
      rerender(<Bar orientation="vertical" />);
      // horizontal is the ARIA default, so it is stated only by `data-orientation`
      expect(screen.getByRole("separator")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("hides a spacer from assistive tech", () => {
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Spacer data-testid="spacer" />
        </Toolbar>,
      );
      expect(screen.getByTestId("spacer")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("items that are not plain buttons", () => {
    it("takes a Select into the arrow-key order, opens it with Enter, and gives focus back when a choice is made", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Toolbar.Item>
            <Select aria-label="Font size" placeholder="Size">
              <Select.Option value="12">12</Select.Option>
              <Select.Option value="14">14</Select.Option>
            </Select>
          </Toolbar.Item>
          <Toolbar.Button>Last</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      const trigger = screen.getByRole("combobox", { name: "Font size" });
      expect(trigger).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      await user.keyboard("{ArrowDown}{Enter}");
      expect(trigger).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    });

    it("takes a popover trigger into the order, and returns to it when the popover closes", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Popover>
            <Toolbar.Item>
              <Popover.Trigger asChild>
                <Button variant="ghost">More</Button>
              </Popover.Trigger>
            </Toolbar.Item>
            <Popover.Content aria-label="More options">Extra options</Popover.Content>
          </Popover>
          <Toolbar.Button>Last</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "More" })).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(screen.getByText("Extra options")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.getByRole("button", { name: "More" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    });
  });

  describe("Toolbar.ToggleGroup", () => {
    const Align = (props: Partial<React.ComponentProps<typeof Toolbar.ToggleGroup>> = {}) => (
      <Toolbar.ToggleGroup aria-label="Alignment" defaultValue="left" {...(props as object)}>
        <Toolbar.ToggleItem value="left">Left</Toolbar.ToggleItem>
        <Toolbar.ToggleItem value="center">Centre</Toolbar.ToggleItem>
        <Toolbar.ToggleItem value="right">Right</Toolbar.ToggleItem>
      </Toolbar.ToggleGroup>
    );

    it("keeps the toolbar one tab stop, with the arrow keys running through the group's items", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Toolbar aria-label="Bar">
            <Toolbar.Button>Before</Toolbar.Button>
            <Align />
            <Toolbar.Button>After</Toolbar.Button>
          </Toolbar>
          <button>outside</button>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
      // a nested roving group would make its own container a second tab stop: Tab goes straight out of the bar
      await user.tab();
      expect(screen.getByRole("button", { name: "outside" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "Left" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "Centre" })).toHaveFocus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "outside" })).toHaveFocus();
    });

    it("is a radiogroup that chooses the item an arrow key lands on, but not one reached from outside", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>Before</Toolbar.Button>
          <Align />
        </Toolbar>,
      );
      expect(screen.getByRole("radiogroup", { name: "Alignment" })).toBeInTheDocument();
      await user.tab();
      await user.keyboard("{ArrowRight}");
      // arrived from the button before the group: nothing is chosen by arriving
      expect(screen.getByRole("radio", { name: "Left" })).toHaveAttribute("aria-checked", "true");
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "Centre" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: "Left" })).toHaveAttribute("aria-checked", "false");
    });

    it("reports a choice made by click, and a multiple group is a plain group of toggles", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.ToggleGroup aria-label="Style" type="multiple" onValueChange={onValueChange}>
            <Toolbar.ToggleItem value="b" icon={TextBIcon} aria-label="Bold" />
            <Toolbar.ToggleItem value="i" icon={TextItalicIcon} aria-label="Italic" />
          </Toolbar.ToggleGroup>
        </Toolbar>,
      );
      expect(screen.getAllByRole("toolbar")).toHaveLength(1);
      expect(screen.getByRole("group", { name: "Style" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Bold" }));
      expect(onValueChange).toHaveBeenCalledWith(["b"]);
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    });

    it("takes the bar's size, rounded, orientation and disabled unless it says otherwise", () => {
      render(
        <Toolbar aria-label="Bar" size="lg" rounded orientation="vertical">
          <Align data-testid="group" />
          <Align data-testid="own" size="xs" aria-label="Own" />
        </Toolbar>,
      );
      expect(screen.getByTestId("group")).toHaveAttribute("data-orientation", "vertical");
      expect(screen.getByTestId("group")).toHaveClass(toggleStyles.rounded!);
      const [first, second] = [
        within(screen.getByTestId("group")).getAllByRole("radio")[0]!,
        within(screen.getByTestId("own")).getAllByRole("radio")[0]!,
      ];
      expect(first).toHaveClass(toggleStyles.sizeLg!);
      expect(second).toHaveClass(toggleStyles.sizeXs!);
    });

    it("takes its items out of the arrow-key order when the bar or the group is disabled", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Toolbar aria-label="Bar" disabled>
          <Align />
        </Toolbar>,
      );
      for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
      rerender(
        <Toolbar aria-label="Bar">
          <Toolbar.Button>One</Toolbar.Button>
          <Align disabled />
          <Toolbar.Button>Last</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    });
  });

  describe("Toolbar.Group attached", () => {
    it("is a named group of ButtonGroup's, with its items still in the arrow-key order", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar" itemVariant="secondary">
          <Toolbar.Group aria-label="Style" attached data-testid="group">
            <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
            <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
          </Toolbar.Group>
          <Toolbar.Button>Link</Toolbar.Button>
        </Toolbar>,
      );
      const group = screen.getByRole("group", { name: "Style" });
      expect(group).toHaveClass(buttonGroupStyles.attached!);
      // the bar's own settings reach the buttons through the group
      expect(screen.getByRole("button", { name: "Bold" })).toHaveClass(iconButtonStyles.variantSecondary!);
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(screen.getByRole("button", { name: "Link" })).toHaveFocus();
    });

    it("follows the bar's orientation, and is not attached by default", () => {
      render(
        <Toolbar aria-label="Bar" orientation="vertical">
          <Toolbar.Group aria-label="A" attached>
            <Toolbar.Button>One</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Group aria-label="B">
            <Toolbar.Button>Two</Toolbar.Button>
          </Toolbar.Group>
        </Toolbar>,
      );
      expect(screen.getByRole("group", { name: "A" })).toHaveAttribute("data-orientation", "vertical");
      expect(screen.getByRole("group", { name: "B" })).not.toHaveClass(buttonGroupStyles.attached!);
    });
  });

  describe("IconButton tooltip in a toolbar", () => {
    it("shows the tooltip on keyboard focus and keeps the arrow keys moving", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Bar">
          <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" tooltip />
          <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" tooltip="Make it italic" />
        </Toolbar>,
      );
      await user.tab();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Bold");
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
      expect(await screen.findByText("Make it italic", { selector: '[role="tooltip"]' })).toBeInTheDocument();
    });
  });

  describe("overflow", () => {
    it("scroll: wraps the bar in a frame with the surface, and the bar is the scroller", () => {
      render(<Bar overflow="scroll" variant="outlined" data-testid="bar" />);
      const bar = screen.getByTestId("bar");
      const frame = bar.parentElement!;
      expect(frame).toHaveClass(styles.frame!, styles.outlined!);
      expect(bar).toHaveClass(styles.scroller!);
      expect(bar).not.toHaveClass(styles.outlined!);
      expect(frame).toHaveAttribute("data-overflow-start", "false");
      expect(frame).toHaveAttribute("data-overflow-end", "false");
    });

    it("scroll: the buttons are for a pointer — out of the tab order and hidden from assistive tech", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <Bar overflow="scroll" data-testid="bar" />
          <button>after</button>
        </>,
      );
      const frame = screen.getByTestId("bar").parentElement!;
      const scrollButtons = [...frame.querySelectorAll(":scope > button")];
      expect(scrollButtons).toHaveLength(2);
      for (const button of scrollButtons) {
        expect(button).toHaveAttribute("aria-hidden", "true");
        expect(button).toHaveAttribute("tabindex", "-1");
      }
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("scroll: shows the end that has more, and the button scrolls the bar that way (reversed in rtl)", async () => {
      const user = userEvent.setup();
      const rects = new Map<Element, DOMRect>();
      const rect = (left: number, right: number) => ({ left, right, top: 0, bottom: 20, width: right - left, height: 20, x: left, y: 0 }) as DOMRect;
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
        return rects.get(this) ?? rect(0, 0);
      });
      const scrollBy = vi.fn();
      const { rerender } = render(<Bar overflow="scroll" data-testid="bar" />);
      const bar = screen.getByTestId("bar");
      Object.defineProperty(bar, "scrollBy", { value: scrollBy, configurable: true });
      Object.defineProperty(bar, "clientWidth", { value: 200, configurable: true });
      rects.set(bar, rect(0, 200));
      rects.set(bar.firstElementChild!, rect(0, 40));
      rects.set(bar.lastElementChild!, rect(300, 360));
      // a change the observers watch makes it re-read
      rerender(
        <Bar overflow="scroll" data-testid="bar">
          <Toolbar.Button>Extra</Toolbar.Button>
        </Bar>,
      );
      const frame = bar.parentElement!;
      await waitFor(() => expect(frame).toHaveAttribute("data-overflow-end", "true"));
      expect(frame).toHaveAttribute("data-overflow-start", "false");
      await user.click(frame.querySelectorAll(":scope > button")[1]!);
      expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 150 }));
      rerender(
        <Bar overflow="scroll" data-testid="bar" dir="rtl">
          <Toolbar.Button>Extra</Toolbar.Button>
        </Bar>,
      );
      await user.click(frame.querySelectorAll(":scope > button")[1]!);
      expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -150 }));
    });

    it("is a plain bar, not a scroller, for visible and wrap", () => {
      const { rerender } = render(<Bar data-testid="bar" overflow="wrap" />);
      expect(screen.getByTestId("bar").parentElement).toBe(document.body.firstElementChild);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.scroller!);
      rerender(<Bar data-testid="bar" overflow="visible" />);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.wrap!);
    });
  });

  describe("sticky", () => {
    it("composes Affix: a surface and the marker in front, stuck state on the bar itself", () => {
      render(<Bar sticky data-testid="bar" />);
      const bar = screen.getByTestId("bar");
      expect(bar).toHaveClass(styles.sticky!);
      expect(bar.previousElementSibling).not.toBeNull();
      expect(screen.getByRole("toolbar")).toBe(bar);
    });

    it("sticks the frame, not the inner bar, when it also scrolls", () => {
      render(<Bar sticky overflow="scroll" variant="outlined" data-testid="bar" />);
      const bar = screen.getByTestId("bar");
      expect(bar.parentElement).toHaveClass(styles.sticky!, styles.frame!);
      expect(bar).not.toHaveClass(styles.sticky!);
    });
  });

  it("survives StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Bar />
      </StrictMode>,
    );
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
  });

  describe("accessibility", () => {
    it("has no axe violations", async () => {
      const { container } = render(
        <Toolbar aria-label="Editor">
          <Toolbar.Group aria-label="Style">
            <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" defaultPressed />
            <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
          </Toolbar.Group>
          <Toolbar.Separator />
          <Toolbar.Button>Link</Toolbar.Button>
          <Toolbar.Spacer />
          <Toolbar.Button disabled>Save</Toolbar.Button>
        </Toolbar>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations when vertical, disabled, or with a link item", async () => {
      const { container } = render(
        <>
          <Bar orientation="vertical" variant="outlined" />
          <Bar disabled variant="filled" />
          <Toolbar aria-label="Links">
            <Toolbar.Item>
              <a href="/docs">Docs</a>
            </Toolbar.Item>
          </Toolbar>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
