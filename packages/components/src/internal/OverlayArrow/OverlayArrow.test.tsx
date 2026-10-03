import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { OverlayArrow } from "./OverlayArrow";

describe("OverlayArrow", () => {
  it("draws a filled triangle and a separate open path for the two exposed edges", () => {
    const { container } = render(<OverlayArrow />);
    const polygon = container.querySelector("polygon");
    const path = container.querySelector("path");
    expect(polygon).toHaveAttribute("points", "0,0 30,0 15,10");
    // Open: no closing segment, so the base is never stroked.
    expect(path).toHaveAttribute("d", "M0,0 L15,10 L30,0");
    expect(path?.getAttribute("d")).not.toMatch(/z/i);
  });

  it("forwards its ref and every prop to the <svg>, as a Radix `asChild` child must", () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(<OverlayArrow ref={ref} width={10} height={5} viewBox="0 0 30 10" aria-hidden />);
    expect(ref.current).toBe(container.querySelector("svg"));
    expect(ref.current).toHaveAttribute("width", "10");
    expect(ref.current).toHaveAttribute("viewBox", "0 0 30 10");
    expect(ref.current).toHaveAttribute("aria-hidden", "true");
  });
});
