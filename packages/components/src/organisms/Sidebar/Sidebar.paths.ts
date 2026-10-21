import { Children, Fragment, isValidElement } from "react";
import type { ReactNode } from "react";
import type { SidebarMatch } from "./Sidebar.types";

/**
 * The path of an address, to compare with another: what comes before a `?` or a `#`, without a trailing slash (the root stays `"/"`).
 * An address on another site (`https://…`, `//…`) or with no path (`#top`, `?tab=2`) has none, and never matches.
 */
export function pathOf(address: string | undefined): string | null {
  if (address === undefined) return null;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(address)) return null;
  const path = address.split(/[?#]/)[0] ?? "";
  if (path === "") return null;
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}

/**
 * Whether an item's `href` is the page `currentPath` names. `exact` (the default) is the same path; `prefix` also matches a page below it, at a
 * segment boundary (`/reports` is current at `/reports/sales`, and not at `/reportsx`), except the root, which only matches itself.
 */
export function matchesPath(href: string | undefined, currentPath: string | undefined, match: SidebarMatch = "exact"): boolean {
  const target = pathOf(href);
  const page = pathOf(currentPath);
  if (target === null || page === null) return false;
  if (target === page) return true;
  return match === "prefix" && target !== "/" && page.startsWith(`${target}/`);
}

/**
 * Whether any `Sidebar.Item` among some children (through groups, fragments and any element with children) is the current page. It reads the
 * elements as written, so an item drawn by a component of your own, whose `href` is not on an element here, is not seen.
 */
export function holdsPath(children: ReactNode, currentPath: string | undefined): boolean {
  if (currentPath === undefined) return false;
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { href?: string; match?: SidebarMatch; current?: boolean; children?: ReactNode };
    if (child.type !== Fragment && props.href !== undefined) {
      if (props.current ?? matchesPath(props.href, currentPath, props.match)) return true;
    } else if (props.current === true) {
      return true;
    }
    if (holdsPath(props.children, currentPath)) return true;
  }
  return false;
}

/**
 * The total of the numeric `badge`s of the items among some children (through groups, fragments and any element with children), for the badge
 * a group shows while its items are out of sight. Only numbers are added; an item whose badge is text, a `Badge` element or a dot has no count
 * to add. `undefined` when there is no number to add, so a group of items with no counts shows no badge. It reads the elements as written.
 */
export function rolledUpCount(children: ReactNode): number | undefined {
  let total: number | undefined;
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { badge?: unknown; children?: ReactNode };
    if (typeof props.badge === "number" && Number.isFinite(props.badge)) total = (total ?? 0) + props.badge;
    const inner = rolledUpCount(props.children);
    if (inner !== undefined) total = (total ?? 0) + inner;
  }
  return total;
}
