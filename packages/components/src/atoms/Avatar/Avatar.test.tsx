import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders an image when src is given", () => {
    render(<Avatar src="/user.jpg" alt="Jane Doe" initials="JD" />);
    const img = screen.getByRole("img", { name: "Jane Doe" });
    expect(img).toHaveAttribute("src", "/user.jpg");
  });

  it("renders initials when there is no src", () => {
    render(<Avatar initials="JD" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("falls back to initials when the image fails to load", () => {
    render(<Avatar src="/broken.jpg" alt="Jane Doe" initials="JD" />);
    const img = screen.getByRole("img", { name: "Jane Doe" });
    fireEvent.error(img);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("announces the accessible name on the root when showing the initials fallback", () => {
    render(<Avatar initials="JD" alt="Jane Doe" />);
    expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
  });

  it("applies size as token-driven width/height", () => {
    render(<Avatar initials="JD" size="xl" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveStyle({
      width: "var(--dbm-icon-size-xl)",
      height: "var(--dbm-icon-size-xl)",
    });
  });

  it("renders a status dot with an accessible label", () => {
    render(<Avatar initials="JD" status="online" />);
    expect(screen.getByRole("img", { name: "Online" })).toBeInTheDocument();
  });

  it("renders no status dot when status is not set", () => {
    render(<Avatar initials="JD" data-testid="avatar" />);
    expect(screen.getByTestId("avatar").querySelectorAll('[role="img"]')).toHaveLength(0);
  });

  it("forwards ref to the underlying span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} initials="JD" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards className and native props", () => {
    render(<Avatar initials="JD" className="custom" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveClass("custom");
  });

  it("has no accessibility violations, with an image or with initials", async () => {
    const { container, rerender } = render(<Avatar src="/user.jpg" alt="Jane Doe" initials="JD" />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Avatar initials="JD" alt="Jane Doe" status="busy" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
