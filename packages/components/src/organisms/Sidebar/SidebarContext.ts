import { createContext, useContext } from "react";
import type { MutableRefObject } from "react";
import type { DrawerOpenChangeDetails } from "../Drawer";
import type {
  SidebarCollapseBelow,
  SidebarCurrentVariant,
  SidebarDirection,
  SidebarLabels,
  SidebarSide,
  SidebarSize,
  SidebarState,
} from "./Sidebar.types";

export const defaultLabels: SidebarLabels = {
  navigation: "Main",
  collapse: "Collapse sidebar",
  expand: "Expand sidebar",
  menu: "Menu",
  close: "Close",
  externalLink: "(opens in a new tab)",
};

/** The state a `Sidebar.Provider` (or a `Sidebar` with no provider around it) holds, and what the buttons outside it need to act on it. */
export interface SidebarStateContextValue {
  /** Whether the sidebar is a rail, and the phone panel's open state, with the functions that change them. */
  state: SidebarState;
  /** The same change as `state.setMenuOpen`, but with the reason, for the panel's own `onOpenChange`. */
  changeMenu: (open: boolean, details: DrawerOpenChangeDetails) => void;
  collapseBelow: SidebarCollapseBelow;
  labels: SidebarLabels;
  /** The menu button last pressed, so focus goes back to it when the panel closes (it is not the panel's own trigger). */
  menuButtonRef: MutableRefObject<HTMLElement | null>;
  /** Whether a `Sidebar` is drawn inside this provider; the buttons outside it read the same size either way. */
  hasSidebar: boolean;
}

export const SidebarStateContext = createContext<SidebarStateContextValue | null>(null);

/** What the parts inside one `Sidebar` read: its settings. `railed` is true for the rail on the page, never for the phone panel. */
export interface SidebarContextValue {
  size: SidebarSize;
  currentVariant: SidebarCurrentVariant;
  /** The page the reader is on, so an item can work out whether it is current. */
  currentPath: string | undefined;
  rounded: boolean;
  side: SidebarSide;
  dir: SidebarDirection;
  railed: boolean;
  closeMenuOnNavigate: boolean;
  menuContainer: HTMLElement | null | undefined;
  /** Closes the phone panel from inside it (an item chosen). */
  closeMenu: () => void;
  /** Whether opening a group closes the groups beside it. */
  exclusive: boolean;
  /** Which groups and collapsible sections the reader has opened or shut, by key: kept here so the page and the phone panel share it. */
  openState: Record<string, boolean>;
  /** Sets one by key. With `exclusive`, opening a group shuts the others registered under the same parent. */
  setOpenState: (key: string, open: boolean, parentKey: string) => void;
  /** Tells the sidebar a group exists under a parent, so `exclusive` knows its siblings; returns the undo. */
  registerGroup: (key: string, parentKey: string) => () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

/** True for the copy of the sidebar drawn in the phone panel, whose items close it when chosen. */
export const SidebarPanelContext = createContext(false);

/** The key of the group a part is inside (a path of labels), so a nested group's state is its own and `exclusive` knows its siblings. */
export const SidebarGroupKeyContext = createContext("");

/** How many groups deep a part is, set by each `Sidebar.Group` around its items. */
export const SidebarLevelContext = createContext(0);

/**
 * Set inside the floating list a rail group opens, where its items are menu items and not list items; the value closes that list.
 * `Menu` closes itself when an item is chosen, but not when the item's own click handler called `preventDefault` (the way a
 * router's link does), so an item closes it by hand then.
 */
export const SidebarMenuContext = createContext<(() => void) | null>(null);

export function useSidebarContext(part: string): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (context === null) {
    throw new Error(`${part} must be used inside <Sidebar>.`);
  }
  return context;
}

export function useSidebarStateContext(part: string): SidebarStateContextValue {
  const context = useContext(SidebarStateContext);
  if (context === null) {
    throw new Error(`${part} must be used inside <Sidebar> or <Sidebar.Provider>.`);
  }
  return context;
}

/**
 * The sidebar's state and the functions that change it, from inside a `Sidebar` or a `Sidebar.Provider`. `collapsed` is what the part
 * calling it sees: a header drawn in the phone panel is never in a rail.
 */
export function useSidebar(): SidebarState {
  const { state } = useSidebarStateContext("useSidebar");
  const sidebar = useContext(SidebarContext);
  // A part drawn expanded (in the phone panel, or in a rail that is peeking open) sees a sidebar that is not collapsed.
  return sidebar !== null && !sidebar.railed && state.collapsed ? { ...state, collapsed: false } : state;
}
