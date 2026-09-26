import { CopyIcon, TrashIcon } from "@dbm-design-system/icons";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import buttonStyles from "../../atoms/Button/Button.module.css";
import iconButtonStyles from "../../atoms/IconButton/IconButton.module.css";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { Tooltip } from "../../atoms/Tooltip";
import { ButtonGroup } from "./ButtonGroup";
import styles from "./ButtonGroup.module.css";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ButtonGroup", () => {
  it("is a named group of ordinary buttons", () => {
    render(
      <ButtonGroup aria-label="Actions">
        <Button>Copy</Button>
        <Button>Paste</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Actions" });
    expect(group).toContainElement(screen.getByRole("button", { name: "Copy" }));
    expect(group).toContainElement(screen.getByRole("button", { name: "Paste" }));
  });

  it("can be named by a visible label", () => {
    render(
      <>
        <span id="label">Alignment</span>
        <ButtonGroup aria-labelledby="label">
          <Button>Left</Button>
        </ButtonGroup>
      </>,
    );
    expect(screen.getByRole("group", { name: "Alignment" })).toBeInTheDocument();
  });

  it("warns once in development when it has no accessible name, and not when it has one", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <ButtonGroup>
        <Button>Copy</Button>
      </ButtonGroup>,
    );
    rerender(
      <ButtonGroup>
        <Button>Copy</Button>
      </ButtonGroup>,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
    warnSpy.mockClear();
    rerender(
      <ButtonGroup aria-label="Actions">
        <Button>Copy</Button>
      </ButtonGroup>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("keeps role=group when a same-named prop is passed", () => {
    render(
      <ButtonGroup aria-label="Actions" {...{ role: "presentation" }}>
        <Button>Copy</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group", { name: "Actions" })).toBeInTheDocument();
  });

  it("forwards ref, className, style, id and data-testid to the group", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ButtonGroup aria-label="Actions" ref={ref} className="custom" style={{ opacity: 0.5 }} id="group" data-testid="g">
        <Button>Copy</Button>
      </ButtonGroup>,
    );
    const group = screen.getByTestId("g");
    expect(ref.current).toBe(group);
    expect(group).toHaveClass("custom");
    expect(group).toHaveAttribute("id", "group");
    expect(group).toHaveStyle({ opacity: "0.5" });
  });

  describe("settings for the buttons inside", () => {
    it("gives every Button and IconButton the group's variant and size", () => {
      render(
        <ButtonGroup aria-label="Actions" variant="secondary" size="sm">
          <Button>Copy</Button>
          <IconButton icon={TrashIcon} aria-label="Delete" />
        </ButtonGroup>,
      );
      const button = screen.getByRole("button", { name: "Copy" });
      expect(button).toHaveClass(buttonStyles.variantSecondary as string);
      expect(button).toHaveClass(buttonStyles.sizeSm as string);
      const iconButton = screen.getByRole("button", { name: "Delete" });
      expect(iconButton).toHaveClass(iconButtonStyles.variantSecondary as string);
      expect(iconButton).toHaveClass(iconButtonStyles.sizeSm as string);
    });

    it("lets a button's own props win over the group's", () => {
      render(
        <ButtonGroup aria-label="Actions" variant="secondary" size="sm" rounded>
          <Button variant="destructive" size="lg" rounded={false}>
            Delete
          </Button>
          <IconButton icon={TrashIcon} aria-label="Remove" variant="ghost" size="xl" rounded={false} />
        </ButtonGroup>,
      );
      const button = screen.getByRole("button", { name: "Delete" });
      expect(button).toHaveClass(buttonStyles.variantDestructive as string);
      expect(button).toHaveClass(buttonStyles.sizeLg as string);
      expect(button).not.toHaveClass(buttonStyles.rounded as string);
      expect(button).toHaveAttribute("data-variant", "destructive");
      const iconButton = screen.getByRole("button", { name: "Remove" });
      expect(iconButton).toHaveClass(iconButtonStyles.variantGhost as string);
      expect(iconButton).toHaveClass(iconButtonStyles.sizeXl as string);
      expect(iconButton).not.toHaveClass(iconButtonStyles.rounded as string);
    });

    it("leaves a button its own defaults when the group sets nothing", () => {
      render(
        <ButtonGroup aria-label="Actions">
          <Button>Copy</Button>
        </ButtonGroup>,
      );
      const button = screen.getByRole("button", { name: "Copy" });
      expect(button).toHaveClass(buttonStyles.variantPrimary as string);
      expect(button).toHaveClass(buttonStyles.sizeMd as string);
      expect(button).not.toHaveClass(buttonStyles.rounded as string);
    });

    it("gives every button the group's rounded", () => {
      render(
        <ButtonGroup aria-label="Actions" rounded>
          <Button>Copy</Button>
          <IconButton icon={CopyIcon} aria-label="Duplicate" />
        </ButtonGroup>,
      );
      expect(screen.getByRole("button", { name: "Copy" })).toHaveClass(buttonStyles.rounded as string);
      expect(screen.getByRole("button", { name: "Duplicate" })).toHaveClass(iconButtonStyles.rounded as string);
    });

    it("disables every button when the group is disabled — even one that says disabled={false}", () => {
      render(
        <ButtonGroup aria-label="Actions" disabled>
          <Button>Copy</Button>
          <Button disabled={false}>Paste</Button>
          <IconButton icon={TrashIcon} aria-label="Delete" />
        </ButtonGroup>,
      );
      for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    });

    it("keeps a button that is disabled itself disabled in an enabled group", () => {
      render(
        <ButtonGroup aria-label="Actions">
          <Button>Copy</Button>
          <Button disabled>Paste</Button>
        </ButtonGroup>,
      );
      expect(screen.getByRole("button", { name: "Copy" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Paste" })).toBeDisabled();
    });

    it("reaches a button wrapped for a tooltip, and an asChild link", () => {
      render(
        <ButtonGroup aria-label="Actions" variant="tertiary">
          <Tooltip content="Copy it">
            <Button>Copy</Button>
          </Tooltip>
          <Button asChild>
            <a href="/next">Next</a>
          </Button>
        </ButtonGroup>,
      );
      expect(screen.getByRole("button", { name: "Copy" })).toHaveAttribute("data-variant", "tertiary");
      expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("data-variant", "tertiary");
    });

    it("marks each button with its variant so the separators suit it, only inside a group", () => {
      render(
        <>
          <Button>Alone</Button>
          <IconButton icon={TrashIcon} aria-label="Alone icon" />
          <ButtonGroup aria-label="Actions">
            <Button variant="ghost">In group</Button>
          </ButtonGroup>
        </>,
      );
      expect(screen.getByRole("button", { name: "Alone" })).not.toHaveAttribute("data-variant");
      expect(screen.getByRole("button", { name: "Alone icon" })).not.toHaveAttribute("data-variant");
      expect(screen.getByRole("button", { name: "In group" })).toHaveAttribute("data-variant", "ghost");
    });

    it("does not leak the group's settings to a button outside it", () => {
      render(
        <>
          <ButtonGroup aria-label="Actions" variant="secondary" disabled>
            <Button>Inside</Button>
          </ButtonGroup>
          <Button>Outside</Button>
        </>,
      );
      const outside = screen.getByRole("button", { name: "Outside" });
      expect(outside).toBeEnabled();
      expect(outside).toHaveClass(buttonStyles.variantPrimary as string);
    });
  });

  describe("layout", () => {
    it("is attached and horizontal by default", () => {
      render(
        <ButtonGroup aria-label="Actions">
          <Button>Copy</Button>
        </ButtonGroup>,
      );
      const group = screen.getByRole("group");
      expect(group).toHaveClass(styles.attached as string);
      expect(group).not.toHaveClass(styles.spaced as string);
      expect(group).toHaveAttribute("data-orientation", "horizontal");
    });

    it("is spaced with attached={false}", () => {
      render(
        <ButtonGroup aria-label="Actions" attached={false}>
          <Button>Copy</Button>
        </ButtonGroup>,
      );
      expect(screen.getByRole("group")).toHaveClass(styles.spaced as string);
      expect(screen.getByRole("group")).not.toHaveClass(styles.attached as string);
    });

    it("is vertical with orientation=vertical", () => {
      render(
        <ButtonGroup aria-label="Actions" orientation="vertical">
          <Button>Copy</Button>
        </ButtonGroup>,
      );
      expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "vertical");
    });

    it("follows a breakpoint map, and changes when the viewport does", () => {
      const listeners: Array<() => void> = [];
      let wide = false;
      vi.stubGlobal(
        "matchMedia",
        vi.fn().mockImplementation((query: string) => ({
          get matches() {
            return query === "(min-width: 768px)" && wide;
          },
          media: query,
          addEventListener: (_event: string, callback: () => void) => listeners.push(callback),
          removeEventListener: vi.fn(),
        })),
      );
      render(
        <ButtonGroup aria-label="Actions" orientation={{ base: "vertical", md: "horizontal" }}>
          <Button>Copy</Button>
        </ButtonGroup>,
      );
      expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "vertical");
      wide = true;
      act(() => listeners.forEach((callback) => callback()));
      expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("stretches with fullWidth", () => {
      render(
        <ButtonGroup aria-label="Actions" fullWidth>
          <Button>Copy</Button>
        </ButtonGroup>,
      );
      expect(screen.getByRole("group")).toHaveClass(styles.fullWidth as string);
    });
  });

  it("is not a selection control: every button is a tab stop, in order", async () => {
    const user = userEvent.setup();
    render(
      <ButtonGroup aria-label="Actions">
        <Button>One</Button>
        <Button>Two</Button>
        <IconButton icon={TrashIcon} aria-label="Three" />
      </ButtonGroup>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "One" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
  });

  it("presses a button with Enter and Space, and runs its own handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ButtonGroup aria-label="Actions">
        <Button onClick={onClick}>Copy</Button>
      </ButtonGroup>,
    );
    await user.tab();
    await user.keyboard("{Enter} ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("survives React StrictMode", () => {
    render(
      <StrictMode>
        <ButtonGroup aria-label="Actions" variant="secondary">
          <Button>Copy</Button>
        </ButtonGroup>
      </StrictMode>,
    );
    expect(screen.getByRole("button", { name: "Copy" })).toHaveClass(buttonStyles.variantSecondary as string);
  });

  describe("accessibility", () => {
    it.each([
      ["attached", {}],
      ["spaced", { attached: false }],
      ["vertical", { orientation: "vertical" as const }],
      ["disabled", { disabled: true }],
      ["every variant, rounded", { rounded: true }],
    ])("has no violations, %s", async (_name, extra) => {
      const { container } = render(
        <ButtonGroup aria-label="Actions" {...extra}>
          <Button variant="primary">Save</Button>
          <Button variant="secondary">Edit</Button>
          <Button variant="tertiary">Share</Button>
          <Button variant="ghost">Copy</Button>
          <Button variant="destructive">Delete</Button>
          <IconButton icon={TrashIcon} aria-label="Remove" />
        </ButtonGroup>,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });

    it("has no violations when named by a visible label", async () => {
      const { container } = render(
        <>
          <span id="label">Alignment</span>
          <ButtonGroup aria-labelledby="label" aria-describedby="help">
            <Button>Left</Button>
            <Button>Right</Button>
          </ButtonGroup>
          <p id="help">Where the text sits</p>
        </>,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });
  });
});
