import { TextBIcon, TextItalicIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import buttonStyles from "../../atoms/Button/Button.module.css";
import iconButtonStyles from "../../atoms/IconButton/IconButton.module.css";
import { Tooltip } from "../../atoms/Tooltip";
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
      rerender(<Bar data-testid="bar" variant="filled" wrap />);
      expect(screen.getByTestId("bar")).toHaveClass(styles.filled!, styles.wrap!);
    });

    it("is as wide as its items unless fullWidth is set", () => {
      const { rerender } = render(<Bar data-testid="bar" />);
      expect(screen.getByTestId("bar")).not.toHaveClass(styles.fullWidth!);
      rerender(<Bar data-testid="bar" fullWidth />);
      expect(screen.getByTestId("bar")).toHaveClass(styles.fullWidth!);
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
