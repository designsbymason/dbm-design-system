import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { Tooltip } from "./Tooltip";
import { TooltipProvider } from "./TooltipProvider";

describe("Tooltip", () => {
  it("does not render its content until triggered", () => {
    render(
      <Tooltip content="Save your changes">
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows its content when the trigger receives focus", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Save your changes" delayDuration={0}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Save your changes",
    );
  });

  it("shows its content on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Save your changes" delayDuration={0}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Save your changes",
    );
  });

  it("closes immediately on unhover when disableHoverableContent is set", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip
        content="Save your changes"
        delayDuration={0}
        disableHoverableContent
      >
        <button type="button">Save</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button"));
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.unhover(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });

  it("closes when Escape is pressed while open", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Save your changes" delayDuration={0}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });

  it("supports controlled open state", () => {
    const { rerender } = render(
      <Tooltip content="Save your changes" open={false}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    rerender(
      <Tooltip content="Save your changes" open>
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("calls onOpenChange when open state changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Tooltip
        content="Save your changes"
        delayDuration={0}
        onOpenChange={onOpenChange}
      >
        <button type="button">Save</button>
      </Tooltip>,
    );
    await user.tab();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
  });

  it("renders the trigger via asChild, without wrapping it in an extra element", () => {
    render(
      <Tooltip content="Save your changes">
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(screen.getByRole("button", { name: "Save" }).tagName).toBe(
      "BUTTON",
    );
  });

  it("applies id, className, style, and data-testid to the content element", () => {
    render(
      <Tooltip
        content="Save your changes"
        open
        id="save-tooltip"
        className="custom"
        style={{ color: "rgb(1, 2, 3)" }}
        data-testid="tooltip-content"
      >
        <button type="button">Save</button>
      </Tooltip>,
    );
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("id", "save-tooltip");
    expect(tooltip).toHaveClass("custom");
    expect(tooltip).toHaveStyle({ color: "rgb(1, 2, 3)" });
    expect(tooltip).toHaveAttribute("data-testid", "tooltip-content");
  });

  it("points the trigger's aria-describedby at the content element's id while open", () => {
    render(
      <Tooltip content="Save your changes" open id="save-tooltip">
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-describedby",
      "save-tooltip",
    );
  });

  it("hides the arrow when hideArrow is set", () => {
    // Content portals to `document.body`, outside the local `container` —
    // `screen` queries the whole document, so the tooltip (found via its
    // `role`) is scoped correctly regardless of where it actually rendered.
    const { unmount } = render(
      <Tooltip content="Save your changes" open>
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip").querySelector("svg")).toBeInTheDocument();
    unmount();

    render(
      <Tooltip content="Save your changes" open hideArrow>
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(
      screen.getByRole("tooltip").querySelector("svg"),
    ).not.toBeInTheDocument();
  });

  it("uses aria-label as the accessible description instead of the visible content when provided", () => {
    render(
      <Tooltip content="Save your changes" open aria-label="Save changes">
        <button type="button">Save</button>
      </Tooltip>,
    );
    // Radix still renders an element with role="tooltip" — a separate,
    // visually-hidden one carrying this string, distinct from the visible
    // bubble (which still shows `content` as normal, just without the
    // role/id) — confirmed by reading Radix's own source rather than
    // assumed, since this is easy to get backwards.
    expect(screen.getByRole("tooltip")).toHaveTextContent("Save changes");
    expect(screen.getByText("Save your changes")).toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(
      <Tooltip content="Save your changes" open>
        <button type="button">Save</button>
      </Tooltip>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("TooltipProvider", () => {
    it("still opens a nested Tooltip on hover with no configuration", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip content="Save your changes" delayDuration={0}>
            <button type="button">Save</button>
          </Tooltip>
        </TooltipProvider>,
      );
      await user.hover(screen.getByRole("button"));
      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "Save your changes",
      );
    });

    it("lets a nested Tooltip's own delayDuration override the provider's", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider delayDuration={100000}>
          <Tooltip content="Save your changes" delayDuration={0}>
            <button type="button">Save</button>
          </Tooltip>
        </TooltipProvider>,
      );
      await user.hover(screen.getByRole("button"));
      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "Save your changes",
      );
    });

    // The actual cross-tooltip skip-delay behavior (moving from one
    // tooltip to another within `skipDelayDuration`) depends on Radix's
    // real continuous pointer-tracking (a grace-area polygon algorithm
    // watching real `pointermove` coordinates) — confirmed live that
    // jsdom's synthetic hover/unhover can't reliably reproduce it (the
    // first tooltip never even closed), the same class of gap already
    // documented elsewhere in this codebase for pointer/animation-timing
    // behavior that only works correctly in a real browser. Verified
    // instead via a `play` function in `Tooltip.stories.tsx`'s own
    // `MultipleWithSharedProvider` story, which runs in a real Playwright
    // browser through the `storybook` Vitest project.
  });
});
