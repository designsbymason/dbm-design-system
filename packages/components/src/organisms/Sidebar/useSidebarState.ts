import { useCallback, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { DrawerOpenChangeDetails } from "../Drawer";
import type { SidebarOwnState } from "./SidebarContext";
import type { SidebarStateProps } from "./Sidebar.types";

export interface SidebarStateController {
  state: SidebarOwnState;
  changeMenu: (open: boolean, details: DrawerOpenChangeDetails) => void;
  menuButtonRef: MutableRefObject<HTMLElement | null>;
}

/**
 * The sidebar's two pieces of state, each controlled (a prop) or uncontrolled (held here), as `Dialog` and `Drawer` hold theirs. Used
 * by `Sidebar.Provider` and by a `Sidebar` that has none around it.
 */
export function useSidebarState({
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  menuOpen,
  defaultMenuOpen = false,
  onMenuOpenChange,
}: Pick<
  SidebarStateProps,
  "collapsed" | "defaultCollapsed" | "onCollapsedChange" | "menuOpen" | "defaultMenuOpen" | "onMenuOpenChange"
>): SidebarStateController {
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
  const [uncontrolledMenuOpen, setUncontrolledMenuOpen] = useState(defaultMenuOpen);
  const isCollapsedControlled = collapsed !== undefined;
  const isMenuControlled = menuOpen !== undefined;
  const currentCollapsed = isCollapsedControlled ? collapsed : uncontrolledCollapsed;
  const currentMenuOpen = isMenuControlled ? menuOpen : uncontrolledMenuOpen;
  const menuButtonRef = useRef<HTMLElement | null>(null);

  const setCollapsed = useCallback(
    (next: boolean) => {
      if (!isCollapsedControlled) setUncontrolledCollapsed(next);
      onCollapsedChange?.(next);
    },
    [isCollapsedControlled, onCollapsedChange],
  );

  const toggleCollapsed = useCallback(() => setCollapsed(!currentCollapsed), [setCollapsed, currentCollapsed]);

  const changeMenu = useCallback(
    (next: boolean, details: DrawerOpenChangeDetails) => {
      if (!isMenuControlled) setUncontrolledMenuOpen(next);
      onMenuOpenChange?.(next, details);
    },
    [isMenuControlled, onMenuOpenChange],
  );

  const setMenuOpen = useCallback((next: boolean) => changeMenu(next, { reason: next ? "trigger" : "close" }), [changeMenu]);

  const state = useMemo<SidebarOwnState>(
    () => ({ collapsed: currentCollapsed, setCollapsed, toggleCollapsed, menuOpen: currentMenuOpen, setMenuOpen }),
    [currentCollapsed, setCollapsed, toggleCollapsed, currentMenuOpen, setMenuOpen],
  );

  return { state, changeMenu, menuButtonRef };
}
