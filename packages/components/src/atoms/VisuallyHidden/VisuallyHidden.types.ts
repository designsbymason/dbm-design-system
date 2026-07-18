import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface VisuallyHiddenProps extends ComponentPropsWithoutRef<"span"> {
  children: ReactNode;
}
