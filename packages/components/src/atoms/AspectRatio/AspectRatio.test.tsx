import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "./AspectRatio";

describe("AspectRatio", () => {
  it("renders its children", () => {
    render(
      <AspectRatio>
        <img src="/photo.jpg" alt="A test graphic" />
      </AspectRatio>,
    );
    expect(screen.getByAltText("A test graphic")).toBeInTheDocument();
  });

  it("defaults to a 16:9 ratio", () => {
    const { container } = render(
      <AspectRatio>
        <div />
      </AspectRatio>,
    );
    expect(container.firstChild).toHaveStyle({ aspectRatio: "1.7777777777777777" });
  });

  it("applies a custom ratio", () => {
    const { container } = render(
      <AspectRatio ratio={1}>
        <div />
      </AspectRatio>,
    );
    expect(container.firstChild).toHaveStyle({ aspectRatio: "1" });
  });

  it("forwards ref to the outer element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <AspectRatio ref={ref}>
        <div />
      </AspectRatio>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className to the outer element", () => {
    const { container } = render(
      <AspectRatio className="custom">
        <div />
      </AspectRatio>,
    );
    expect(container.firstChild).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AspectRatio>
        <img src="/photo.jpg" alt="A test graphic" />
      </AspectRatio>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
