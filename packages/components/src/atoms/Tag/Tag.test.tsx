import { TagIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Tag } from "./Tag";

describe("Tag", () => {
  it("renders its label text", () => {
    render(<Tag>Design</Tag>);
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("renders a leading icon when icon is provided", () => {
    const { container } = render(<Tag icon={TagIcon}>Design</Tag>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("does not render a remove button by default", () => {
    render(<Tag>Design</Tag>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a remove button when removable, with a default accessible label", () => {
    render(<Tag removable>Design</Tag>);
    expect(
      screen.getByRole("button", { name: "Remove Design" }),
    ).toBeInTheDocument();
  });

  it("supports a custom removeLabel", () => {
    render(
      <Tag removable removeLabel="Remove Design filter">
        Design
      </Tag>,
    );
    expect(
      screen.getByRole("button", { name: "Remove Design filter" }),
    ).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Tag removable onRemove={onRemove}>
        Design
      </Tag>,
    );
    await user.click(screen.getByRole("button", { name: "Remove Design" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("forwards ref to the root span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Tag ref={ref}>Design</Tag>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("applies className", () => {
    render(<Tag className="custom">Design</Tag>);
    expect(screen.getByText("Design").closest("span")).toHaveClass("custom");
  });

  it("has no accessibility violations, plain, with an icon, or removable", async () => {
    const { container, rerender } = render(<Tag>Design</Tag>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Tag icon={TagIcon}>Design</Tag>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Tag removable onRemove={() => {}}>
        Design
      </Tag>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
