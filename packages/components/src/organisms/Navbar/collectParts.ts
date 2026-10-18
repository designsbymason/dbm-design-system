import { Children, Fragment, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * The elements among some children, with fragments looked through: `Children.toArray` leaves a fragment as one element, and
 * the bar has to find its parts (the links, the menu button, the rows) wherever an author grouped them in one.
 */
export function flattenParts(children: ReactNode): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type === Fragment) {
      elements.push(...flattenParts((child.props as { children?: ReactNode }).children));
    } else {
      elements.push(child);
    }
  }
  return elements;
}

/** The children of an element, as `props.children`. */
export function childrenOf(element: ReactElement): ReactNode {
  return (element.props as { children?: ReactNode }).children;
}
