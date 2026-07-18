import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Divider } from "./Divider";

describe("Divider", () => {
  it('renders with role="separator"', () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("defaults to horizontal orientation", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("applies vertical orientation", () => {
    render(<Divider orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("renders a single line when no label is given", () => {
    render(<Divider />);
    expect(screen.getByRole("separator").children).toHaveLength(1);
  });

  it("renders the label between two line segments when given", () => {
    render(<Divider label="OR" />);
    const separator = screen.getByRole("separator");
    expect(separator.children).toHaveLength(3);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Divider ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(<Divider className="custom" data-testid="divider" />);
    expect(screen.getByTestId("divider")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Divider label="OR" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
