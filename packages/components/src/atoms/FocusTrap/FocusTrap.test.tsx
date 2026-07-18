import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FocusTrap } from "./FocusTrap";

describe("FocusTrap", () => {
  it("renders children", () => {
    render(
      <FocusTrap>
        <button type="button">Inside</button>
      </FocusTrap>,
    );
    expect(screen.getByRole("button", { name: "Inside" })).toBeInTheDocument();
  });

  it("loops focus from the last back to the first focusable element when loop is set", async () => {
    const user = userEvent.setup();
    render(
      <FocusTrap loop trapped>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FocusTrap>,
    );

    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    first.focus();
    expect(document.activeElement).toBe(first);

    await user.tab();
    expect(document.activeElement).toBe(second);

    await user.tab();
    expect(document.activeElement).toBe(first);
  });

  it("forwards native div props", () => {
    render(
      <FocusTrap data-testid="trap">
        <button type="button">Inside</button>
      </FocusTrap>,
    );
    expect(screen.getByTestId("trap")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FocusTrap>
        <button type="button">Accessible</button>
      </FocusTrap>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
