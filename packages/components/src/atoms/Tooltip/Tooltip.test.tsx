import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { Tooltip } from "./Tooltip";

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

  it("has no accessibility violations when open", async () => {
    const { container } = render(
      <Tooltip content="Save your changes" open>
        <button type="button">Save</button>
      </Tooltip>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
