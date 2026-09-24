import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StarIcon } from "@dbm-design-system/icons";
import { Alert } from "./Alert";
import type { AlertProps } from "./Alert.types";

// Stands in for the helper that says whether the page has finished loading, so a test can be on either side of it.
const page = vi.hoisted(() => ({ settled: false }));
vi.mock("./pageSettled", () => ({ hasPageSettled: () => page.settled }));

// jsdom has no `AnimationEvent`, so React listens for the prefixed `webkitAnimationEnd` there (real browsers, and the Storybook
// tests, use `animationend`).
const animationEnd = (element: Element) => fireEvent(element, new Event("webkitAnimationEnd", { bubbles: true }));

/** The element that carries `data-state` and `data-enter`: the alert's outermost element. */
const wrapperOf = (alert: HTMLElement) => alert.parentElement!.parentElement!;

function Basic(props: Partial<AlertProps>) {
  return (
    <Alert {...props}>
      <Alert.Title>Payment failed</Alert.Title>
      <Alert.Description>Your card was declined.</Alert.Description>
      <Alert.Actions>
        <Alert.Action>Update card</Alert.Action>
      </Alert.Actions>
    </Alert>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  page.settled = false;
});

describe("Alert — structure", () => {
  it("renders its title, description and actions", () => {
    render(<Basic />);
    expect(screen.getByText("Payment failed")).toBeInTheDocument();
    expect(screen.getByText("Your card was declined.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update card" })).toBeInTheDocument();
  });

  it("renders plain text as the shortest alert", () => {
    render(<Alert>Saved.</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Saved.");
  });

  it("draws a decorative icon for every tone, none when icon is false, and your own when given one", () => {
    const { rerender, container } = render(<Alert>x</Alert>);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    for (const tone of ["info", "success", "warning", "danger", "neutral"] as const) {
      rerender(<Alert tone={tone}>x</Alert>);
      expect(container.querySelector("svg")).not.toBeNull();
    }
    rerender(<Alert icon={false}>x</Alert>);
    expect(container.querySelector("svg")).toBeNull();
    rerender(<Alert icon={StarIcon}>x</Alert>);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("forwards its ref to the element that carries the role, and passes id, className, style, data-testid and native props", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Alert ref={ref} id="a" className="mine" style={{ color: "red" }} data-testid="alert" title="hi">
        x
      </Alert>,
    );
    const alert = screen.getByTestId("alert");
    expect(ref.current).toBe(alert);
    expect(alert).toHaveAttribute("role", "status");
    expect(alert).toHaveAttribute("id", "a");
    expect(alert).toHaveClass("mine");
    expect(alert).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(alert).toHaveAttribute("title", "hi");
  });

  it("applies a class for each tone, variant and size", () => {
    render(<Alert tone="danger" variant="solid" size="xl" data-testid="a">x</Alert>);
    const { className } = screen.getByTestId("a");
    expect(className).toMatch(/toneDanger/);
    expect(className).toMatch(/variantSolid/);
    expect(className).toMatch(/sizeXl/);
  });

  it("puts the title on your own element with asChild", () => {
    render(
      <Alert>
        <Alert.Title asChild>
          <h2>Heads up</h2>
        </Alert.Title>
      </Alert>,
    );
    expect(screen.getByRole("heading", { name: "Heads up", level: 2 }).className).toMatch(/title/);
  });

  it("forwards refs on every part", () => {
    const title = createRef<HTMLParagraphElement>();
    const description = createRef<HTMLDivElement>();
    const actions = createRef<HTMLDivElement>();
    render(
      <Alert>
        <Alert.Title ref={title}>t</Alert.Title>
        <Alert.Description ref={description}>d</Alert.Description>
        <Alert.Actions ref={actions}>a</Alert.Actions>
      </Alert>,
    );
    expect(title.current?.tagName).toBe("P");
    expect(description.current?.tagName).toBe("DIV");
    expect(actions.current?.tagName).toBe("DIV");
  });
});

describe("Alert.Action", () => {
  it("is a Button, and follows the size of the alert around it", () => {
    const sizes = (["xs", "sm", "md", "lg", "xl"] as const).map((size) => {
      const { unmount } = render(
        <Alert size={size}>
          <Alert.Actions>
            <Alert.Action>Go</Alert.Action>
          </Alert.Actions>
        </Alert>,
      );
      const { className } = screen.getByRole("button", { name: "Go" });
      unmount();
      return className;
    });
    ["sizeXs", "sizeSm", "sizeMd", "sizeLg", "sizeXl"].forEach((size, index) => expect(sizes[index]).toMatch(new RegExp(size)));
  });

  it("is primary by default, and takes secondary and tertiary", () => {
    render(
      <Alert>
        <Alert.Action>One</Alert.Action>
        <Alert.Action variant="secondary">Two</Alert.Action>
        <Alert.Action variant="tertiary">Three</Alert.Action>
      </Alert>,
    );
    const [one, two, three] = ["One", "Two", "Three"].map((name) => screen.getByRole("button", { name }).className);
    expect(one).toMatch(/actionPrimary/);
    expect(two).toMatch(/actionSecondary/);
    expect(three).toMatch(/actionTertiary/);
    // The Button underneath is drawn as the same treatment, so its layout and states are Button's own.
    expect(one).toMatch(/variantPrimary/);
    expect(two).toMatch(/variantSecondary/);
    expect(three).toMatch(/variantTertiary/);
  });

  it("does not let a caller pick another size or variant than the alert's", () => {
    // `size` is not a prop of Alert.Action (TypeScript stops it); a stray one at runtime still can't win.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const props = { size: "xl", variant: "ghost" } as unknown as { variant?: "primary" };
    render(
      <Alert size="xs">
        <Alert.Action {...props}>Go</Alert.Action>
      </Alert>,
    );
    const { className } = screen.getByRole("button", { name: "Go" });
    expect(className).toMatch(/sizeXs/);
    expect(className).not.toMatch(/sizeXl/);
    expect(className).not.toMatch(/variantGhost/);
    expect(className).toMatch(/actionPrimary/);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`variant` must be "primary", "secondary" or "tertiary"'));
  });

  it("passes everything else to Button: onClick, disabled, type, ref, className, icons and asChild", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Alert>
        <Alert.Action ref={ref} onClick={onClick} className="mine" data-testid="a" leadingIcon={StarIcon}>
          Go
        </Alert.Action>
        <Alert.Action disabled>Off</Alert.Action>
        <Alert.Action asChild>
          <a href="/next">Next</a>
        </Alert.Action>
      </Alert>,
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current).toBe(screen.getByTestId("a"));
    expect(screen.getByTestId("a")).toHaveClass("mine");
    expect(screen.getByTestId("a").querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Off" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/next");
    expect(screen.getByRole("link", { name: "Next" }).className).toMatch(/actionPrimary/);
  });

  it("works outside an alert, at the default size", () => {
    render(<Alert.Action>Alone</Alert.Action>);
    expect(screen.getByRole("button", { name: "Alone" }).className).toMatch(/sizeMd/);
  });

  it("has no axe violations in every alert variant and action variant", async () => {
    const { container } = render(
      <>
        {(["subtle", "outlined", "solid"] as const).map((variant) => (
          <Alert key={variant} variant={variant} tone="danger">
            <Alert.Description>x</Alert.Description>
            <Alert.Actions>
              <Alert.Action>One</Alert.Action>
              <Alert.Action variant="secondary">Two</Alert.Action>
              <Alert.Action variant="tertiary">Three</Alert.Action>
            </Alert.Actions>
          </Alert>
        ))}
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Alert — where the actions sit", () => {
  it("keeps the actions apart from the message, as a direct child of the row", () => {
    render(<Basic data-testid="a" />);
    const body = screen.getByText("Payment failed").closest("div[class*='text']")!.parentElement!;
    const text = body.firstElementChild!;
    expect(text.className).toMatch(/text/);
    expect(text).toContainElement(screen.getByText("Payment failed"));
    expect(text).toContainElement(screen.getByText("Your card was declined."));
    // The actions are the message's sibling, not inside it.
    expect(text).not.toContainElement(screen.getByRole("button", { name: "Update card" }));
    expect(body).toContainElement(screen.getByRole("button", { name: "Update card" }));
  });

  it("puts the actions below the message by default, and beside it with actionsPlacement='inline'", () => {
    const { rerender } = render(<Basic data-testid="a" />);
    expect(screen.getByTestId("a").className).not.toMatch(/actionsInline/);
    rerender(<Basic data-testid="a" actionsPlacement="inline" />);
    expect(screen.getByTestId("a").className).toMatch(/actionsInline/);
  });

  it("treats Alert.Actions inside another element as part of the message", () => {
    render(
      <Alert data-testid="a">
        <Alert.Description>Message</Alert.Description>
        <div data-testid="wrapped">
          <Alert.Actions>
            <Alert.Action>Go</Alert.Action>
          </Alert.Actions>
        </div>
      </Alert>,
    );
    expect(screen.getByTestId("wrapped").closest("div[class*='text']")).not.toBeNull();
  });

  it("renders an alert of only actions, or only a message, without an empty message group", () => {
    const { container, rerender } = render(
      <Alert>
        <Alert.Actions>
          <Alert.Action>Go</Alert.Action>
        </Alert.Actions>
      </Alert>,
    );
    expect(container.querySelector("div[class*='text']")).toBeNull();
    rerender(<Alert>Only text</Alert>);
    expect(container.querySelector("div[class*='text']")).not.toBeNull();
  });
});

describe("Alert — alignment", () => {
  it("is aligned to the start by default, and centres with align='center'", () => {
    const { rerender } = render(<Alert data-testid="a">x</Alert>);
    expect(screen.getByTestId("a").className).not.toMatch(/alignCenter/);
    rerender(<Alert data-testid="a" align="center">x</Alert>);
    expect(screen.getByTestId("a").className).toMatch(/alignCenter/);
  });

  it("marks a dismissible alert, so a centred one leaves room for the button on both sides", () => {
    const { rerender } = render(<Alert data-testid="a" align="center">x</Alert>);
    expect(screen.getByTestId("a").className).not.toMatch(/hasDismiss/);
    rerender(<Alert data-testid="a" align="center" dismissible>x</Alert>);
    expect(screen.getByTestId("a").className).toMatch(/hasDismiss/);
  });
});

describe("Alert — the icon when the content is centred", () => {
  it("sits at the start of the title, inline with its words, and not before the whole message", () => {
    const { container } = render(<Basic align="center" data-testid="a" />);
    const title = screen.getByText("Payment failed").closest("p")!;
    expect(title.querySelector("svg")).not.toBeNull();
    // The old, out-of-line icon box isn't drawn as well.
    expect(container.querySelectorAll("svg[aria-hidden='true']").length).toBe(1);
  });

  it("goes in the description when there is no title", () => {
    render(
      <Alert align="center">
        <Alert.Description>Only a description</Alert.Description>
      </Alert>,
    );
    expect(screen.getByText("Only a description").closest("div[class*='description']")!.querySelector("svg")).not.toBeNull();
  });

  it("stays before the message when the content is at the start", () => {
    const { container } = render(<Basic data-testid="a" />);
    expect(screen.getByText("Payment failed").closest("p")!.querySelector("svg")).toBeNull();
    expect(container.querySelectorAll("svg").length).toBe(1);
  });

  it("stays before the message when the first thing can't hold it: plain text, or a title on your own element", () => {
    const { container, rerender } = render(<Alert align="center">Plain text</Alert>);
    expect(container.querySelectorAll("svg").length).toBe(1);
    expect(container.querySelector("div[class*='text']")!.querySelector("svg")).toBeNull();
    rerender(
      <Alert align="center">
        <Alert.Title asChild>
          <h2>Heading</h2>
        </Alert.Title>
      </Alert>,
    );
    expect(screen.getByRole("heading").querySelector("svg")).toBeNull();
    expect(container.querySelectorAll("svg").length).toBe(1);
  });

  it("is drawn once, only in the first line, when there are several parts", () => {
    const { container } = render(<Basic align="center" />);
    expect(container.querySelectorAll("svg[aria-hidden='true']").length).toBe(1);
    expect(screen.getByText("Your card was declined.").closest("div[class*='description']")!.querySelector("svg")).toBeNull();
  });

  it("draws no icon at all with icon={false}", () => {
    const { container } = render(<Basic align="center" icon={false} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("does not leak into an alert nested in the first line", () => {
    render(
      <Alert align="center" data-testid="outer">
        <Alert.Description>
          <Alert data-testid="inner">
            <Alert.Title>Inner</Alert.Title>
          </Alert>
        </Alert.Description>
      </Alert>,
    );
    // The inner alert is at the start, so it draws its own icon before its message: one icon each, not two in the inner one.
    expect(screen.getByTestId("inner").querySelectorAll("svg").length).toBe(1);
  });
});

describe("Alert — coming in", () => {
  it("does not animate an alert that was in the page when it loaded", () => {
    page.settled = false;
    render(<Alert data-testid="a">x</Alert>);
    expect(wrapperOf(screen.getByTestId("a"))).not.toHaveAttribute("data-enter");
  });

  it("animates an alert that appears after the page has loaded, and stops when the animation ends", () => {
    page.settled = true;
    render(<Alert data-testid="a">x</Alert>);
    const wrapper = wrapperOf(screen.getByTestId("a"));
    expect(wrapper).toHaveAttribute("data-enter");
    // The wrapper's own animation ending clears it (so it never clips a focus ring once the alert is in).
    animationEnd(wrapper);
    expect(wrapper).not.toHaveAttribute("data-enter");
  });

  it("ignores an animation ending on something inside it", () => {
    page.settled = true;
    render(<Alert data-testid="a">x</Alert>);
    animationEnd(screen.getByTestId("a"));
    expect(wrapperOf(screen.getByTestId("a"))).toHaveAttribute("data-enter");
  });

  it("animates when it is reopened, even on a page that had not settled", () => {
    page.settled = false;
    const { rerender } = render(<Alert open>x</Alert>);
    expect(document.querySelector("[data-enter]")).toBeNull();
    rerender(<Alert open={false}>x</Alert>);
    rerender(
      <Alert open data-testid="a">
        x
      </Alert>,
    );
    expect(wrapperOf(screen.getByTestId("a"))).toHaveAttribute("data-enter");
  });

  it("does not animate it in on load under StrictMode, which mounts everything twice", () => {
    page.settled = false;
    render(
      <StrictMode>
        <Alert data-testid="a">x</Alert>
      </StrictMode>,
    );
    expect(wrapperOf(screen.getByTestId("a"))).not.toHaveAttribute("data-enter");
  });

  it("animates in under StrictMode when it appears after the page has loaded", () => {
    page.settled = true;
    render(
      <StrictMode>
        <Alert data-testid="a">x</Alert>
      </StrictMode>,
    );
    expect(wrapperOf(screen.getByTestId("a"))).toHaveAttribute("data-enter");
  });

  it("stops entering as soon as it is closed", () => {
    page.settled = true;
    const { rerender } = render(<Alert open data-testid="a">x</Alert>);
    expect(document.querySelector("[data-enter]")).not.toBeNull();
    rerender(<Alert open={false}>x</Alert>);
    expect(document.querySelector("[data-enter]")).toBeNull();
  });
});

describe("Alert — roles", () => {
  it("interrupts (role=alert) for danger and warning, and waits (role=status) for the rest", () => {
    const roles = (["info", "success", "warning", "danger", "neutral"] as const).map((tone) => {
      const { unmount } = render(<Alert tone={tone} data-testid="a">x</Alert>);
      const role = screen.getByTestId("a").getAttribute("role");
      unmount();
      return role;
    });
    expect(roles).toEqual(["status", "status", "alert", "alert", "status"]);
  });

  it("takes an explicit role, and none at all with role='none'", () => {
    const { rerender } = render(<Alert tone="danger" role="status" data-testid="a">x</Alert>);
    expect(screen.getByTestId("a")).toHaveAttribute("role", "status");
    rerender(<Alert role="none" data-testid="a">x</Alert>);
    expect(screen.getByTestId("a")).not.toHaveAttribute("role");
  });

  it("keeps the role it resolved whatever a caller passes", () => {
    // `role` is declared, so TypeScript stops a wrong value; a stray attribute can still arrive at runtime.
    const props = { role: "alert", "data-testid": "a" } as unknown as AlertProps;
    render(<Alert {...props} tone="info">x</Alert>);
    expect(screen.getByTestId("a")).toHaveAttribute("role", "alert");
  });

  it("takes a name from aria-label or aria-labelledby", () => {
    render(
      <>
        <h2 id="t">Billing</h2>
        <Alert aria-labelledby="t" aria-describedby="d">
          <Alert.Description id="d">Overdue.</Alert.Description>
        </Alert>
      </>,
    );
    expect(screen.getByRole("status", { name: "Billing" })).toHaveAccessibleDescription("Overdue.");
  });
});

describe("Alert — banner and sticky", () => {
  it("adds the banner class", () => {
    render(<Alert banner data-testid="a">x</Alert>);
    expect(screen.getByTestId("a").className).toMatch(/banner/);
  });

  it("is sticky on its outermost element, with nothing wrapped around it", () => {
    const { container } = render(<Alert sticky data-testid="a">x</Alert>);
    const stuck = Array.from(container.children).find((element) => getComputedStyle(element).position === "sticky");
    expect(stuck).toBeDefined();
    expect(stuck).toContainElement(screen.getByTestId("a"));
    // The sticky element is a direct child of the container — the box it sticks within.
    expect(stuck?.parentElement).toBe(container);
  });

  it("is not sticky by default", () => {
    const { container } = render(<Alert data-testid="a">x</Alert>);
    expect(Array.from(container.querySelectorAll("*")).some((el) => getComputedStyle(el).position === "sticky")).toBe(false);
  });

  it("sticks at stickyOffset", () => {
    const { container } = render(<Alert sticky stickyOffset={4}>x</Alert>);
    const stuck = Array.from(container.children).find((element) => getComputedStyle(element).position === "sticky");
    expect((stuck as HTMLElement).style.insetBlockStart || (stuck as HTMLElement).style.top).toBe("var(--dbm-space-4)");
  });
});

describe("Alert — dismissing", () => {
  it("has no dismiss button unless dismissible", () => {
    render(<Alert>x</Alert>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("closes itself when uncontrolled, and reports it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Alert dismissible onOpenChange={onOpenChange}>Bye</Alert>);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText("Bye")).not.toBeInTheDocument();
  });

  it("starts closed with defaultOpen={false}", () => {
    render(<Alert defaultOpen={false}>Hidden</Alert>);
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("only reports, and stays, when controlled — until the caller closes it", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Alert dismissible open={open} onOpenChange={(next) => setOpen(next)}>
          Controlled
        </Alert>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Controlled")).not.toBeInTheDocument();
  });

  it("does not close a controlled alert whose caller ignores onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Alert dismissible open onOpenChange={onOpenChange}>Stays</Alert>);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText("Stays")).toBeInTheDocument();
  });

  it("shows again when a controlled open goes back to true", () => {
    const { rerender } = render(<Alert open={false}>Back</Alert>);
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
    rerender(<Alert open>Back</Alert>);
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("uses a translated label for the dismiss button", () => {
    render(<Alert dismissible labels={{ dismiss: "Fermer" }}>x</Alert>);
    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });

  it("warns about a dismissible controlled alert with no onOpenChange, and about open with defaultOpen", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Alert dismissible open defaultOpen={false}>x</Alert>);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("needs `onOpenChange`"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("both `open` and `defaultOpen`"));
  });
});

describe("Alert — focus when it goes away", () => {
  function Page({ children }: { children?: ReactNode }) {
    return (
      <>
        <button>Before</button>
        {children}
        <button>After</button>
      </>
    );
  }

  it("moves focus on to the next thing in the page after the dismiss button is used", async () => {
    const user = userEvent.setup();
    render(
      <Page>
        <Alert dismissible>x</Alert>
      </Page>,
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("does the same by keyboard, and from an action that closes a controlled alert", async () => {
    const user = userEvent.setup();
    function WithAction() {
      const [open, setOpen] = useState(true);
      return (
        <Page>
          <Alert open={open}>
            <Alert.Actions>
              <Alert.Action onClick={() => setOpen(false)}>Got it</Alert.Action>
            </Alert.Actions>
          </Alert>
        </Page>
      );
    }
    render(<WithAction />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Got it" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("falls back to the previous focusable thing when there is nothing after it", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Before</button>
        <Alert dismissible>x</Alert>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
  });

  it("leaves focus alone when it was somewhere else", async () => {
    const user = userEvent.setup();
    function Toggle() {
      const [open, setOpen] = useState(true);
      return (
        <Page>
          <Alert open={open}>x</Alert>
          <button onClick={() => setOpen(false)}>Close it</button>
        </Page>
      );
    }
    render(<Toggle />);
    await user.click(screen.getByRole("button", { name: "Close it" }));
    expect(screen.getByRole("button", { name: "Close it" })).toHaveFocus();
  });

  it("survives StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Page>
          <Alert dismissible>x</Alert>
        </Page>
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });
});

describe("Alert — accessibility", () => {
  const cases: Array<[string, ReactNode]> = [
    ["a plain alert", <Basic key="a" />],
    ["every tone", (["info", "success", "warning", "danger", "neutral"] as const).map((tone) => <Basic key={tone} tone={tone} />)],
    ["every variant", (["subtle", "outlined", "solid"] as const).map((variant) => <Basic key={variant} variant={variant} />)],
    ["a dismissible banner", <Basic key="d" banner dismissible />],
    ["a sticky alert", <Basic key="e" sticky />],
    ["no role", <Basic key="f" role="none" />],
    ["no icon", <Basic key="g" icon={false} />],
    ["a heading title", <Alert key="h"><Alert.Title asChild><h2>Title</h2></Alert.Title>Body</Alert>],
  ];
  it.each(cases)("has no axe violations: %s", async (_name, ui) => {
    const { container } = render(<>{ui}</>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("names the dismiss button", () => {
    render(<Basic dismissible />);
    const dismiss = within(screen.getByRole("status")).getByRole("button", { name: "Dismiss" });
    expect(dismiss).toHaveAttribute("type", "button");
  });
});
