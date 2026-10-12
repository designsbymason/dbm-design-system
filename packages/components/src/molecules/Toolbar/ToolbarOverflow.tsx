import { DotsThreeIcon } from "@dbm-design-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import * as ToolbarPrimitive from "@radix-ui/react-toolbar";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from "react";
import { IconButton } from "../../atoms/IconButton";
import type { IconButtonProps } from "../../atoms/IconButton";
import { Menu } from "../../organisms/Menu";
import type { ToolbarDirection } from "./Toolbar.types";

/** `useLayoutEffect` where there is a DOM to lay out, so a server render doesn't warn. */
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * What a part tells the bar about itself so it can stand in for it in the overflow menu. Read when the menu opens, from
 * the part's latest props, and the state a toggle is in from the DOM, so an uncontrolled toggle reads right too.
 */
export type OverflowEntry =
  | { kind: "button"; label: ReactNode; icon?: PhosphorIcon; disabled: boolean; danger: boolean }
  | { kind: "icon-button"; label: string; icon: PhosphorIcon; disabled: boolean; danger: boolean; pressed?: boolean }
  | { kind: "group"; label?: string }
  | { kind: "toggle-group"; label?: string; multiple: boolean; disabled: boolean }
  | { kind: "toggle-item"; value: string; label: ReactNode; icon?: PhosphorIcon; disabled: boolean };

export type OverflowRegistry = Map<HTMLElement, () => OverflowEntry>;

interface ToolbarOverflowContextValue {
  register: (node: HTMLElement, entry: () => OverflowEntry) => () => void;
}

/** `null` unless the bar's `overflow` is `"menu"`, which is how a part knows whether to say anything about itself. */
export const ToolbarOverflowContext = createContext<ToolbarOverflowContextValue | null>(null);

/** What a part's root carries so the bar can tell what it is and whether it may collapse. Nothing outside menu mode. */
export function overflowPartProps(
  overflow: ToolbarOverflowContextValue | null,
  part: "button" | "icon-button" | "group" | "toggle-group" | "item" | "separator" | "spacer",
  pinned = false,
): Record<string, string | true | undefined> {
  if (!overflow) return {};
  return { "data-toolbar-part": part, "data-pinned": pinned ? true : undefined };
}

/** Registers a part with the bar for as long as it is mounted, reading its latest props when the menu is built. */
export function useOverflowEntry(nodeRef: RefObject<HTMLElement | null>, entry: () => OverflowEntry) {
  const overflow = useContext(ToolbarOverflowContext);
  const latest = useRef(entry);
  useEffect(() => {
    latest.current = entry;
  });
  useEffect(() => {
    const node = nodeRef.current;
    if (!overflow || !node) return undefined;
    return overflow.register(node, () => latest.current());
  }, [overflow, nodeRef]);
}

const COLLAPSIBLE = new Set(["button", "icon-button", "group", "toggle-group"]);

/**
 * Lays the bar out for the room it has: shows every item when they fit, and otherwise hides items from the end, one at a
 * time, until the rest and the "more" button fit. A hidden item stays in the page (`display: none`, by
 * `data-overflowed`), which is what lets the menu press it for real and read its state.
 *
 * Never hidden: an item the author pinned, an item that is not a button, a group or a toggle group (a `Toolbar.Item` can't
 * be shown as a menu item), a spacer, and whatever holds keyboard focus (a control the person is on isn't taken from them;
 * it is hidden on a later pass, once focus has moved on). A separator is hidden when it would be left at an edge or next
 * to another one.
 *
 * Returns whether anything is hidden.
 */
export function applyOverflow(bar: HTMLElement): boolean {
  const nodes = Array.from(bar.children) as HTMLElement[];
  const trigger = nodes.find((node) => node.hasAttribute("data-toolbar-overflow"));
  const items = nodes.filter((node) => node !== trigger);
  for (const node of nodes) node.removeAttribute("data-overflowed");

  const style = getComputedStyle(bar);
  const gap = Number.parseFloat(style.columnGap) || 0;
  const available =
    bar.clientWidth - (Number.parseFloat(style.paddingInlineStart) || 0) - (Number.parseFloat(style.paddingInlineEnd) || 0);
  const partOf = (node: HTMLElement) => node.getAttribute("data-toolbar-part");
  const widthOf = (node: HTMLElement) => (partOf(node) === "spacer" ? 0 : node.getBoundingClientRect().width);

  const natural = items.reduce((sum, node) => sum + widthOf(node), 0) + gap * Math.max(0, items.length - 1);
  if (natural <= available + 0.5) {
    trigger?.setAttribute("data-overflowed", "");
    return false;
  }

  const triggerWidth = trigger ? trigger.getBoundingClientRect().width : 0;
  let used = natural + (trigger ? gap + triggerWidth : 0);
  const focused = document.activeElement;
  const hidden = new Set<HTMLElement>();
  for (let index = items.length - 1; index >= 0 && used > available + 0.5; index -= 1) {
    const node = items[index] as HTMLElement;
    const part = partOf(node);
    if (!part || !COLLAPSIBLE.has(part) || node.hasAttribute("data-pinned") || node.contains(focused)) continue;
    hidden.add(node);
    used -= widthOf(node) + gap;
  }
  if (hidden.size === 0) {
    trigger?.setAttribute("data-overflowed", "");
    return false;
  }

  // A separator survives only after something that is still shown and before something that is (the "more" button
  // counts), and never straight after another separator once the hidden items between them are out of the way.
  const shown = (node: HTMLElement) => !hidden.has(node) && partOf(node) !== "separator" && partOf(node) !== "spacer";
  let lastShown: "item" | "separator" | null = null;
  items.forEach((node, index) => {
    if (hidden.has(node) || partOf(node) === "spacer") return;
    if (partOf(node) !== "separator") {
      lastShown = "item";
      return;
    }
    const hasAfter = items.slice(index + 1).some(shown) || Boolean(trigger);
    if (lastShown !== "item" || !hasAfter) hidden.add(node);
    else lastShown = "separator";
  });
  for (const node of hidden) node.setAttribute("data-overflowed", "");
  return true;
}

interface OverflowMenuProps {
  barRef: RefObject<HTMLElement | null>;
  registry: MutableRefObject<OverflowRegistry>;
  label: string;
  size: IconButtonProps["size"];
  variant: IconButtonProps["variant"];
  rounded: boolean;
  disabled: boolean;
  dir: ToolbarDirection;
}

/** The hidden top-level nodes of the bar, in the order they are drawn. */
function hiddenNodes(bar: HTMLElement): HTMLElement[] {
  return (Array.from(bar.children) as HTMLElement[]).filter((node) => node.hasAttribute("data-overflowed") && !node.hasAttribute("data-toolbar-overflow"));
}

/** What the hidden items are, as menu items, read from the parts' latest props and the DOM's current state. */
function buildItems(bar: HTMLElement, registry: OverflowRegistry): ReactNode[] {
  const entryOf = (node: HTMLElement) => registry.get(node)?.();
  const within = (container: HTMLElement) =>
    Array.from(registry.keys())
      .filter((node) => node !== container && container.contains(node))
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  const press = (node: HTMLElement) => () => {
    // The part is hidden but present, so its own handler runs for real.
    node.click();
  };

  const single = (node: HTMLElement, entry: OverflowEntry, key: string): ReactNode => {
    if (entry.kind === "button") {
      return (
        <Menu.Item key={key} icon={entry.icon} tone={entry.danger ? "danger" : "neutral"} disabled={entry.disabled} onSelect={press(node)}>
          {entry.label}
        </Menu.Item>
      );
    }
    if (entry.kind === "icon-button") {
      if (entry.pressed !== undefined) {
        return (
          <Menu.CheckboxItem key={key} icon={entry.icon} checked={entry.pressed} disabled={entry.disabled} onSelect={press(node)}>
            {entry.label}
          </Menu.CheckboxItem>
        );
      }
      return (
        <Menu.Item key={key} icon={entry.icon} tone={entry.danger ? "danger" : "neutral"} disabled={entry.disabled} onSelect={press(node)}>
          {entry.label}
        </Menu.Item>
      );
    }
    return null;
  };

  const render = (node: HTMLElement, key: string): ReactNode => {
    const part = node.getAttribute("data-toolbar-part");
    if (part === "separator") return <Menu.Separator key={key} />;
    const entry = entryOf(node);
    if (!entry) return null;
    if (entry.kind === "group") {
      const children = within(node).map((child, index) => render(child, `${key}.${index}`));
      return (
        <Menu.Group key={key} aria-label={entry.label}>
          {entry.label ? <Menu.Label>{entry.label}</Menu.Label> : null}
          {children}
        </Menu.Group>
      );
    }
    if (entry.kind === "toggle-group") {
      const toggles = within(node)
        .map((child) => ({ child, entry: entryOf(child) }))
        .filter((pair): pair is { child: HTMLElement; entry: Extract<OverflowEntry, { kind: "toggle-item" }> } => pair.entry?.kind === "toggle-item");
      const isOn = (child: HTMLElement) => child.getAttribute("data-state") === "on";
      if (entry.multiple) {
        return (
          <Menu.Group key={key} aria-label={entry.label}>
            {entry.label ? <Menu.Label>{entry.label}</Menu.Label> : null}
            {toggles.map(({ child, entry: item }, index) => (
              <Menu.CheckboxItem
                key={`${key}.${index}`}
                icon={item.icon}
                checked={isOn(child)}
                disabled={item.disabled || entry.disabled}
                onSelect={press(child)}
              >
                {item.label}
              </Menu.CheckboxItem>
            ))}
          </Menu.Group>
        );
      }
      const chosen = toggles.find(({ child }) => isOn(child))?.entry.value ?? "";
      return (
        <Menu.RadioGroup
          key={key}
          aria-label={entry.label}
          value={chosen}
          onValueChange={(next) => toggles.find(({ entry: item }) => item.value === next)?.child.click()}
        >
          {entry.label ? <Menu.Label>{entry.label}</Menu.Label> : null}
          {toggles.map(({ entry: item }, index) => (
            <Menu.RadioItem key={`${key}.${index}`} value={item.value} icon={item.icon} disabled={item.disabled || entry.disabled}>
              {item.label}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      );
    }
    return single(node, entry, key);
  };

  return hiddenNodes(bar).map((node, index) => render(node, String(index)));
}

/**
 * The "more" button at the end of a bar whose `overflow` is `"menu"`, and the menu of what didn't fit. It is itself an
 * item in the bar's arrow-key order, and is hidden (not removed) while everything fits. The menu is built when it opens,
 * from the hidden items, so pressing one in it presses the real item.
 */
export function ToolbarOverflowMenu({ barRef, registry, label, size, variant, rounded, disabled, dir }: OverflowMenuProps) {
  const [items, setItems] = useState<ReactNode[]>([]);
  const refresh = () => {
    const bar = barRef.current;
    if (bar) setItems(buildItems(bar, registry.current));
  };
  return (
    <Menu
      dir={dir}
      onOpenChange={(open) => {
        if (open) refresh();
      }}
    >
      <ToolbarPrimitive.Button asChild disabled={disabled}>
        <Menu.Trigger asChild>
          <IconButton
            icon={DotsThreeIcon}
            aria-label={label}
            tooltip
            size={size}
            variant={variant}
            rounded={rounded}
            disabled={disabled}
            data-toolbar-overflow=""
            data-overflowed=""
          />
        </Menu.Trigger>
      </ToolbarPrimitive.Button>
      <Menu.Content
        align="end"
        size={size}
        // A press on a toggle in the menu changes it in the bar; the menu stays open, so it is read again.
        onClick={() => requestAnimationFrame(refresh)}
      >
        {items}
      </Menu.Content>
    </Menu>
  );
}
