import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar } from "../../atoms/Avatar";
import avatarStyles from "../../atoms/Avatar/Avatar.module.css";
import { Tooltip } from "../../atoms/Tooltip";
import { AvatarGroup } from "./AvatarGroup";
import styles from "./AvatarGroup.module.css";

afterEach(() => {
  vi.restoreAllMocks();
});

const people = ["Jane Doe", "John Smith", "Alex Kim", "Maria Garcia", "Sam Lee"] as const;
const avatars = (count: number = people.length) => people.slice(0, count).map((name) => <Avatar key={name} name={name} />);

describe("AvatarGroup", () => {
  it("is a named list with one item per avatar", () => {
    render(<AvatarGroup aria-label="Members">{avatars(3)}</AvatarGroup>);
    const list = screen.getByRole("list", { name: "Members" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    for (const name of people.slice(0, 3)) expect(within(list).getByRole("img", { name })).toBeInTheDocument();
  });

  it("can be named by a visible label", () => {
    render(
      <>
        <span id="label">Reviewers</span>
        <AvatarGroup aria-labelledby="label">{avatars(2)}</AvatarGroup>
      </>,
    );
    expect(screen.getByRole("list", { name: "Reviewers" })).toBeInTheDocument();
  });

  it("warns once in development when it has no accessible name, and not when it has one", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<AvatarGroup>{avatars(2)}</AvatarGroup>);
    rerender(<AvatarGroup>{avatars(2)}</AvatarGroup>);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
    warnSpy.mockClear();
    rerender(<AvatarGroup aria-label="Members">{avatars(2)}</AvatarGroup>);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("states its list roles, and a same-named `role` prop cannot replace them", () => {
    render(
      // @ts-expect-error `role` is not a prop of AvatarGroup; a JS consumer could still pass it
      <AvatarGroup aria-label="Members" role="presentation">
        {avatars(2)}
      </AvatarGroup>,
    );
    expect(screen.getByRole("list", { name: "Members" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("forwards its ref and takes className, style, id and a test id on the list", () => {
    const ref = createRef<HTMLUListElement>();
    render(
      <AvatarGroup ref={ref} aria-label="Members" className="mine" style={{ color: "red" }} id="team" data-testid="group">
        {avatars(2)}
      </AvatarGroup>,
    );
    const list = screen.getByTestId("group");
    expect(ref.current).toBe(list);
    expect(list.tagName).toBe("UL");
    expect(list).toHaveClass("mine");
    expect(list).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(list).toHaveAttribute("id", "team");
  });

  it("renders nothing but an empty list without children", () => {
    render(<AvatarGroup aria-label="Members" />);
    expect(screen.getByRole("list", { name: "Members" })).toBeEmptyDOMElement();
  });

  describe("overflow", () => {
    it("draws every avatar and no tile when max is left out or is enough", () => {
      const { rerender } = render(<AvatarGroup aria-label="Members">{avatars(5)}</AvatarGroup>);
      expect(screen.getAllByRole("listitem")).toHaveLength(5);
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
      rerender(
        <AvatarGroup aria-label="Members" max={5}>
          {avatars(5)}
        </AvatarGroup>,
      );
      expect(screen.getAllByRole("listitem")).toHaveLength(5);
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it("collapses the avatars past max into one +N tile after them", () => {
      render(
        <AvatarGroup aria-label="Members" max={3}>
          {avatars(5)}
        </AvatarGroup>,
      );
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(4);
      expect(within(items[3] as HTMLElement).getByText("+2")).toBeInTheDocument();
      expect(within(items[3] as HTMLElement).getByRole("img", { name: "2 more" })).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "Maria Garcia" })).not.toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "Sam Lee" })).not.toBeInTheDocument();
    });

    it("counts a max of zero as every avatar hidden", () => {
      render(
        <AvatarGroup aria-label="Members" max={0}>
          {avatars(3)}
        </AvatarGroup>,
      );
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.getByText("+3")).toBeInTheDocument();
    });

    it("uses total for the count, even when every child fits", () => {
      render(
        <AvatarGroup aria-label="Members" total={12}>
          {avatars(3)}
        </AvatarGroup>,
      );
      expect(screen.getAllByRole("listitem")).toHaveLength(4);
      expect(screen.getByText("+9")).toBeInTheDocument();
    });

    it("counts total minus what max cut off the children to", () => {
      render(
        <AvatarGroup aria-label="Members" max={2} total={10}>
          {avatars(5)}
        </AvatarGroup>,
      );
      expect(screen.getByText("+8")).toBeInTheDocument();
    });

    it("warns once when total is smaller than the children given, and still counts sensibly", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <AvatarGroup aria-label="Members" total={2}>
          {avatars(4)}
        </AvatarGroup>,
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("`total`"));
      expect(screen.getAllByRole("listitem")).toHaveLength(4);
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it("says 99+ for a count that would not fit, keeping the real count in the name", () => {
      render(<AvatarGroup aria-label="Members" total={250}>{avatars(1)}</AvatarGroup>);
      expect(screen.getByText("99+")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "249 more" })).toBeInTheDocument();
    });

    it("writes the number with formatNumber", () => {
      render(
        <AvatarGroup aria-label="Members" max={1} formatNumber={(n) => new Intl.NumberFormat("ar-EG").format(n)}>
          {avatars(4)}
        </AvatarGroup>,
      );
      expect(screen.getByText("+٣")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "3 more" })).toBeInTheDocument();
    });

    it("translates its words with labels, one at a time", () => {
      const { rerender } = render(
        <AvatarGroup aria-label="Members" max={1} labels={{ overflow: (n) => `${n} de plus` }}>
          {avatars(3)}
        </AvatarGroup>,
      );
      expect(screen.getByRole("img", { name: "2 de plus" })).toBeInTheDocument();
      rerender(
        <AvatarGroup aria-label="Members" max={1} onOverflowClick={() => {}} labels={{ overflow: (n) => `${n} de plus` }}>
          {avatars(3)}
        </AvatarGroup>,
      );
      // The other label keeps its default.
      expect(screen.getByRole("button", { name: "Show 2 more" })).toBeInTheDocument();
    });

    it("is not interactive without onOverflowClick", () => {
      render(
        <AvatarGroup aria-label="Members" max={1}>
          {avatars(3)}
        </AvatarGroup>,
      );
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("becomes a button with onOverflowClick, which Enter and Space and a click all press", async () => {
      const onOverflowClick = vi.fn();
      const user = userEvent.setup();
      render(
        <AvatarGroup aria-label="Members" max={1} onOverflowClick={onOverflowClick}>
          {avatars(3)}
        </AvatarGroup>,
      );
      const tile = screen.getByRole("button", { name: "Show 2 more" });
      expect(tile).toHaveAttribute("type", "button");
      await user.click(tile);
      expect(onOverflowClick).toHaveBeenCalledTimes(1);
      tile.focus();
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(onOverflowClick).toHaveBeenCalledTimes(3);
    });

    it("is one tab stop for the tile and none for plain avatars", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">before</button>
          <AvatarGroup aria-label="Members" max={2} onOverflowClick={() => {}}>
            {avatars(4)}
          </AvatarGroup>
          <button type="button">after</button>
        </>,
      );
      await user.tab();
      expect(screen.getByRole("button", { name: "before" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Show 2 more" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("never colours the tile with the group's colorful", () => {
      render(
        <AvatarGroup aria-label="Members" max={1} colorful>
          {avatars(3)}
        </AvatarGroup>,
      );
      const tile = screen.getByText("+2").parentElement as HTMLElement;
      for (const family of ["colorDanger", "colorWarning", "colorSuccess", "colorInfo"]) {
        expect(tile).not.toHaveClass(avatarStyles[family] as string);
      }
    });
  });

  describe("settings for the avatars", () => {
    const rootOf = (name: string) => screen.getByRole("img", { name }) as HTMLElement;

    it("hands its size, shape and colorful to the avatars as defaults", () => {
      render(
        <AvatarGroup aria-label="Members" size="lg" shape="square" colorful>
          <Avatar name="Jane Doe" />
          <Avatar name="John Smith" />
        </AvatarGroup>,
      );
      const jane = rootOf("Jane Doe");
      expect(jane).toHaveClass(avatarStyles.rootSquare as string);
      expect(jane.style.getPropertyValue("--avatar-dimension-base")).toBe("var(--dbm-avatar-size-lg)");
      // `colorful` derives a family class from the name; without it the brand colour has none.
      const coloured = [rootOf("Jane Doe"), rootOf("John Smith")].some((el) =>
        ["colorDanger", "colorWarning", "colorSuccess", "colorInfo"].some((family) =>
          el.firstElementChild?.classList.contains(avatarStyles[family] as string),
        ),
      );
      expect(coloured).toBe(true);
    });

    it("lets an avatar's own props win", () => {
      render(
        <AvatarGroup aria-label="Members" size="lg" shape="square">
          <Avatar name="Jane Doe" size="xs" shape="circle" />
        </AvatarGroup>,
      );
      const jane = rootOf("Jane Doe");
      expect(jane).not.toHaveClass(avatarStyles.rootSquare as string);
      expect(jane.style.getPropertyValue("--avatar-dimension-base")).toBe("var(--dbm-avatar-size-xs)");
    });

    it("changes nothing for an avatar outside a group", () => {
      render(<Avatar name="Jane Doe" />);
      const jane = rootOf("Jane Doe");
      expect(jane).not.toHaveClass(avatarStyles.rootSquare as string);
      expect(jane.style.getPropertyValue("--avatar-dimension-base")).toBe("var(--dbm-avatar-size-md)");
    });

    it("hands a responsive size to the avatars", () => {
      render(
        <AvatarGroup aria-label="Members" size={{ base: "sm", md: "xl" }}>
          <Avatar name="Jane Doe" />
        </AvatarGroup>,
      );
      const jane = rootOf("Jane Doe");
      expect(jane.style.getPropertyValue("--avatar-dimension-base")).toBe("var(--dbm-avatar-size-sm)");
      expect(jane.style.getPropertyValue("--avatar-dimension-md")).toBe("var(--dbm-avatar-size-xl)");
    });

    it("sizes the tile like the other avatars", () => {
      render(
        <AvatarGroup aria-label="Members" size="xs" shape="square" max={1}>
          {avatars(3)}
        </AvatarGroup>,
      );
      const tile = screen.getByRole("img", { name: "2 more" });
      expect(tile.style.getPropertyValue("--avatar-dimension-base")).toBe("var(--dbm-avatar-size-xs)");
      expect(tile).toHaveClass(avatarStyles.rootSquare as string);
    });

    it("reaches an avatar wrapped in a tooltip", () => {
      render(
        <AvatarGroup aria-label="Members" size="xl">
          <Tooltip content="Jane Doe">
            <Avatar as="button" name="Jane Doe" />
          </Tooltip>
        </AvatarGroup>,
      );
      expect(screen.getByRole("button", { name: "Jane Doe" }).style.getPropertyValue("--avatar-dimension-base")).toBe(
        "var(--dbm-avatar-size-xl)",
      );
    });

    it("keeps what an outer group set for whatever a nested one leaves out", () => {
      render(
        <AvatarGroup aria-label="Outer" size="xl" shape="square" colorful>
          <AvatarGroup aria-label="Inner" shape="circle">
            <Avatar name="Jane Doe" />
          </AvatarGroup>
        </AvatarGroup>,
      );
      const jane = rootOf("Jane Doe");
      // Its own shape wins; the size it left out comes from the outer group.
      expect(jane).not.toHaveClass(avatarStyles.rootSquare as string);
      expect(jane.style.getPropertyValue("--avatar-dimension-base")).toBe("var(--dbm-avatar-size-xl)");
    });
  });

  describe("layout", () => {
    it("stacks by default and spaces apart with stacked={false}", () => {
      const { rerender } = render(
        <AvatarGroup aria-label="Members" data-testid="group">
          {avatars(2)}
        </AvatarGroup>,
      );
      expect(screen.getByTestId("group")).toHaveClass(styles.stacked as string);
      expect(screen.getByTestId("group")).not.toHaveClass(styles.spaced as string);
      rerender(
        <AvatarGroup aria-label="Members" data-testid="group" stacked={false}>
          {avatars(2)}
        </AvatarGroup>,
      );
      expect(screen.getByTestId("group")).toHaveClass(styles.spaced as string);
      expect(screen.getByTestId("group")).not.toHaveClass(styles.stacked as string);
    });

    it("layers the first avatar highest, and the tile lowest", () => {
      render(
        <AvatarGroup aria-label="Members" max={2} data-testid="group">
          {avatars(4)}
        </AvatarGroup>,
      );
      const layers = screen.getAllByRole("listitem").map((item) => item.style.getPropertyValue("--avatar-group-layer"));
      expect(layers).toEqual(["3", "2", "1"]);
      expect(screen.getByTestId("group").style.getPropertyValue("--avatar-group-count")).toBe("3");
    });

    it("gives each item its avatar's shape for the ring: its own, else the group's", () => {
      render(
        <AvatarGroup aria-label="Members" shape="square" max={2}>
          <Avatar name="Jane Doe" />
          <Avatar name="John Smith" shape="circle" />
          <Avatar name="Alex Kim" />
        </AvatarGroup>,
      );
      expect(screen.getAllByRole("listitem").map((item) => item.getAttribute("data-shape"))).toEqual([
        "square",
        "circle",
        "square",
      ]);
    });
  });

  it("lets a status dot keep the avatar's own announcement", () => {
    render(
      <AvatarGroup aria-label="Members">
        <Avatar name="Jane Doe" status="online" />
      </AvatarGroup>,
    );
    expect(screen.getByRole("img", { name: "Jane Doe, Online" })).toBeInTheDocument();
  });

  it("survives StrictMode", () => {
    render(
      <StrictMode>
        <AvatarGroup aria-label="Members" max={2}>
          {avatars(4)}
        </AvatarGroup>
      </StrictMode>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("updates when the avatars or max change", () => {
    const { rerender } = render(
      <AvatarGroup aria-label="Members" max={2}>
        {avatars(4)}
      </AvatarGroup>,
    );
    expect(screen.getByText("+2")).toBeInTheDocument();
    rerender(
      <AvatarGroup aria-label="Members" max={3}>
        {avatars(4)}
      </AvatarGroup>,
    );
    expect(screen.getByText("+1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("+1"));
  });

  describe("accessibility", () => {
    it.each([
      ["plain", <AvatarGroup key="a" aria-label="Members">{avatars(3)}</AvatarGroup>],
      ["with an overflow tile", <AvatarGroup key="b" aria-label="Members" max={2}>{avatars(5)}</AvatarGroup>],
      ["with an overflow button", <AvatarGroup key="c" aria-label="Members" max={2} onOverflowClick={() => {}}>{avatars(5)}</AvatarGroup>],
      ["spaced", <AvatarGroup key="d" aria-label="Members" stacked={false} size="sm">{avatars(3)}</AvatarGroup>],
      [
        "with status dots and images",
        <AvatarGroup key="e" aria-label="Members" shape="square">
          <Avatar src="/a.jpg" name="Jane Doe" status="online" />
          <Avatar name="John Smith" status="busy" />
        </AvatarGroup>,
      ],
      [
        "of buttons",
        <AvatarGroup key="f" aria-label="Members" max={2} onOverflowClick={() => {}}>
          {people.slice(0, 4).map((name) => (
            <Avatar key={name} as="button" name={name} />
          ))}
        </AvatarGroup>,
      ],
    ])("has no axe violations: %s", async (_label, element) => {
      const { container } = render(element);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
