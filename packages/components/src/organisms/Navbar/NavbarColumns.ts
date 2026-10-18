import { createElement, Fragment } from "react";
import type { ReactElement, ReactNode } from "react";
import { flattenParts } from "./collectParts";
import type { NavbarColumn } from "./Navbar.types";

/** The column each part belongs in when its row is drawn in columns and the part doesn't name one. */
const defaultColumns: Record<string, NavbarColumn> = {
  "Navbar.MenuButton": "start",
  "Navbar.Search": "start",
  "Navbar.Brand": "center",
  "Navbar.Links": "center",
  "Navbar.Actions": "end",
};

export interface NavbarColumnGroup {
  column: NavbarColumn;
  items: ReactNode[];
}

/**
 * A row's parts gathered by column. Within a column the parts keep the order they are written in; the groups come in the order their first
 * part is written (so a brand written first is first in the page, as on a wide window, where the groups flow one after another). A part is in the column it names, else the one it belongs in by default, else the one of the part
 * before it (the start, for the first). Fragments are looked through. `leading` (the automatic menu button) goes first in the start group, which is made, after the others, if no part belongs in it (the automatic button is the row's last part, as it is without columns).
 */
export function groupByColumn(children: ReactNode, leading: ReactNode): NavbarColumnGroup[] {
  const groups: NavbarColumnGroup[] = [];
  const groupOf = (column: NavbarColumn): NavbarColumnGroup => {
    let group = groups.find((candidate) => candidate.column === column);
    if (group === undefined) {
      group = { column, items: [] };
      groups.push(group);
    }
    return group;
  };

  let previous: NavbarColumn = "start";
  const parts: ReactElement[] = flattenParts(children);
  for (const part of parts) {
    const own = (part.props as { column?: NavbarColumn }).column;
    const name = (part.type as { displayName?: string }).displayName;
    const fallback: NavbarColumn | undefined = name === undefined ? undefined : defaultColumns[name];
    const column: NavbarColumn = own ?? fallback ?? previous;
    groupOf(column).items.push(part);
    previous = column;
  }

  if (leading) groupOf("start").items.unshift(createElement(Fragment, { key: "navbar-menu-button" }, leading));
  return groups;
}
